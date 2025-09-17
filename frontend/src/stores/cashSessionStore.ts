import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { cashSessionService } from '../services/cashSessionService';

export interface CashSession {
  id: string;
  operator_id: string;
  initial_amount: number;
  current_amount: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
  total_sales?: number;
  total_items?: number;
}

export interface CashSessionCreate {
  operator_id: string;
  initial_amount: number;
}

export interface CashSessionUpdate {
  status?: 'open' | 'closed';
  current_amount?: number;
  total_sales?: number;
  total_items?: number;
}

interface CashSessionState {
  // State
  currentSession: CashSession | null;
  sessions: CashSession[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setCurrentSession: (session: CashSession | null) => void;
  setSessions: (sessions: CashSession[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Async actions
  openSession: (data: CashSessionCreate) => Promise<CashSession | null>;
  closeSession: (sessionId: string) => Promise<boolean>;
  updateSession: (sessionId: string, data: CashSessionUpdate) => Promise<boolean>;
  fetchSessions: () => Promise<void>;
  fetchCurrentSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const useCashSessionStore = create<CashSessionState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentSession: null,
        sessions: [],
        loading: false,
        error: null,

        // Setters
        setCurrentSession: (session) => set({ currentSession: session }),
        setSessions: (sessions) => set({ sessions }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        // Async actions
        openSession: async (data: CashSessionCreate): Promise<CashSession | null> => {
          set({ loading: true, error: null });
          
          try {
            const session = await cashSessionService.createSession(data);
            set({ 
              currentSession: session, 
              loading: false 
            });
            
            // Sauvegarder en local pour la persistance
            localStorage.setItem('currentCashSession', JSON.stringify(session));
            
            return session;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ouverture de session';
            set({ error: errorMessage, loading: false });
            return null;
          }
        },

        closeSession: async (sessionId: string): Promise<boolean> => {
          set({ loading: true, error: null });
          
          try {
            const success = await cashSessionService.closeSession(sessionId);
            
            if (success) {
              set({ 
                currentSession: null, 
                loading: false 
              });
              
              // Supprimer de la persistance locale
              localStorage.removeItem('currentCashSession');
            }
            
            return success;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la fermeture de session';
            set({ error: errorMessage, loading: false });
            return false;
          }
        },

        updateSession: async (sessionId: string, data: CashSessionUpdate): Promise<boolean> => {
          set({ loading: true, error: null });
          
          try {
            const updatedSession = await cashSessionService.updateSession(sessionId, data);
            
            if (updatedSession) {
              const { currentSession } = get();
              
              // Mettre à jour la session courante si c'est la même
              if (currentSession && currentSession.id === sessionId) {
                set({ 
                  currentSession: updatedSession, 
                  loading: false 
                });
                
                // Mettre à jour la persistance locale
                localStorage.setItem('currentCashSession', JSON.stringify(updatedSession));
              }
            }
            
            return !!updatedSession;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de session';
            set({ error: errorMessage, loading: false });
            return false;
          }
        },

        fetchSessions: async (): Promise<void> => {
          set({ loading: true, error: null });
          
          try {
            const sessions = await cashSessionService.getSessions();
            set({ sessions, loading: false });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des sessions';
            set({ error: errorMessage, loading: false });
          }
        },

        fetchCurrentSession: async (): Promise<void> => {
          set({ loading: true, error: null });
          
          try {
            // Essayer de récupérer depuis le localStorage d'abord
            const localSession = localStorage.getItem('currentCashSession');
            if (localSession) {
              const session = JSON.parse(localSession);
              
              // Vérifier que la session est toujours ouverte côté serveur
              const serverSession = await cashSessionService.getSession(session.id);
              if (serverSession && serverSession.status === 'open') {
                set({ currentSession: serverSession, loading: false });
                return;
              } else {
                // Session fermée côté serveur, nettoyer le localStorage
                localStorage.removeItem('currentCashSession');
              }
            }
            
            set({ currentSession: null, loading: false });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la récupération de la session';
            set({ error: errorMessage, loading: false });
          }
        },

        refreshSession: async (): Promise<void> => {
          const { currentSession } = get();
          if (currentSession) {
            await get().fetchCurrentSession();
          }
        }
      }),
      {
        name: 'cash-session-store',
        partialize: (state) => ({ 
          currentSession: state.currentSession 
        })
      }
    ),
    {
      name: 'cash-session-store'
    }
  )
);

export default useCashSessionStore;
