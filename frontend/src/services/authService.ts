export interface LoginRequest {
  telegram_id: string;
}

export interface AuthUser {
  id: string;
  telegram_id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  role: 'user' | 'admin' | 'super-admin' | 'manager';
  status?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  user: AuthUser;
}

import axiosClient from '../api/axiosClient';

export async function login(request: LoginRequest): Promise<LoginResponse> {
  // axiosClient gère la baseURL et l'intercepteur ajoute le token
  const response = await axiosClient.post('/auth/login', request);
  const data = response.data as LoginResponse;
  localStorage.setItem('token', data.access_token);
  return data;
}

export function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
