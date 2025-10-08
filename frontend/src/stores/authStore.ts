import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AuthApi, LoginRequest, LoginResponse, AuthUser } from '../generated/api';
import axios from 'axios';

export interface User {
  id: string;
  telegram_id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  role: 'user' | 'admin' | 'super-admin' | 'manager';
  status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  site_id?: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  // State
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, email?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  logout: () => void;
  initializeAuth: () => Promise<void>;

  // Computed
  isAdmin: () => boolean;
  hasCashAccess: () => boolean;
  canManageUsers: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentUser: null,
        isAuthenticated: false,
        loading: false,
        error: null,

        // Actions
        login: async (username: string, password: string) => {
          set({ loading: true, error: null });
          try {
            const loginData: LoginRequest = { username, password };
            const response: LoginResponse = await AuthApi.apiv1authloginpost(loginData);
            
            // Stocker le token JWT
            localStorage.setItem('token', response.access_token);
            
            // Convertir AuthUser en User
            const user: User = {
              id: response.user.id,
              telegram_id: response.user.telegram_id,
              username: response.user.username,
              first_name: response.user.first_name,
              last_name: response.user.last_name,
              role: response.user.role as User['role'],
              status: response.user.status as User['status'],
              is_active: response.user.is_active,
              created_at: response.user.created_at || new Date().toISOString(),
              updated_at: response.user.updated_at || new Date().toISOString()
            };
            
            set({ 
              currentUser: user, 
              isAuthenticated: true, 
              loading: false,
              error: null 
            });
          } catch (error: any) {
            let errorMessage = 'Erreur de connexion';

            // L'interceptor Axios retourne directement error.response.data
            if (error?.detail) {
              // Gérer les erreurs de validation (array)
              if (Array.isArray(error.detail)) {
                errorMessage = error.detail.map((e: any) => e.msg).join(', ');
              } else {
                errorMessage = error.detail;
              }
            } else if (error?.response?.data?.detail) {
              // Fallback si l'interceptor n'a pas fonctionné
              if (Array.isArray(error.response.data.detail)) {
                errorMessage = error.response.data.detail.map((e: any) => e.msg).join(', ');
              } else {
                errorMessage = error.response.data.detail;
              }
            } else if (error?.message) {
              errorMessage = error.message;
            } else if (typeof error === 'string') {
              errorMessage = error;
            }

            set({
              error: errorMessage,
              loading: false
            });
            throw new Error(errorMessage);
          }
        },

        signup: async (username: string, password: string, email?: string) => {
          set({ loading: true, error: null });
          try {
            const signupData = { username, password, email };
            const response = await AuthApi.apiv1authsignuppost(signupData);

            set({
              loading: false,
              error: null
            });

            // Note: L'utilisateur n'est pas connecté automatiquement après l'inscription
            // car son compte est en attente de validation
          } catch (error: any) {
            const errorMessage = error?.detail || error?.message || "Erreur lors de l'inscription";
            set({
              error: errorMessage,
              loading: false
            });
            throw error;
          }
        },

        forgotPassword: async (email: string) => {
          set({ loading: true, error: null });
          try {
            const API_BASE_URL = import.meta.env.REACT_APP_API_URL || import.meta.env.VITE_API_URL || '';
            const response = await axios.post(`${API_BASE_URL}/api/v1/auth/forgot-password`, { email });

            set({
              loading: false,
              error: null
            });
          } catch (error: any) {
            const errorMessage = error?.response?.data?.detail || error?.message || "Erreur lors de l'envoi de l'email";
            set({
              error: errorMessage,
              loading: false
            });
            throw error;
          }
        },

        resetPassword: async (token: string, newPassword: string) => {
          set({ loading: true, error: null });
          try {
            const API_BASE_URL = import.meta.env.REACT_APP_API_URL || import.meta.env.VITE_API_URL || '';
            const response = await axios.post(`${API_BASE_URL}/api/v1/auth/reset-password`, {
              token,
              new_password: newPassword
            });

            set({
              loading: false,
              error: null
            });
          } catch (error: any) {
            const errorMessage = error?.response?.data?.detail || error?.message || "Erreur lors de la réinitialisation";
            set({
              error: errorMessage,
              loading: false
            });
            throw error;
          }
        },

        // Setters
        setCurrentUser: (user) => set({ 
          currentUser: user, 
          isAuthenticated: !!user 
        }),
        setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        
        logout: () => {
          set({ 
            currentUser: null, 
            isAuthenticated: false, 
            error: null 
          });
          localStorage.removeItem('token');
        },

        initializeAuth: async () => {
          const token = localStorage.getItem('token');
          if (!token) {
            set({ 
              currentUser: null, 
              isAuthenticated: false, 
              loading: false 
            });
            return;
          }

          // Pour l'instant, on fait confiance au token stocké
          // L'intercepteur axios gérera les erreurs 401/403
          set({ 
            isAuthenticated: true, 
            loading: false 
          });
        },

        // Computed
        isAdmin: () => {
          const { currentUser } = get();
          return currentUser?.role === 'admin' || currentUser?.role === 'super-admin';
        },

        hasCashAccess: () => {
          const { currentUser } = get();
          // La caisse est accessible aux utilisateurs, managers et admins
          return currentUser?.role === 'user' || currentUser?.role === 'manager' || get().isAdmin();
        },

        canManageUsers: () => {
          const { currentUser } = get();
          return currentUser?.role === 'admin' || currentUser?.role === 'super-admin';
        }
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({ 
          currentUser: state.currentUser,
          isAuthenticated: state.isAuthenticated
        })
      }
    ),
    {
      name: 'auth-store'
    }
  )
);

export default useAuthStore;
