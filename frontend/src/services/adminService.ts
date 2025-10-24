// Import des types générés automatiquement
import {
  UserResponse,
  UserRole,
  UserStatus,
  UserStatusUpdate,
  UserUpdate,
  AdminUser as GeneratedAdminUser,
  AdminResponse,
  PendingUserResponse,
  UserHistoryResponse,
  ActivityEvent,
  UsersApi,
  AdminApi
} from '../generated';
import axiosClient from '../api/axiosClient';

// Types locaux pour l'historique
export interface HistoryEvent {
  id: string;
  type: 'ADMINISTRATION' | 'VENTE' | 'DÉPÔT' | 'CONNEXION' | 'AUTRE';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Types locaux pour contourner les problèmes d'export
export interface UserRoleUpdate {
  role: UserRole;
}

export interface UserCreate {
  telegram_id?: string | null;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  notes?: string;
  skills?: string;
  availability?: string;
  role?: UserRole;
  status?: UserStatus;
  is_active?: boolean;
  site_id?: string;
}

export interface UserGroupUpdate {
  group_ids: string[];
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

// UI-facing AdminUser type extended with new optional profile fields
export type AdminUser = GeneratedAdminUser & {
  email?: string | null;
  phone_number?: string | null;
  address?: string | null;
  notes?: string | null;
  skills?: string | null;
  availability?: string | null;
};

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
    email: (user as any).email ?? null,
    phone_number: (user as any).phone_number ?? null,
    address: (user as any).address ?? null,
    notes: (user as any).notes ?? null,
    skills: (user as any).skills ?? null,
    availability: (user as any).availability ?? null,
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
      const newUser = await UsersApi.userapiv1userspost(userData as any);

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
  async updateUser(userId: string, userData: UserUpdate & Partial<Pick<UserCreate, 'email'|'phone_number'|'address'|'notes'|'skills'|'availability'>>): Promise<AdminResponse> {
    try {
      // Utiliser l'API générée
      const updatedUser = await UsersApi.userapiv1usersuseridput(userId, userData as any);

      // Convertir en AdminUser
      const adminUser = convertToAdminUser(updatedUser);

      return {
        data: adminUser,
        message: 'Bénévole mis à jour avec succès',
        success: true
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  },

  /**
   * Met à jour les groupes d'un utilisateur
   */
  async updateUserGroups(userId: string, groupData: UserGroupUpdate): Promise<AdminResponse> {
    try {
      const response = await axiosClient.put(`/v1/admin/users/${userId}/groups`, groupData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des groupes de l\'utilisateur:', error);
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
        message: 'Bénévole supprimé avec succès',
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
  async getUserHistory(userId: string, filters: any = {}): Promise<HistoryEvent[]> {
    try {
      // Construire les paramètres de requête pour l'API
      const params: any = {};
      
      // Convertir les dates au format ISO pour l'API
      if (filters.startDate) {
        params.date_from = filters.startDate.toISOString();
      }
      if (filters.endDate) {
        params.date_to = filters.endDate.toISOString();
      }
      
      // Convertir les types d'événements pour l'API
      if (filters.eventType && filters.eventType.length > 0) {
        // Mapper les types frontend vers les types API
        const typeMapping: Record<string, string> = {
          'ADMINISTRATION': 'ADMINISTRATION',
          'VENTE': 'VENTE',
          'DÉPÔT': 'DEPOT',
          'CONNEXION': 'LOGIN',
          'AUTRE': 'AUTRE'
        };
        params.event_type = filters.eventType
          .map((type: string) => typeMapping[type] || type)
          .join(',');
      }
      
      // Ajouter la pagination
      if (filters.skip !== undefined) {
        params.skip = filters.skip;
      }
      if (filters.limit !== undefined) {
        params.limit = filters.limit;
      }

      console.log(`Récupération de l'historique pour l'utilisateur ${userId} avec filtres:`, params);

      // Appel à l'API réelle
      const response = await AdminApi.userhistoryapiv1adminusersuseridhistoryget(userId, params);
      
      // Convertir les données de l'API vers le format attendu par le frontend
      const historyEvents = response.events.map((event: any) => ({
        id: event.id,
        type: adminService.mapEventTypeFromApi(event.event_type),
        description: event.description,
        timestamp: event.date,
        metadata: event.metadata || {}
      }));

      return historyEvents;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique utilisateur:', error);
      throw error;
    }
  },

  /**
   * Mappe les types d'événements de l'API vers les types frontend
   */
  mapEventTypeFromApi(apiEventType: string): 'ADMINISTRATION' | 'VENTE' | 'DÉPÔT' | 'CONNEXION' | 'AUTRE' {
    const typeMapping: Record<string, 'ADMINISTRATION' | 'VENTE' | 'DÉPÔT' | 'CONNEXION' | 'AUTRE'> = {
      'ADMINISTRATION': 'ADMINISTRATION',
      'VENTE': 'VENTE',
      'DEPOT': 'DÉPÔT',
      'LOGIN': 'CONNEXION',
      'SESSION CAISSE': 'CONNEXION', // Les sessions de caisse sont considérées comme des connexions
      'AUTRE': 'AUTRE'
    };
    
    return typeMapping[apiEventType] || 'AUTRE';
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

  async getActivityThreshold(): Promise<{ activity_threshold_minutes: number; description?: string }> {
    try {
      const response = await axiosClient.get('/v1/admin/settings/activity-threshold');
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération du seuil d'activité:", error);
      throw error;
    }
  },

  async updateActivityThreshold(minutes: number): Promise<{ message: string; activity_threshold_minutes: number }> {
    try {
      const response = await axiosClient.put('/v1/admin/settings/activity-threshold', {
        activity_threshold_minutes: minutes,
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du seuil d'activité:", error);
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
  },

  /**
   * Récupère les statuts en ligne/hors ligne de tous les utilisateurs
   */
  async getUserStatuses(): Promise<{
    user_statuses: Array<{
      user_id: string;
      is_online: boolean;
      last_login: string | null;
      minutes_since_login: number | null;
    }>;
    total_count: number;
    online_count: number;
    offline_count: number;
    timestamp: string;
  }> {
    try {
      const response = await axiosClient.get('/v1/admin/users/statuses');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statuts des utilisateurs:', error);
      throw error;
    }
  },

  /**
   * Force un nouveau mot de passe pour un utilisateur (Super Admin uniquement)
   */
  async forceUserPassword(userId: string, newPassword: string, reason?: string): Promise<AdminResponse> {
    try {
      const response = await axiosClient.post(`/v1/admin/users/${userId}/force-password`, {
        new_password: newPassword,
        reason: reason
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du forçage du mot de passe:', error);
      throw error;
    }
  },

  /**
   * Réinitialise le PIN d'un utilisateur
   */
  async resetUserPin(userId: string): Promise<{ message: string; user_id: string; username: string }> {
    try {
      const response = await axiosClient.post(`/admin/users/${userId}/reset-pin`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du PIN:', error);
      throw error;
    }
  },

  /**
   * Récupère les statuts en ligne/hors ligne de tous les utilisateurs
   */
  async getUserStatuses(): Promise<{
    user_statuses: Array<{
      user_id: string;
      is_online: boolean;
      last_login: string | null;
      minutes_since_login: number | null;
    }>;
    total_count: number;
    online_count: number;
    offline_count: number;
    timestamp: string;
  }> {
    try {
      const response = await axiosClient.get('/v1/admin/users/statuses');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statuts:', error);
      throw error;
    }
  }
};

export default adminService;
