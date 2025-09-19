/**
 * Client API généré automatiquement à partir de la spécification OpenAPI
 * Source: ../api/openapi.json
 * Généré le: 2025-09-17T23:34:24.042Z
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  UserResponse,
  UserCreate,
  UserUpdate,
  UserRoleUpdate,
  UserStatusUpdate,
  ApiResponse,
  PaginatedResponse,
  ApiError
} from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = '';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor pour ajouter l'auth si nécessaire
apiClient.interceptors.request.use(
  (config) => {
    // TODO: Ajouter le token d'authentification si nécessaire
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// API CLASSES
// ============================================================================

export class HealthApi {
    /**
   * Health Check
   */
  static async checkapiv1healthget(): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.get(`/api/v1/health/`);
    return response.data;
  }
}
export class UsersApi {
    /**
   * Get Users
   */
  static async usersapiv1usersget(params?: any): Promise<UserResponse[]> {
    const response: AxiosResponse<UserResponse[]> = await apiClient.get(`/api/v1/users/?${new URLSearchParams(params).toString()}`);
    return response.data;
  }

    /**
   * Create User
   */
  static async userapiv1userspost(data?: any): Promise<UserResponse> {
    const response: AxiosResponse<UserResponse> = await apiClient.post(`/api/v1/users/`, data);
    return response.data;
  }

    /**
   * Get User
   */
  static async userapiv1usersuseridget(user_id): Promise<UserResponse> {
    const response: AxiosResponse<UserResponse> = await apiClient.get(`/api/v1/users/${user_id}`);
    return response.data;
  }

    /**
   * Update User
   */
  static async userapiv1usersuseridput(user_id, data?: any): Promise<UserResponse> {
    const response: AxiosResponse<UserResponse> = await apiClient.put(`/api/v1/users/${user_id}`, data);
    return response.data;
  }

    /**
   * Delete User
   */
  static async userapiv1usersuseriddelete(user_id): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.delete(`/api/v1/users/${user_id}`);
    return response.data;
  }

    /**
   * Update User Status
   */
  static async userstatusapiv1usersuseridstatusput(user_id, data?: any): Promise<UserResponse> {
    const response: AxiosResponse<UserResponse> = await apiClient.put(`/api/v1/users/${user_id}/status`, data);
    return response.data;
  }
}
export class SitesApi {
    /**
   * Get Sites
   */
  static async sitesapiv1sitesget(params?: any): Promise<SiteResponse[]> {
    const response: AxiosResponse<SiteResponse[]> = await apiClient.get(`/api/v1/sites/?${new URLSearchParams(params).toString()}`);
    return response.data;
  }

    /**
   * Create Site
   */
  static async siteapiv1sitespost(data?: any): Promise<SiteResponse> {
    const response: AxiosResponse<SiteResponse> = await apiClient.post(`/api/v1/sites/`, data);
    return response.data;
  }

    /**
   * Get Site
   */
  static async siteapiv1sitessiteidget(site_id): Promise<SiteResponse> {
    const response: AxiosResponse<SiteResponse> = await apiClient.get(`/api/v1/sites/${site_id}`);
    return response.data;
  }
}
export class DepositsApi {
    /**
   * Get Deposits
   */
  static async depositsapiv1depositsget(params?: any): Promise<DepositResponse[]> {
    const response: AxiosResponse<DepositResponse[]> = await apiClient.get(`/api/v1/deposits/?${new URLSearchParams(params).toString()}`);
    return response.data;
  }

    /**
   * Create Deposit
   */
  static async depositapiv1depositspost(data?: any): Promise<DepositResponse> {
    const response: AxiosResponse<DepositResponse> = await apiClient.post(`/api/v1/deposits/`, data);
    return response.data;
  }

    /**
   * Get Deposit
   */
  static async depositapiv1depositsdepositidget(deposit_id): Promise<DepositResponse> {
    const response: AxiosResponse<DepositResponse> = await apiClient.get(`/api/v1/deposits/${deposit_id}`);
    return response.data;
  }

    /**
   * Finalize Deposit
   */
  static async depositapiv1depositsdepositidput(deposit_id, data?: any): Promise<DepositResponse> {
    const response: AxiosResponse<DepositResponse> = await apiClient.put(`/api/v1/deposits/${deposit_id}`, data);
    return response.data;
  }

    /**
   * Create Deposit From Bot
   */
  static async depositfrombotapiv1depositsfrombotpost(data?: any): Promise<DepositResponse> {
    const response: AxiosResponse<DepositResponse> = await apiClient.post(`/api/v1/deposits/from-bot`, data);
    return response.data;
  }

    /**
   * Classify Deposit
   */
  static async depositapiv1depositsdepositidclassifypost(deposit_id): Promise<DepositResponse> {
    const response: AxiosResponse<DepositResponse> = await apiClient.post(`/api/v1/deposits/${deposit_id}/classify`);
    return response.data;
  }

