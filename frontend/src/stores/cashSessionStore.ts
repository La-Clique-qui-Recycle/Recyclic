import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { cashSessionService } from '../services/cashSessionService';
import axiosClient from '../api/axiosClient';

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
  site_id: string;
  register_id?: string;
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
  subcategory?: string;
  categoryName?: string;
  subcategoryName?: string;
  quantity: number;
  weight: number;  // Poids en kg
  price: number;
  total: number;
}

export interface SaleCreate {
  cash_session_id: string;
  items: {
    category: string;
    quantity: number;
    weight: number;  // Poids en kg
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
  updateSaleItem: (itemId: string, newQuantity: number, newWeight: number, newPrice: number) => void;
  clearCurrentSale: () => void;
  submitSale: (items: SaleItem[], finalization?: { donation: number; paymentMethod: 'cash'|'card'|'check'; cashGiven?: number; change?: number; }) => Promise<boolean>;
  
  // Async actions
  openSession: (data: CashSessionCreate) => Promise<CashSession | null>;
  closeSession: (sessionId: string) => Promise<boolean>;
  updateSession: (sessionId: string, data: CashSessionUpdate) => Promise<boolean>;
  fetchSessions: () => Promise<void>;
  fetchCurrentSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
  // UX-B10
  resumeSession: (sessionId: string) => Promise<boolean>;
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

        updateSaleItem: (itemId: string, newQuantity: number, newWeight: number, newPrice: number) => {
          set((state) => ({
            currentSaleItems: state.currentSaleItems.map(item =>
              item.id === itemId
                ? {
                    ...item,
                    quantity: newQuantity,
                    weight: newWeight,
                    price: newPrice,
                    total: newQuantity * newPrice  // total = quantité × prix
                  }
                : item
            )
          }));
        },

        clearCurrentSale: () => {
          set({ currentSaleItems: [] });
        },

        submitSale: async (items: SaleItem[], finalization?: { donation: number; paymentMethod: 'cash'|'card'|'check'; cashGiven?: number; change?: number; }): Promise<boolean> => {
          const { currentSession } = get();

          if (!currentSession) {
            const errorMsg = 'Aucune session de caisse active';
            console.error('[submitSale]', errorMsg);
            set({ error: errorMsg });
            return false;
          }

          set({ loading: true, error: null });

          try {
            const saleData: SaleCreate = {
              cash_session_id: currentSession.id,
              items: items.map(item => ({
                category: item.category,
                quantity: item.quantity,
                weight: item.weight,  // Ajout du poids
                unit_price: item.price,
                total_price: item.total
              })),
              total_amount: items.reduce((sum, item) => sum + item.total, 0)
            };

            // Étendre le payload pour inclure finalisation (don, paiement, espèces, monnaie)
            const extendedPayload = {
              ...saleData,
              donation: finalization?.donation ?? 0,
              payment_method: finalization?.paymentMethod ?? 'cash',
              cash_given: finalization?.paymentMethod === 'cash' ? (finalization?.cashGiven ?? null) : null,
              change: finalization?.paymentMethod === 'cash' ? (finalization?.change ?? null) : null,
            } as any;

            console.log('[submitSale] Preparing sale:', saleData);

            // Call API to create sale using axiosClient (handles auth automatically)
            console.log('[submitSale] Sending POST to /api/v1/sales/');
            const response = await axiosClient.post('/v1/sales/', extendedPayload);
            console.log('[submitSale] Sale created successfully:', response.data);

            // Clear current sale on success
            set({
              currentSaleItems: [],
              loading: false
            });

            return true;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement de la vente';
            console.error('[submitSale] Error:', errorMessage, error);
            set({ error: errorMessage, loading: false });
            return false;
          }
        },

        // Async actions
        openSession: async (data: CashSessionCreate): Promise<CashSession | null> => {
          set({ loading: true, error: null });
          
          try {
            // Pré-check 1: vérifier s'il y a déjà une session ouverte sur ce poste de caisse
            if (data.register_id) {
              const status = await cashSessionService.getRegisterSessionStatus(data.register_id);
              if (status.is_active && status.session_id) {
                const existingByRegister = await cashSessionService.getSession(status.session_id);
                if (existingByRegister) {
                  set({ currentSession: existingByRegister, loading: false });
                  localStorage.setItem('currentCashSession', JSON.stringify(existingByRegister));
                  return existingByRegister;
                }
              }
            }

            // Pré-check 2: session ouverte pour l'opérateur courant (fallback)
            const existing = await cashSessionService.getCurrentSession();
            if (existing) {
              set({ currentSession: existing, loading: false });
              localStorage.setItem('currentCashSession', JSON.stringify(existing));
              return existing;
            }

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
            
            // Si l'API renvoie que la session est déjà ouverte, tenter de reprendre automatiquement
            if (data.register_id && /déjà ouverte|already open/i.test(errorMessage)) {
              try {
                const status = await cashSessionService.getRegisterSessionStatus(data.register_id);
                if (status.is_active && status.session_id) {
                  const existing = await cashSessionService.getSession(status.session_id);
                  if (existing) {
                    set({ currentSession: existing, loading: false });
                    localStorage.setItem('currentCashSession', JSON.stringify(existing));
                    return existing;
                  }
                }
              } catch {
                // ignore and fall through
              }
            }
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
            // Pas de session locale: interroger l'API pour la session courante de l'opérateur
            const current = await cashSessionService.getCurrentSession();
            if (current && current.status === 'open') {
              set({ currentSession: current, loading: false });
              localStorage.setItem('currentCashSession', JSON.stringify(current));
              return;
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
        },

        // UX-B10: reprendre une session existante
        resumeSession: async (sessionId: string): Promise<boolean> => {
          set({ loading: true, error: null });
          try {
            const session = await cashSessionService.getSession(sessionId);
            if (session && session.status === 'open') {
              set({ currentSession: session, loading: false });
              localStorage.setItem('currentCashSession', JSON.stringify(session));
              return true;
            }
            set({ loading: false, error: "Aucune session ouverte trouvée pour cet identifiant" });
            return false;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la reprise de session';
            set({ error: errorMessage, loading: false });
            return false;
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
