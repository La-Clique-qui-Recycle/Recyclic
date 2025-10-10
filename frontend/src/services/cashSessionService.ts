import ApiClient from '../generated/api';

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

export interface CashSessionResponse {
  data?: CashSession;
  message: string;
  success: boolean;
}

export interface CashSessionsResponse {
  data?: CashSession[];
  message: string;
  success: boolean;
}

export const cashSessionService = {
  /**
   * Crée une nouvelle session de caisse
   */
  async createSession(data: CashSessionCreate): Promise<CashSession> {
    try {
      // Debug: afficher les données envoyées
      console.log('Données envoyées à l\'API:', data);

      const response = await ApiClient.client.post('/v1/cash-sessions/', data);

      // L'API retourne directement l'objet session, pas un wrapper
      if (response.data && response.data.id) {
        return response.data;
      } else {
        console.error('Réponse invalide de l\'API:', response.data);
        throw new Error('Réponse invalide de l\'API');
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de la session:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Request URL:', error.config?.url);
      console.error('Request data:', error.config?.data);
      
      if (error.response?.status === 401) {
        throw new Error('Vous devez être connecté pour créer une session de caisse');
      } else if (error.response?.status === 400) {
        // Erreur de validation - afficher les détails
        const details = error.response.data?.detail;
        if (Array.isArray(details)) {
          const messages = details.map(d => d.msg || d.message || JSON.stringify(d)).join(', ');
          throw new Error(`Erreur de validation: ${messages}`);
        } else if (typeof details === 'string') {
          throw new Error(`Erreur de validation: ${details}`);
        } else if (details) {
          throw new Error(`Erreur de validation: ${JSON.stringify(details)}`);
        } else {
          // Fallback si pas de body JSON
          throw new Error('Une session est peut-être déjà ouverte pour cet opérateur ou cette caisse. Vérifiez la session courante.');
        }
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Erreur lors de la création de la session');
      }
    }
  },

  /**
   * Récupère une session de caisse par son ID
   */
  async getSession(sessionId: string): Promise<CashSession | null> {
    try {
      const response = await ApiClient.client.get(`/v1/cash-sessions/${sessionId}`);
      // L'API retourne soit un wrapper {success,data}, soit l'objet direct
      if (response.data && response.data.id) {
        return response.data as CashSession;
      }
      if (response.data?.success && response.data?.data) {
        return response.data.data as CashSession;
      }
      return null;
    } catch (error: any) {
      console.error('Erreur lors de la récupération de la session:', error);
      return null;
    }
  },

  /**
   * Récupère toutes les sessions de caisse
   */
  async getSessions(): Promise<CashSession[]> {
    try {
      const response = await ApiClient.client.get('/v1/cash-sessions/');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des sessions:', error);
      return [];
    }
  },

  /**
   * Met à jour une session de caisse
   */
  async updateSession(sessionId: string, data: CashSessionUpdate): Promise<CashSession | null> {
    try {
      const response = await ApiClient.client.put(`/v1/cash-sessions/${sessionId}`, data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erreur lors de la mise à jour de la session');
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la session:', error);
      
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Erreur lors de la mise à jour de la session');
      }
    }
  },

  /**
   * Ferme une session de caisse
   */
  async closeSession(sessionId: string): Promise<boolean> {
    try {
      const response = await ApiClient.client.put(`/v1/cash-sessions/${sessionId}`, {
        status: 'closed'
      });
      
      return response.data.success || false;
    } catch (error: any) {
      console.error('Erreur lors de la fermeture de la session:', error);
      
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Erreur lors de la fermeture de la session');
      }
    }
  },

  /**
   * Ferme une session de caisse avec contrôle des montants
   */
  async closeSessionWithAmounts(sessionId: string, actualAmount: number, varianceComment?: string): Promise<CashSession> {
    try {
      const response = await ApiClient.client.post(`/v1/cash-sessions/${sessionId}/close`, {
        actual_amount: actualAmount,
        variance_comment: varianceComment
      });

      // L'API retourne directement l'objet session, pas un wrapper
      if (response.data && response.data.id) {
        return response.data;
      } else {
        throw new Error('Réponse invalide de l\'API lors de la fermeture');
      }
    } catch (error: any) {
      console.error('Erreur lors de la fermeture de la session:', error);

      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Erreur lors de la fermeture de la session');
      }
    }
  },

  /**
   * Récupère la session de caisse actuellement ouverte
   */
  async getCurrentSession(): Promise<CashSession | null> {
    try {
      const response = await ApiClient.client.get('/v1/cash-sessions/current');

      // L'API retourne directement l'objet session ou null
      if (response.data && response.data.id) {
        return response.data;
      } else {
        return null;
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération de la session courante:', error);
      return null;
    }
  },

  /**
   * Récupère le statut de session pour un poste de caisse
   */
  async getRegisterSessionStatus(registerId: string): Promise<{ is_active: boolean; session_id: string | null }> {
    try {
      const response = await ApiClient.client.get(`/v1/cash-sessions/status/${registerId}`);
      const data = response.data;
      return {
        is_active: Boolean(data?.is_active),
        session_id: data?.session_id ?? null
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du statut de session pour la caisse:', error);
      return { is_active: false, session_id: null };
    }
  }
};

export const cashRegisterDashboardService = {
  async getRegistersStatus(): Promise<{ id: string; name: string; is_open: boolean }[]> {
    try {
      const response = await ApiClient.client.get('/v1/cash-registers/status');
      const data = response.data;
      if (Array.isArray(data?.data)) return data.data;
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération du statut des caisses:', error);
      return [];
    }
  }
};

export default cashSessionService;
