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
      const response = await ApiClient.client.post('/api/v1/cash-sessions', data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erreur lors de la création de la session');
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de la session:', error);
      
      if (error.response?.data?.detail) {
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
      const response = await ApiClient.client.get(`/api/v1/cash-sessions/${sessionId}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        return null;
      }
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
      const response = await ApiClient.client.get('/api/v1/cash-sessions');
      
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
      const response = await ApiClient.client.put(`/api/v1/cash-sessions/${sessionId}`, data);
      
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
      const response = await ApiClient.client.put(`/api/v1/cash-sessions/${sessionId}`, {
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
      const response = await ApiClient.client.post(`/api/v1/cash-sessions/${sessionId}/close`, {
        actual_amount: actualAmount,
        variance_comment: varianceComment
      });
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erreur lors de la fermeture de la session');
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
      const response = await ApiClient.client.get('/api/v1/cash-sessions/current');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        return null;
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération de la session courante:', error);
      return null;
    }
  }
};

export default cashSessionService;
