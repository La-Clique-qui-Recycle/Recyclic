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
import axiosClient from '../api/axiosClient';

// Types locaux pour contourner les problèmes d'export
export interface UserRoleUpdate {
  role: UserRole;
}

export interface UserCreate {
  telegram_id?: string | null;
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
    is_active: user.is_active ?? false,
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
   * Met à jour le statut d'un utilisateur (admin)
   */
  async updateUserStatus(userId: string, statusUpdate: UserStatusUpdate): Promise<AdminResponse> {
    try {
      // Utiliser l'endpoint Admin dédié (client généré)
      const response = await AdminApi.userstatusapiv1adminusersuseridstatusput(userId, statusUpdate);
      return response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  },

  /**
   * Crée un nouvel utilisateur
   */
  async createUser(userData: UserCreate): Promise<AdminUser> {
    try {
      // Utiliser l'API générée pour créer un utilisateur
      const newUser = await UsersApi.userapiv1userspost(userData);

      // Convertir UserResponse en AdminUser
      const adminUser = convertToAdminUser(newUser);

      return adminUser;
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
  },

  /**
   * Déclenche la réinitialisation du mot de passe pour un utilisateur
   */
  async triggerResetPassword(userId: string): Promise<AdminResponse> {
    try {
      const response = await axiosClient.post(`/v1/admin/users/${userId}/reset-password`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du déclenchement de la réinitialisation du mot de passe:', error);
      throw error;
    }
  },

  /**
   * Récupère l'historique d'un utilisateur avec filtres optionnels
   */
  async getUserHistory(userId: string, filters: any = {}): Promise<any[]> {
    try {
      // Construire les paramètres de requête
      const params: any = {};
      if (filters.startDate) {
        params.start_date = filters.startDate.toISOString().split('T')[0];
      }
      if (filters.endDate) {
        params.end_date = filters.endDate.toISOString().split('T')[0];
      }
      if (filters.eventType && filters.eventType.length > 0) {
        params.event_types = filters.eventType.join(',');
      }
      if (filters.search) {
        params.search = filters.search;
      }

      // Appel à l'API générée (si elle existe)
      // Pour le moment, on simule des données d'historique
      // TODO: Implémenter l'endpoint API réel pour l'historique utilisateur
      console.log(`Récupération de l'historique pour l'utilisateur ${userId} avec filtres:`, params);

      // Simulation d'historique utilisateur (à remplacer par un appel API réel)
      const mockHistory = [
        {
          id: `history-${userId}-1`,
          type: 'CONNEXION' as const,
          description: 'Connexion réussie à l\'application',
          timestamp: new Date().toISOString(),
          metadata: {
            ip: '192.168.1.1',
            userAgent: 'Mozilla/5.0...'
          }
        },
        {
          id: `history-${userId}-2`,
          type: 'ADMINISTRATION' as const,
          description: 'Modification du rôle utilisateur',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1h ago
          metadata: {
            oldRole: 'USER',
            newRole: 'MANAGER',
            adminId: 'admin-123'
          }
        }
      ];

      // Filtrer les résultats côté client si nécessaire
      let filteredHistory = mockHistory;

      if (filters.eventType && filters.eventType.length > 0) {
        filteredHistory = filteredHistory.filter(event =>
          filters.eventType.includes(event.type)
        );
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredHistory = filteredHistory.filter(event =>
          event.description.toLowerCase().includes(searchLower)
        );
      }

      return filteredHistory;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique utilisateur:', error);
      throw error;
    }
  },

  /**
   * Exporte la base de données (réservé aux Super-Admins)
   * Télécharge un fichier SQL de backup de la base de données
   */
  async exportDatabase(): Promise<void> {
    try {
      // Utiliser axiosClient directement car c'est un téléchargement de fichier
      const response = await axiosClient.post('/v1/admin/db/export', {}, {
        responseType: 'blob', // Important pour recevoir un fichier binaire
        timeout: 300000, // 5 minutes timeout (export peut être long)
      });

      // Créer un blob à partir de la réponse
      const blob = new Blob([response.data], { type: 'application/sql' });

      // Extraire le nom du fichier depuis les headers
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'recyclic_db_export.sql';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Créer un lien temporaire et déclencher le téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Nettoyage
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`Export de base de données téléchargé: ${filename}`);
    } catch (error) {
      console.error('Erreur lors de l\'export de la base de données:', error);
      throw error;
    }
  },

  /**
   * Purge les données transactionnelles (réservé aux Super-Admins)
   * Supprime toutes les données de ventes, réceptions et sessions de caisse
   */
  async purgeTransactionalData(): Promise<{ message: string; deleted_records: Record<string, number>; timestamp: string }> {
    try {
      const response = await axiosClient.post('/v1/admin/db/purge-transactions');
      console.log('Purge des données transactionnelles réussie:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la purge des données transactionnelles:', error);
      throw error;
    }
  },

  /**
   * Récupère les paramètres de session (durée d'expiration des tokens)
   */
  async getSessionSettings(): Promise<{ token_expiration_minutes: number }> {
    try {
      const response = await axiosClient.get('/v1/admin/settings/session');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres de session:', error);
      throw error;
    }
  },

  /**
   * Met à jour les paramètres de session (durée d'expiration des tokens)
   */
  async updateSessionSettings(tokenExpirationMinutes: number): Promise<{ token_expiration_minutes: number }> {
    try {
      const response = await axiosClient.put('/v1/admin/settings/session', {
        token_expiration_minutes: tokenExpirationMinutes
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres de session:', error);
      throw error;
    }
  },

  /**
   * Importe une sauvegarde de base de données (réservé aux Super-Admins)
   * Remplace la base de données existante par le contenu du fichier SQL
   */
  async importDatabase(file: File): Promise<{ message: string; imported_file: string; backup_created: string; backup_path: string; timestamp: string }> {
    try {
      // Créer un FormData pour l'upload de fichier
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosClient.post('/v1/admin/db/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 10 minutes timeout (import peut être long)
      });

      console.log('Import de base de données réussi:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'import de la base de données:', error);
      throw error;
    }
  },

  /**
   * Récupère les paramètres email (Brevo)
   */
  async getEmailSettings(): Promise<{
    from_name: string;
    from_address: string;
    default_recipient: string | null;
    has_api_key: boolean;
    webhook_secret_configured: boolean;
  }> {
    try {
      const response = await axiosClient.get('/v1/admin/settings/email');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres email:', error);
      throw error;
    }
  },

  /**
   * Met à jour les paramètres email (Brevo)
   */
  async updateEmailSettings(settings: {
    from_name?: string;
    from_address?: string;
    default_recipient?: string;
  }): Promise<{
    from_name: string;
    from_address: string;
    default_recipient: string | null;
    has_api_key: boolean;
    webhook_secret_configured: boolean;
  }> {
    try {
      const response = await axiosClient.put('/v1/admin/settings/email', settings);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres email:', error);
      throw error;
    }
  },

  /**
   * Envoie un email de test
   */
  async sendTestEmail(to_email: string): Promise<{
    success: boolean;
    message: string;
    to_email: string;
    from_email: string;
    from_name: string;
  }> {
    try {
      const response = await axiosClient.post('/v1/admin/settings/email/test', {
        to_email
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de test:', error);
      throw error;
    }
  }
};

export default adminService;
