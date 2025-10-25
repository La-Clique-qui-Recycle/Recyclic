import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AdminUser, UserRole, adminService, UsersFilter, HistoryEvent } from '../services/adminService';

interface HistoryFilters {
  startDate?: Date | null;
  endDate?: Date | null;
  eventType?: string[];
  search?: string;
}

interface UserStatusInfo {
  user_id: string;
  is_online: boolean;
  last_login: string | null;
  minutes_since_login: number | null;
}

interface AdminState {
  // State
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  filters: UsersFilter;
  selectedUser: AdminUser | null;
  
  // History state
  userHistory: HistoryEvent[];
  historyLoading: boolean;
  historyError: string | null;
  historyFilters: HistoryFilters;
  
  // User status state
  userStatuses: UserStatusInfo[];
  statusesLoading: boolean;
  statusesError: string | null;
  pollingInterval: NodeJS.Timeout | null;
  
  // Actions
  setUsers: (users: AdminUser[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: UsersFilter) => void;
  setSelectedUser: (user: AdminUser | null) => void;
  
  // History actions
  setUserHistory: (history: HistoryEvent[]) => void;
  setHistoryLoading: (loading: boolean) => void;
  setHistoryError: (error: string | null) => void;
  setHistoryFilters: (filters: HistoryFilters) => void;
  
  // User status actions
  setUserStatuses: (statuses: UserStatusInfo[]) => void;
  setStatusesLoading: (loading: boolean) => void;
  setStatusesError: (error: string | null) => void;
  
  // Async actions
  fetchUsers: () => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<boolean>;
  refreshUsers: () => Promise<void>;
  filterUsers: (filters: UsersFilter) => Promise<void>;
  
  // History async actions
  fetchUserHistory: (userId: string, filters?: HistoryFilters) => Promise<void>;
  
  // User status async actions
  fetchUserStatuses: () => Promise<void>;
  startStatusPolling: () => void;
  stopStatusPolling: () => void;
}

export const useAdminStore = create<AdminState>()(
  devtools(
    (set, get) => ({
      // Initial state
      users: [],
      loading: false,
      error: null,
      filters: {
        skip: 0,
        limit: 20
      },
      selectedUser: null,
      
      // History initial state
      userHistory: [],
      historyLoading: false,
      historyError: null,
      historyFilters: {},
      
      // User status initial state
      userStatuses: [],
      statusesLoading: false,
      statusesError: null,
      pollingInterval: null,

      // Setters
      setUsers: (users) => set({ users }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setFilters: (filters) => set({ filters }),
      setSelectedUser: (selectedUser) => set({ selectedUser }),
      
      // History setters
      setUserHistory: (userHistory) => set({ userHistory }),
      setHistoryLoading: (historyLoading) => set({ historyLoading }),
      setHistoryError: (historyError) => set({ historyError }),
      setHistoryFilters: (historyFilters) => set({ historyFilters }),
      
      // User status setters
      setUserStatuses: (userStatuses) => set({ userStatuses }),
      setStatusesLoading: (statusesLoading) => set({ statusesLoading }),
      setStatusesError: (statusesError) => set({ statusesError }),

      // Async actions
      fetchUsers: async () => {
        const { filters } = get();
        set({ loading: true, error: null });
        
        try {
          const users = await adminService.getUsers(filters);
          set({ users, loading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des utilisateurs';
          set({ error: errorMessage, loading: false });
        }
      },

      updateUserRole: async (userId: string, role: UserRole): Promise<boolean> => {
        set({ loading: true, error: null });

        try {
          const response = await adminService.updateUserRole(userId, { role });

          if (response.success) {
            // Mettre à jour l'utilisateur dans la liste locale
            const { users } = get();
            const updatedUsers = users.map(user =>
              user.id === userId ? { ...user, role } : user
            );
            set({ users: updatedUsers, loading: false });
            return true;
          } else {
            set({ error: response.message, loading: false });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du rôle';
          set({ error: errorMessage, loading: false });
          return false;
        }
      },

      refreshUsers: async () => {
        const { fetchUsers } = get();
        await fetchUsers();
      },

      filterUsers: async (newFilters: UsersFilter) => {
        const { filters, fetchUsers } = get();
        const updatedFilters = { ...filters, ...newFilters };
        set({ filters: updatedFilters, loading: true, error: null });
        try {
          await fetchUsers();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur lors du filtrage';
          set({ error: errorMessage, loading: false });
        }
      },

      // History async actions
      fetchUserHistory: async (userId: string, filters: HistoryFilters = {}) => {
        set({ historyLoading: true, historyError: null });
        
        try {
          const history = await adminService.getUserHistory(userId, filters);
          
          set({ 
            userHistory: history, 
            historyLoading: false,
            historyFilters: filters
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement de l\'historique';
          set({ historyError: errorMessage, historyLoading: false });
        }
      },
      
      // User status async actions
      fetchUserStatuses: async () => {
        set({ statusesLoading: true, statusesError: null });
        
        try {
          const response = await adminService.getUserStatuses();
          set({ 
            userStatuses: response.user_statuses, 
            statusesLoading: false 
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des statuts';
          set({ statusesError: errorMessage, statusesLoading: false });
        }
      },
      
      startStatusPolling: () => {
        const { pollingInterval, fetchUserStatuses } = get();
        
        // Arrêter le polling existant s'il y en a un
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        
        // Récupérer les statuts immédiatement
        fetchUserStatuses();

        // OPTIMIZATION: Increase polling interval from 60s to 5 minutes (300000ms) to reduce server load
        const interval = setInterval(() => {
          fetchUserStatuses();
        }, 300000); // 5 minutes

        set({ pollingInterval: interval });
      },
      
      stopStatusPolling: () => {
        const { pollingInterval } = get();
        
        if (pollingInterval) {
          clearInterval(pollingInterval);
          set({ pollingInterval: null });
        }
      }
    }),
    {
      name: 'admin-store', // nom pour le debugging
    }
  )
);

// Export des types pour utilisation dans les composants
export type { HistoryFilters, UserStatusInfo };

export default useAdminStore;
