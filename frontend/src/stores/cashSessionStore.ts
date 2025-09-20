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

export interface SaleItem {
  id: string;
  category: string;
  quantity: number;
  price: number;
  total: number;
}

export interface SaleCreate {
  cash_session_id: string;
  items: {
    category: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  total_amount: number;
}

interface CashSessionState {
  // State
  currentSession: CashSession | null;
  sessions: CashSession[];
  currentSaleItems: SaleItem[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setCurrentSession: (session: CashSession | null) => void;
  setSessions: (sessions: CashSession[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Sale actions
  addSaleItem: (item: Omit<SaleItem, 'id'>) => void;
  removeSaleItem: (itemId: string) => void;
  updateSaleItem: (itemId: string, newQty: number, newPrice: number) => void;
  clearCurrentSale: () => void;
  submitSale: (items: SaleItem[]) => Promise<boolean>;
  
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
        currentSaleItems: [],
        loading: false,
        error: null,

        // Setters
        setCurrentSession: (session) => set({ currentSession: session }),
        setSessions: (sessions) => set({ sessions }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        // Sale actions
        addSaleItem: (item: Omit<SaleItem, 'id'>) => {
          const newItem: SaleItem = {
            ...item,
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };

          set((state) => ({
            currentSaleItems: [...state.currentSaleItems, newItem]
          }));
        },

        removeSaleItem: (itemId: string) => {
          set((state) => ({
            currentSaleItems: state.currentSaleItems.filter(item => item.id !== itemId)
          }));
        },

        updateSaleItem: (itemId: string, newQty: number, newPrice: number) => {
          set((state) => ({
            currentSaleItems: state.currentSaleItems.map(item => 
              item.id === itemId 
                ? { 
                    ...item, 
                    quantity: newQty, 
                    price: newPrice, 
                    total: newQty * newPrice 
                  }
                : item
            )
          }));
        },

        clearCurrentSale: () => {
          set({ currentSaleItems: [] });
        },

        submitSale: async (items: SaleItem[]): Promise<boolean> => {
          const { currentSession } = get();

          if (!currentSession) {
            set({ error: 'Aucune session de caisse active' });
            return false;
          }

          set({ loading: true, error: null });

          try {
            const saleData: SaleCreate = {
              cash_session_id: currentSession.id,
              items: items.map(item => ({
                category: item.category,
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.total
              })),
              total_amount: items.reduce((sum, item) => sum + item.total, 0)
            };

            // Call API to create sale
            const response = await fetch('/api/v1/sales', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(saleData)
            });

            if (!response.ok) {
              throw new Error('Erreur lors de l\'enregistrement de la vente');
            }

            // Clear current sale on success
            set({
              currentSaleItems: [],
              loading: false
            });

            return true;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement de la vente';
            set({ error: errorMessage, loading: false });
            return false;
          }
        },

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

        closeSession: async (sessionId: string, closeData?: { actual_amount: number; variance_comment?: string }): Promise<boolean> => {
          set({ loading: true, error: null });
          
          try {
            let success: boolean;
            
            if (closeData) {
              // Fermeture avec contrôle des montants
              const closedSession = await cashSessionService.closeSessionWithAmounts(
                sessionId, 
                closeData.actual_amount, 
                closeData.variance_comment
              );
              success = !!closedSession;
            } else {
              // Fermeture simple
              success = await cashSessionService.closeSession(sessionId);
            }
            
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
          currentSession: state.currentSession,
          currentSaleItems: state.currentSaleItems
        })
      }
    ),
    {
      name: 'cash-session-store'
    }
  )
);

export default useCashSessionStore;