    /**
   * Get Validation Metrics
   */
  static async validationmetricsapiv1depositsmetricsvalidationperformanceget(): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.get(`/api/v1/deposits/metrics/validation-performance`);
    return response.data;
  }
}
export class SalesApi {
    /**
   * Get Sales
   */
  static async salesapiv1salesget(params?: any): Promise<SaleResponse[]> {
    const response: AxiosResponse<SaleResponse[]> = await apiClient.get(`/api/v1/sales/?${new URLSearchParams(params).toString()}`);
    return response.data;
  }

    /**
   * Create Sale
   */
  static async saleapiv1salespost(data?: any): Promise<SaleResponse> {
    const response: AxiosResponse<SaleResponse> = await apiClient.post(`/api/v1/sales/`, data);
    return response.data;
  }

    /**
   * Get Sale
   */
  static async saleapiv1salessaleidget(sale_id): Promise<SaleResponse> {
    const response: AxiosResponse<SaleResponse> = await apiClient.get(`/api/v1/sales/${sale_id}`);
    return response.data;
  }
}
export class CashSessionsApi {
    /**
   * Créer une session de caisse
   */
  static async cashsessionapiv1cashsessionspost(data?: any): Promise<CashSessionResponse> {
    const response: AxiosResponse<CashSessionResponse> = await apiClient.post(`/api/v1/cash-sessions/`, data);
    return response.data;
  }

    /**
   * Lister les sessions de caisse
   */
  static async cashsessionsapiv1cashsessionsget(params?: any): Promise<CashSessionListResponse> {
    const response: AxiosResponse<CashSessionListResponse> = await apiClient.get(`/api/v1/cash-sessions/?${new URLSearchParams(params).toString()}`);
    return response.data;
  }

    /**
   * Get Current Cash Session
   */
  static async currentcashsessionapiv1cashsessionscurrentget(): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.get(`/api/v1/cash-sessions/current`);
    return response.data;
  }

    /**
   * Get Cash Session
   */
  static async cashsessionapiv1cashsessionssessionidget(session_id): Promise<CashSessionResponse> {
    const response: AxiosResponse<CashSessionResponse> = await apiClient.get(`/api/v1/cash-sessions/${session_id}`);
    return response.data;
  }

    /**
   * Update Cash Session
   */
  static async cashsessionapiv1cashsessionssessionidput(session_id, data?: any): Promise<CashSessionResponse> {
    const response: AxiosResponse<CashSessionResponse> = await apiClient.put(`/api/v1/cash-sessions/${session_id}`, data);
    return response.data;
  }

    /**
   * Fermer une session de caisse
   */
  static async cashsessionapiv1cashsessionssessionidclosepost(session_id): Promise<CashSessionResponse> {
    const response: AxiosResponse<CashSessionResponse> = await apiClient.post(`/api/v1/cash-sessions/${session_id}/close`);
    return response.data;
  }

    /**
   * Get Cash Session Stats
   */
  static async cashsessionstatsapiv1cashsessionsstatssummaryget(params?: any): Promise<CashSessionStats> {
    const response: AxiosResponse<CashSessionStats> = await apiClient.get(`/api/v1/cash-sessions/stats/summary?${new URLSearchParams(params).toString()}`);
    return response.data;
  }
}
export class AdminApi {
    /**
   * Liste des utilisateurs (Admin)
   */
  static async usersapiv1adminusersget(params?: any): Promise<AdminUser[]> {
    const response: AxiosResponse<AdminUser[]> = await apiClient.get(`/api/v1/admin/users?${new URLSearchParams(params).toString()}`);
    return response.data;
  }

    /**
   * Modifier le rôle d'un utilisateur (Admin)
   */
  static async userroleapiv1adminusersuseridroleput(user_id, data?: any): Promise<AdminResponse> {
    const response: AxiosResponse<AdminResponse> = await apiClient.put(`/api/v1/admin/users/${user_id}/role`, data);
    return response.data;
  }

    /**
   * Liste des utilisateurs en attente (Admin)
   */
  static async pendingusersapiv1adminuserspendingget(): Promise<PendingUserResponse[]> {
    const response: AxiosResponse<PendingUserResponse[]> = await apiClient.get(`/api/v1/admin/users/pending`);
    return response.data;
  }

    /**
   * Approuver un utilisateur (Admin)
   */
  static async userapiv1adminusersuseridapprovepost(user_id, data?: any): Promise<AdminResponse> {
    const response: AxiosResponse<AdminResponse> = await apiClient.post(`/api/v1/admin/users/${user_id}/approve`, data);
    return response.data;
  }

