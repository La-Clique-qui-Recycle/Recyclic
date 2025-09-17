import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AdminUser, UserRole, adminService, UsersFilter } from '../services/adminService';

interface AdminState {
  // State
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  filters: UsersFilter;
  selectedUser: AdminUser | null;
  
  // Actions
  setUsers: (users: AdminUser[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: UsersFilter) => void;
  setSelectedUser: (user: AdminUser | null) => void;
  
  // Async actions
  fetchUsers: () => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<boolean>;
  refreshUsers: () => Promise<void>;
  filterUsers: (filters: UsersFilter) => Promise<void>;
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

      // Setters
      setUsers: (users) => set({ users }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setFilters: (filters) => set({ filters }),
      setSelectedUser: (selectedUser) => set({ selectedUser }),

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
      }
    }),
    {
      name: 'admin-store', // nom pour le debugging
    }
  )
);

export default useAdminStore;
