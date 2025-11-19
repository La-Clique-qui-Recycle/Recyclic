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

export interface SaleItem {
  id: string;
  category: string;
  subcategory?: string;
  categoryName?: string;
  subcategoryName?: string;
  quantity: number;
  weight: number;
  price: number;
  total: number;
  presetId?: string;  // ID du preset utilisé pour cet item
  notes?: string;     // Notes pour cet item
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
    preset_id?: string | null;  // Story 1.1.2: Preset par item
    notes?: string | null;  // Story 1.1.2: Notes par item
  }[];
  total_amount: number;
  donation?: number;
  payment_method?: string;
}

interface ScrollState {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  canScrollUp: boolean;
  canScrollDown: boolean;
  isScrollable: boolean;
}

interface CashSessionState {
  // State
  currentSession: CashSession | null;
  sessions: CashSession[];
  currentSaleItems: SaleItem[];
  loading: boolean;
  error: string | null;

  // Scroll state for ticket display
  ticketScrollState: ScrollState;

  // Actions
  setCurrentSession: (session: CashSession | null) => void;
  setSessions: (sessions: CashSession[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Sale actions
  addSaleItem: (item: Omit<SaleItem, 'id'>) => void;
  removeSaleItem: (itemId: string) => void;
  updateSaleItem: (itemId: string, newQuantity: number, newWeight: number, newPrice: number, presetId?: string, notes?: string) => void;
  clearCurrentSale: () => void;
  submitSale: (items: SaleItem[], finalization?: { donation: number; paymentMethod: 'cash'|'card'|'check'; cashGiven?: number; change?: number; }) => Promise<boolean>;

  // Scroll actions
  setScrollPosition: (scrollTop: number) => void;
  updateScrollableState: (isScrollable: boolean, canScrollUp: boolean, canScrollDown: boolean, scrollHeight: number, clientHeight: number) => void;
  resetScrollState: () => void;

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
        ticketScrollState: {
          scrollTop: 0,
          scrollHeight: 0,
          clientHeight: 0,
          canScrollUp: false,
          canScrollDown: false,
          isScrollable: false
        },

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
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            presetId: item.presetId,
            notes: item.notes
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

        updateSaleItem: (itemId: string, newQuantity: number, newWeight: number, newPrice: number, presetId?: string, notes?: string) => {
          set((state) => ({
            currentSaleItems: state.currentSaleItems.map(item =>
              item.id === itemId
                ? {
                    ...item,
                    quantity: newQuantity,
                    weight: newWeight,
                    price: newPrice,
                    total: newQuantity * newPrice,  // total = quantité × prix
                    presetId: presetId !== undefined ? presetId : item.presetId,
                    notes: notes !== undefined ? notes : item.notes
                  }
                : item
            )
          }));
        },

        clearCurrentSale: () => {
          set({
            currentSaleItems: [],
            ticketScrollState: {
              scrollTop: 0,
              scrollHeight: 0,
              clientHeight: 0,
              canScrollUp: false,
              canScrollDown: false,
              isScrollable: false
            }
          });
        },

        // Scroll actions
        setScrollPosition: (scrollTop: number) => {
          set((state) => ({
            ticketScrollState: {
              ...state.ticketScrollState,
              scrollTop,
              canScrollUp: scrollTop > 0,
              canScrollDown: scrollTop < state.ticketScrollState.scrollHeight - state.ticketScrollState.clientHeight - 1
            }
          }));
        },

        updateScrollableState: (isScrollable: boolean, canScrollUp: boolean, canScrollDown: boolean, scrollHeight: number, clientHeight: number) => {
          set((state) => ({
            ticketScrollState: {
              ...state.ticketScrollState,
              isScrollable,
              canScrollUp,
              canScrollDown,
              scrollHeight,
              clientHeight
            }
          }));
        },

        resetScrollState: () => {
          set({
            ticketScrollState: {
              scrollTop: 0,
              scrollHeight: 0,
              clientHeight: 0,
              canScrollUp: false,
              canScrollDown: false,
              isScrollable: false
            }
          });
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
            // Fonction pour valider si une chaîne est un UUID valide
            const isValidUUID = (str: string | undefined | null): boolean => {
              if (!str) return false;
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              return uuidRegex.test(str);
            };

            const saleData: SaleCreate = {
              cash_session_id: currentSession.id,
              items: items.map(item => {
                // Si presetId n'est pas un UUID valide (comme "don-0", "don-18", etc.), 
                // on le stocke dans notes pour préserver l'information du type de preset
                const presetId = item.presetId && isValidUUID(item.presetId) ? item.presetId : null;
                let notes = item.notes || null;
                
                // Si presetId n'est pas un UUID valide, l'ajouter dans notes pour traçabilité
                if (item.presetId && !isValidUUID(item.presetId)) {
                  const presetTypeNote = `preset_type:${item.presetId}`;
                  notes = notes ? `${presetTypeNote}; ${notes}` : presetTypeNote;
                }
                
                return {
                  category: item.category,
                  quantity: item.quantity,
                  weight: item.weight,  // Ajout du poids
                  unit_price: item.price,
                  total_price: item.total,
                  preset_id: presetId,  // UUID valide ou null
                  notes: notes  // Notes utilisateur + type de preset si non-UUID
                };
              }),
              total_amount: items.reduce((sum, item) => sum + item.total, 0)
            };

            // Étendre le payload pour inclure finalisation (don, paiement)
            // Story 1.1.2: preset_id et notes sont maintenant par item, pas au niveau vente globale
            // Les codes de paiement sont maintenant simples (cash/card/check) pour éviter problèmes d'encodage
            const extendedPayload = {
              ...saleData,
              donation: finalization?.donation ?? 0,
              payment_method: finalization?.paymentMethod ?? 'cash',  // Envoie directement cash/card/check
              // preset_id et notes supprimés du niveau vente - maintenant dans chaque item
            };

            // Call API to create sale using axiosClient (handles auth automatically)
            const response = await axiosClient.post('/v1/sales/', extendedPayload);

            // Clear current sale on success
            set({
              currentSaleItems: [],
              loading: false
            });

            return true;
          } catch (error: any) {
            // Extraire le détail de l'erreur de validation Pydantic si disponible
            let errorMessage = 'Erreur lors de l\'enregistrement de la vente';
            if (error?.response?.data?.detail) {
              const detail = error.response.data.detail;
              if (Array.isArray(detail)) {
                // Erreur de validation Pydantic avec plusieurs champs
                const errors = detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join(', ');
                errorMessage = `Erreur de validation: ${errors}`;
              } else if (typeof detail === 'string') {
                errorMessage = detail;
              }
            } else if (error instanceof Error) {
              errorMessage = error.message;
            }
            console.error('[submitSale] Error:', errorMessage);
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
