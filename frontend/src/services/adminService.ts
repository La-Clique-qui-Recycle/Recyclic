// Import des types et de l'API générés
import {
  UserResponse,
  UserRole,
  UserStatus,
  UserRoleUpdate,
  UserStatusUpdate,
  UserCreate,
  UserUpdate,
  ApiResponse,
  UsersApi
} from '../generated';

// Types spécifiques à l'administration (extension des types générés)
export interface AdminUser extends UserResponse {
  full_name?: string;
  email?: string;
  site_id?: string;
}

export interface AdminResponse<T = unknown> {
  data?: T;
  message: string;
  success: boolean;
}

export interface UsersFilter {
  skip?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

// Re-export des types générés pour la compatibilité
export { UserRole, UserStatus, UserRoleUpdate, UserStatusUpdate, UserCreate, UserUpdate };

// Service d'administration utilisant l'API générée
export const adminService = {
  /**
   * Récupère la liste des utilisateurs avec filtres
   */
  async getUsers(filters: UsersFilter = {}): Promise<AdminUser[]> {
    try {
      const users = await UsersApi.getUsers({
        skip: filters.skip,
        limit: filters.limit
      });
      
      // Convertir UserResponse en AdminUser et appliquer les filtres
      let adminUsers: AdminUser[] = users.map(user => ({
        ...user,
        full_name: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.username || `User ${user.telegram_id}`,
        email: undefined, // Pas encore implémenté dans l'API
        site_id: undefined // Pas encore implémenté dans l'API
      }));

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
  async updateUserRole(userId: string, roleUpdate: UserRoleUpdate): Promise<AdminResponse<AdminUser>> {
    try {
      const updatedUser = await UsersApi.updateUserRole(userId, roleUpdate);
      
      // Convertir en AdminUser
      const adminUser: AdminUser = {
        ...updatedUser,
        full_name: updatedUser.first_name && updatedUser.last_name 
          ? `${updatedUser.first_name} ${updatedUser.last_name}` 
          : updatedUser.username || `User ${updatedUser.telegram_id}`,
        email: undefined,
        site_id: undefined
      };

      return {
        data: adminUser,
        message: 'Rôle mis à jour avec succès',
        success: true
      };
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
      const user = await UsersApi.getUserById(userId);
      
      // Convertir en AdminUser
      return {
        ...user,
        full_name: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.username || `User ${user.telegram_id}`,
        email: undefined,
        site_id: undefined
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  },

  /**
   * Met à jour le statut d'un utilisateur
   */
  async updateUserStatus(userId: string, statusUpdate: UserStatusUpdate): Promise<AdminResponse<AdminUser>> {
    try {
      const updatedUser = await UsersApi.updateUserStatus(userId, statusUpdate);
      
      // Convertir en AdminUser
      const adminUser: AdminUser = {
        ...updatedUser,
        full_name: updatedUser.first_name && updatedUser.last_name 
          ? `${updatedUser.first_name} ${updatedUser.last_name}` 
          : updatedUser.username || `User ${updatedUser.telegram_id}`,
        email: undefined,
        site_id: undefined
      };

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
  async createUser(userData: UserCreate): Promise<AdminResponse<AdminUser>> {
    try {
      const newUser = await UsersApi.createUser(userData);
      
      // Convertir en AdminUser
      const adminUser: AdminUser = {
        ...newUser,
        full_name: newUser.first_name && newUser.last_name 
          ? `${newUser.first_name} ${newUser.last_name}` 
          : newUser.username || `User ${newUser.telegram_id}`,
        email: undefined,
        site_id: undefined
      };

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
  async updateUser(userId: string, userData: UserUpdate): Promise<AdminResponse<AdminUser>> {
    try {
      const updatedUser = await UsersApi.updateUser(userId, userData);
      
      // Convertir en AdminUser
      const adminUser: AdminUser = {
        ...updatedUser,
        full_name: updatedUser.first_name && updatedUser.last_name 
          ? `${updatedUser.first_name} ${updatedUser.last_name}` 
          : updatedUser.username || `User ${updatedUser.telegram_id}`,
        email: undefined,
        site_id: undefined
      };

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
  async deleteUser(userId: string): Promise<AdminResponse<void>> {
    try {
      await UsersApi.deleteUser(userId);
      
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
      // Pour l'instant, on utilise l'endpoint existant avec un filtre
      // TODO: Remplacer par l'endpoint dédié une fois disponible
      const users = await this.getUsers({ status: UserStatus.PENDING });
      return users;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs en attente:', error);
      throw error;
    }
  },

  /**
   * Approuve un utilisateur en attente
   */
  async approveUser(userId: string, message?: string): Promise<AdminResponse<AdminUser>> {
    try {
      // Pour l'instant, on utilise l'endpoint de mise à jour de statut
      // TODO: Remplacer par l'endpoint dédié une fois disponible
      const updatedUser = await UsersApi.updateUserStatus(userId, { status: UserStatus.APPROVED });
      
      // Convertir en AdminUser
      const adminUser: AdminUser = {
        ...updatedUser,
        full_name: updatedUser.first_name && updatedUser.last_name 
          ? `${updatedUser.first_name} ${updatedUser.last_name}` 
          : updatedUser.username || `User ${updatedUser.telegram_id}`,
        email: undefined,
        site_id: undefined
      };

      return {
        data: adminUser,
        message: message || 'Utilisateur approuvé avec succès',
        success: true
      };
    } catch (error) {
      console.error('Erreur lors de l\'approbation de l\'utilisateur:', error);
      throw error;
    }
  },

  /**
   * Rejette un utilisateur en attente
   */
  async rejectUser(userId: string, reason?: string): Promise<AdminResponse<AdminUser>> {
    try {
      // Pour l'instant, on utilise l'endpoint de mise à jour de statut
      // TODO: Remplacer par l'endpoint dédié une fois disponible
      const updatedUser = await UsersApi.updateUserStatus(userId, { status: UserStatus.REJECTED });
      
      // Convertir en AdminUser
      const adminUser: AdminUser = {
        ...updatedUser,
        full_name: updatedUser.first_name && updatedUser.last_name 
          ? `${updatedUser.first_name} ${updatedUser.last_name}` 
          : updatedUser.username || `User ${updatedUser.telegram_id}`,
        email: undefined,
        site_id: undefined
      };

      return {
        data: adminUser,
        message: reason ? `Utilisateur rejeté: ${reason}` : 'Utilisateur rejeté avec succès',
        success: true
      };
    } catch (error) {
      console.error('Erreur lors du rejet de l\'utilisateur:', error);
      throw error;
    }
  }
};

export default adminService;