    /**
   * Rejeter un utilisateur (Admin)
   */
  static async userapiv1adminusersuseridrejectpost(user_id, data?: any): Promise<AdminResponse> {
    const response: AxiosResponse<AdminResponse> = await apiClient.post(`/api/v1/admin/users/${user_id}/reject`, data);
    return response.data;
  }
}
export class MonitoringApi {
    /**
   * Send Test Email
   */
  static async testemailapiv1monitoringtestemailpost(data?: any): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.post(`/api/v1/monitoring/test-email`, data);
    return response.data;
  }

    /**
   * Get Email Metrics
   */
  static async emailmetricsapiv1monitoringemailmetricsget(params?: any): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.get(`/api/v1/monitoring/email/metrics?${new URLSearchParams(params).toString()}`);
    return response.data;
  }

    /**
   * Get Email Metrics Prometheus
   */
  static async emailmetricsprometheusapiv1monitoringemailmetricsprometheusget(): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.get(`/api/v1/monitoring/email/metrics/prometheus`);
    return response.data;
  }

    /**
   * Reset Email Metrics
   */
  static async emailmetricsapiv1monitoringemailmetricsresetpost(): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.post(`/api/v1/monitoring/email/metrics/reset`);
    return response.data;
  }

    /**
   * Get Classification Performance
   */
  static async classificationperformanceapiv1monitoringclassificationperformanceget(params?: any): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.get(`/api/v1/monitoring/classification/performance?${new URLSearchParams(params).toString()}`);
    return response.data;
  }

    /**
   * Export Classification Metrics
   */
  static async classificationmetricsapiv1monitoringclassificationperformanceexportpost(params?: any): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.post(`/api/v1/monitoring/classification/performance/export?${new URLSearchParams(params).toString()}`);
    return response.data;
  }

    /**
   * Get Classification Health
   */
  static async classificationhealthapiv1monitoringclassificationhealthget(): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.get(`/api/v1/monitoring/classification/health`);
    return response.data;
  }

    /**
   * Get Cache Stats
   */
  static async cachestatsapiv1monitoringclassificationcachestatsget(): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.get(`/api/v1/monitoring/classification/cache/stats`);
    return response.data;
  }

    /**
   * Clear Classification Cache
   */
  static async classificationcacheapiv1monitoringclassificationcacheclearpost(): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.post(`/api/v1/monitoring/classification/cache/clear`);
    return response.data;
  }

    /**
   * Export Classification Cache
   */
  static async classificationcacheapiv1monitoringclassificationcacheexportpost(): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.post(`/api/v1/monitoring/classification/cache/export`);
    return response.data;
  }

    /**
   * Get Auth Metrics
   */
  static async authmetricsapiv1monitoringauthmetricsget(params?: any): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.get(`/api/v1/monitoring/auth/metrics?${new URLSearchParams(params).toString()}`);
    return response.data;
  }

    /**
   * Get Auth Metrics Prometheus
   */
  static async authmetricsprometheusapiv1monitoringauthmetricsprometheusget(): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.get(`/api/v1/monitoring/auth/metrics/prometheus`);
    return response.data;
  }

    /**
   * Reset Auth Metrics
   */
  static async authmetricsapiv1monitoringauthmetricsresetpost(): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.post(`/api/v1/monitoring/auth/metrics/reset`);
    return response.data;
  }
}
export class AuthApi {
    /**
   * Login
   */
  static async apiv1authloginpost(data?: any): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await apiClient.post(`/auth/login`, data);
    return response.data;
  }

    /**
   * Signup
   */
  static async apiv1authsignuppost(data?: any): Promise<SignupResponse> {
    const response: AxiosResponse<SignupResponse> = await apiClient.post(`/api/v1/auth/signup`, data);
    return response.data;
  }

    /**
   * Forgot Password
   */
  static async passwordapiv1authforgotpasswordpost(data?: any): Promise<ForgotPasswordResponse> {
    const response: AxiosResponse<ForgotPasswordResponse> = await apiClient.post(`/api/v1/auth/forgot-password`, data);
    return response.data;
  }

    /**
   * Reset Password
   */
  static async passwordapiv1authresetpasswordpost(data?: any): Promise<ResetPasswordResponse> {
    const response: AxiosResponse<ResetPasswordResponse> = await apiClient.post(`/api/v1/auth/reset-password`, data);
    return response.data;
  }
}
export class EmailApi {
    /**
   * Brevo Webhook
   */
  static async webhookapiv1emailwebhookpost(): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.post(`/api/v1/email/webhook`);
    return response.data;
  }

    /**
   * Get Email Status
   */
  static async emailstatusapiv1emailstatusemailaddressget(email_address, params?: any): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.get(`/api/v1/email/status/${email_address}?${new URLSearchParams(params).toString()}`);
    return response.data;
  }

    /**
   * Get Email Events
   */
  static async emaileventsapiv1emaileventsemailaddressget(email_address, params?: any): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.get(`/api/v1/email/events/${email_address}?${new URLSearchParams(params).toString()}`);
    return response.data;
  }

    /**
   * Email Service Health
   */
  static async servicehealthapiv1emailhealthget(): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.get(`/api/v1/email/health`);
    return response.data;
  }
}
export class DefaultApi {
    /**
   * Root
   */
  static async get(): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.get(`/`);
    return response.data;
  }

    /**
   * Health Check
   */
  static async checkhealthget(): Promise<any> {
    const response: AxiosResponse<any> = await apiClient.get(`/health`);
    return response.data;
  }
}

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export default {
  client: apiClient
};