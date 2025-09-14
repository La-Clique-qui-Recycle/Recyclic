/**
 * Client API généré automatiquement à partir de la spécification OpenAPI
 * Source: ../api/openapi.json
 * Généré le: 2025-09-14T22:21:41.908Z
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

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4433/api/v1';

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
export class Cash-sessionsApi {
    /**
   * Get Cash Sessions
   */
  static async cashsessionsapiv1cashsessionsget(params?: any): Promise<CashSessionResponse[]> {
    const response: AxiosResponse<CashSessionResponse[]> = await apiClient.get(`/api/v1/cash-sessions/?${new URLSearchParams(params).toString()}`);
    return response.data;
  }

    /**
   * Create Cash Session
   */
  static async cashsessionapiv1cashsessionspost(data?: any): Promise<CashSessionResponse> {
    const response: AxiosResponse<CashSessionResponse> = await apiClient.post(`/api/v1/cash-sessions/`, data);
    return response.data;
  }

    /**
   * Get Cash Session
   */
  static async cashsessionapiv1cashsessionssessionidget(session_id): Promise<CashSessionResponse> {
    const response: AxiosResponse<CashSessionResponse> = await apiClient.get(`/api/v1/cash-sessions/${session_id}`);
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