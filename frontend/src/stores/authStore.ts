import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AuthApi, LoginRequest, LoginResponse, AuthUser } from '../generated/api';
import axiosClient from '../api/axiosClient';

export interface User {
  id: string;
  telegram_id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  role: 'user' | 'admin' | 'super-admin';
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
  token: string | null; // OPTIMIZATION: Cache token in memory to avoid repeated localStorage reads
  permissions: string[]; // NEW: Stocker les permissions de l'utilisateur
  loading: boolean;
  error: string | null;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, email?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setToken: (token: string | null) => void; // OPTIMIZATION: Set cached token
  getToken: () => string | null; // OPTIMIZATION: Get cached token
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;

  // Computed
  isAdmin: () => boolean;
  hasPermission: (permission: string) => boolean; // NEW: Vérifier une permission
  hasCashAccess: () => boolean;
  hasReceptionAccess: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentUser: null,
        isAuthenticated: false,
        token: null, // OPTIMIZATION: Cached token in memory
        permissions: [], // NEW
        loading: false,
        error: null,

        // Actions
        login: async (username: string, password: string) => {
          set({ loading: true, error: null });
          try {
            const loginData: LoginRequest = { username, password };
            const response: LoginResponse = await AuthApi.apiv1authloginpost(loginData);
            
            // OPTIMIZATION: Store token in both localStorage (persistence) and memory (cache)
            localStorage.setItem('token', response.access_token);
            axiosClient.defaults.headers.common['Authorization'] = `Bearer ${response.access_token}`;

            // Récupérer les permissions de l'utilisateur
            let userPermissions: string[] = [];
            try {
              const permissionsResponse = await axiosClient.get('/v1/users/me/permissions');
              userPermissions = permissionsResponse.data.permissions || [];
            } catch (permError) {
              console.error("Could not fetch user permissions", permError);
              // Ne pas bloquer le login si les permissions ne peuvent être récupérées
            }
            
            const user: User = {
              id: response.user.id,
              telegram_id: response.user.telegram_id,
              username: response.user.username,
              first_name: response.user.first_name,
              last_name: response.user.last_name,
              email: (response.user as any).email,
              phone_number: (response.user as any).phone_number,
              address: (response.user as any).address,
              role: response.user.role as User['role'],
              status: response.user.status as User['status'],
              is_active: response.user.is_active,
              created_at: response.user.created_at || new Date().toISOString(),
              updated_at: response.user.updated_at || new Date().toISOString()
            };
            
            set({
              currentUser: user,
              isAuthenticated: true,
              token: response.access_token, // OPTIMIZATION: Cache token in memory
              permissions: userPermissions, // NEW
              loading: false,
              error: null
            });
          } catch (error: any) {
            let errorMessage = 'Erreur de connexion';
            if (error?.detail) {
              errorMessage = Array.isArray(error.detail) ? error.detail.map((e: any) => e.msg).join(', ') : error.detail;
            } else if (error?.message) {
              errorMessage = error.message;
            }
            set({ error: errorMessage, loading: false });
            throw new Error(errorMessage);
          }
        },

        signup: async (username: string, password: string, email?: string) => {
          set({ loading: true, error: null });
          try {
            const signupData = { username, password, email };
            await AuthApi.apiv1authsignuppost(signupData);
            set({ loading: false, error: null });
          } catch (error: any) {
            let errorMessage = "Erreur lors de l'inscription";
            
            // Gestion spécifique de l'erreur 409 Conflict pour email dupliqué
            if (error?.response?.status === 409) {
              errorMessage = error?.response?.data?.detail || 'Un compte avec cet email existe déjà';
            } else if (error?.detail) {
              errorMessage = Array.isArray(error.detail) ? error.detail.map((e: any) => e.msg).join(', ') : error.detail;
            } else if (error?.message) {
              errorMessage = error.message;
            }
            
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        forgotPassword: async (email: string) => {
          set({ loading: true, error: null });
          try {
            await axiosClient.post('/v1/auth/forgot-password', { email });
            set({ loading: false, error: null });
          } catch (error: any) {
            const errorMessage = error?.response?.data?.detail || error?.message || "Erreur lors de l'envoi de l'email";
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        resetPassword: async (token: string, newPassword: string) => {
          set({ loading: true, error: null });
          try {
            await axiosClient.post('/v1/auth/reset-password', { token, new_password: newPassword });
            set({ loading: false, error: null });
          } catch (error: any) {
            const errorMessage = error?.response?.data?.detail || error?.message || "Erreur lors de la réinitialisation";
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),
        setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
        setToken: (token) => set({ token }), // OPTIMIZATION: Set cached token
        getToken: () => get().token, // OPTIMIZATION: Get cached token from memory
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        
        logout: async () => {
          try {
            // Appeler l'API de logout pour enregistrer l'événement d'audit
            // Même si l'appel échoue, on procède quand même à la déconnexion locale
            try {
              await axiosClient.post('/v1/auth/logout');
            } catch (apiError) {
              // Log l'erreur mais ne pas bloquer la déconnexion
              console.warn('Logout API call failed, proceeding with local logout:', apiError);
            }
          } catch (error) {
            // En cas d'erreur, on continue quand même la déconnexion locale
            console.warn('Logout API call failed, proceeding with local logout:', error);
          } finally {
            // Toujours procéder à la déconnexion locale
            localStorage.removeItem('token');
            delete axiosClient.defaults.headers.common['Authorization'];
            set({ currentUser: null, isAuthenticated: false, token: null, permissions: [], error: null }); // OPTIMIZATION: Clear cached token
          }
        },

        initializeAuth: async () => {
          // OPTIMIZATION: Read from localStorage only once on app init, then cache in memory
          const token = localStorage.getItem('token');
          if (!token) {
            set({ currentUser: null, isAuthenticated: false, token: null, permissions: [], loading: false });
            return;
          }
          axiosClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // Cache the token in memory for subsequent requests
          set({ isAuthenticated: true, token, loading: false });
          // TODO: Récupérer l'utilisateur et les permissions ici pour valider le token
        },

        // Computed
        isAdmin: () => {
          const { currentUser } = get();
          return currentUser?.role === 'admin' || currentUser?.role === 'super-admin';
        },

        hasPermission: (permission: string) => {
          const { permissions, currentUser } = get();
          // Admins and Super-admins have all permissions
          if (currentUser?.role === 'admin' || currentUser?.role === 'super-admin') return true;
          return permissions.includes(permission);
        },

        hasCashAccess: () => {
          const { permissions, currentUser } = get();
          // Admins and Super-admins always have access
          if (currentUser?.role === 'admin' || currentUser?.role === 'super-admin') return true;
          // Volunteers need the permission
          return permissions.includes('caisse.access');
        },

        hasReceptionAccess: () => {
          const { permissions, currentUser } = get();
          // Admins and Super-admins always have access
          if (currentUser?.role === 'admin' || currentUser?.role === 'super-admin') return true;
          // Volunteers need the permission
          return permissions.includes('reception.access');
        }
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({ 
          currentUser: state.currentUser,
          isAuthenticated: state.isAuthenticated,
          permissions: state.permissions // NEW
        })
      }
    ),
    {
      name: 'auth-store'
    }
  )
);

export default useAuthStore;
