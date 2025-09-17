// Import des types générés automatiquement
import {
  UserResponse,
  UserRole,
  UserStatus,
  UserStatusUpdate,
  UserUpdate,
  AdminUser,
  AdminResponse,
  PendingUserResponse,
  UsersApi,
  AdminApi
} from '../generated';

// Types locaux pour contourner les problèmes d'export
export interface UserRoleUpdate {
  role: UserRole;
}

export interface UserCreate {
  telegram_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  status?: UserStatus;
  is_active?: boolean;
  site_id?: string;
}

export interface UsersFilter {
  skip?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

// Re-export des types générés pour la compatibilité
export { UserRole, UserStatus };
export type { UserStatusUpdate, UserUpdate };

// Helper pour convertir UserResponse en AdminUser
function convertToAdminUser(user: UserResponse): AdminUser {
  return {
    id: user.id,
    telegram_id: typeof user.telegram_id === 'string' ? parseInt(user.telegram_id) : user.telegram_id,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    full_name: user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.username || `User ${user.telegram_id}`,
    email: undefined, // Pas encore implémenté dans l'API
    role: user.role as UserRole,
    status: user.status as UserStatus,
    is_active: user.is_active,
    site_id: user.site_id,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

// Service d'administration utilisant l'API générée
export const adminService = {
  /**
   * Récupère la liste des utilisateurs avec filtres
   */
  async getUsers(filters: UsersFilter = {}): Promise<AdminUser[]> {
    try {
      // Utiliser l'API générée
      const users = await UsersApi.usersapiv1usersget(filters);

      // Convertir UserResponse en AdminUser et appliquer les filtres
      let adminUsers: AdminUser[] = users.map(convertToAdminUser);

      // Appliquer les filtres côté client (en attendant que l'API les supporte)
      if (filters.role) {
        adminUsers = adminUsers.filter(user => user.role === filters.role);
      }
      if (filters.status) {
        adminUsers = adminUsers.filter(user => user.status === filters.status);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        adminUsers = adminUsers.filter(user =>
          user.username?.toLowerCase().includes(searchLower) ||
          user.first_name?.toLowerCase().includes(searchLower) ||
          user.last_name?.toLowerCase().includes(searchLower) ||
          user.full_name?.toLowerCase().includes(searchLower)
        );
      }

      return adminUsers;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  },

  /**
   * Met à jour le rôle d'un utilisateur
   */
  async updateUserRole(userId: string, roleUpdate: UserRoleUpdate): Promise<AdminResponse> {
    try {
      // Utiliser l'API générée
      const response = await AdminApi.userroleapiv1adminusersuseridroleput(userId, roleUpdate);
      return response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      throw error;
    }
  },

  /**
   * Récupère un utilisateur par son ID
   */
  async getUserById(userId: string): Promise<AdminUser> {
    try {
      // Utiliser l'API générée
      const user = await UsersApi.userapiv1usersuseridget(userId);

      // Convertir UserResponse en AdminUser
      return convertToAdminUser(user);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  },

  /**
   * Met à jour le statut d'un utilisateur
   */
  async updateUserStatus(userId: string, statusUpdate: UserStatusUpdate): Promise<AdminResponse> {
    try {
      // Utiliser l'API générée
      const updatedUser = await UsersApi.userstatusapiv1usersuseridstatusput(userId, statusUpdate);

      // Convertir en AdminUser
      const adminUser = convertToAdminUser(updatedUser);

      return {
        data: adminUser,
        message: 'Statut mis à jour avec succès',
        success: true
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  },

  /**
   * Crée un nouvel utilisateur
   */
  async createUser(userData: UserCreate): Promise<AdminResponse> {
    try {
      // Utiliser l'API générée
      const newUser = await UsersApi.userapiv1userspost(userData);

      // Convertir UserResponse en AdminUser
      const adminUser = convertToAdminUser(newUser);

      return {
        data: adminUser,
        message: 'Utilisateur créé avec succès',
        success: true
      };
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  },

  /**
   * Met à jour un utilisateur
   */
  async updateUser(userId: string, userData: UserUpdate): Promise<AdminResponse> {
    try {
      // Utiliser l'API générée
      const updatedUser = await UsersApi.userapiv1usersuseridput(userId, userData);

      // Convertir en AdminUser
      const adminUser = convertToAdminUser(updatedUser);

      return {
        data: adminUser,
        message: 'Utilisateur mis à jour avec succès',
        success: true
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  },

  /**
   * Supprime un utilisateur
   */
  async deleteUser(userId: string): Promise<AdminResponse> {
    try {
      // Utiliser l'API générée
      await UsersApi.userapiv1usersuseriddelete(userId);
      
      return {
        data: undefined,
        message: 'Utilisateur supprimé avec succès',
        success: true
      };
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  },

  /**
   * Récupère la liste des utilisateurs en attente d'approbation
   */
  async getPendingUsers(): Promise<AdminUser[]> {
    try {
      // Utiliser l'API générée
      const pendingUsers = await AdminApi.pendingusersapiv1adminuserspendingget();
      
      // Convertir PendingUserResponse en AdminUser
      return pendingUsers.map((user) => ({
        id: user.id,
        telegram_id: typeof user.telegram_id === 'string' ? parseInt(user.telegram_id) : user.telegram_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        is_active: true, // Les utilisateurs en attente sont considérés comme actifs
        site_id: undefined, // Pas disponible dans PendingUserResponse
        created_at: user.created_at,
        updated_at: user.created_at // Même date pour les utilisateurs en attente
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs en attente:', error);
      throw error;
    }
  },

  /**
   * Approuve un utilisateur en attente
   */
  async approveUser(userId: string, message?: string): Promise<AdminResponse> {
    try {
      // Utiliser l'API générée
      const result = await AdminApi.userapiv1adminusersuseridapprovepost(userId, { message });
      return result;
    } catch (error) {
      console.error('Erreur lors de l\'approbation de l\'utilisateur:', error);
      throw error;
    }
  },

  /**
   * Rejette un utilisateur en attente
   */
  async rejectUser(userId: string, reason?: string): Promise<AdminResponse> {
    try {
      // Utiliser l'API générée
      const result = await AdminApi.userapiv1adminusersuseridrejectpost(userId, { reason });
      return result;
    } catch (error) {
      console.error('Erreur lors du rejet de l\'utilisateur:', error);
      throw error;
    }
  }
};

export default adminService;
