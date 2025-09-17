export interface LoginRequest {
  telegram_id: string;
}

export interface AuthUser {
  id: string;
  telegram_id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  role: 'user' | 'admin' | 'super-admin' | 'manager' | 'cashier';
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

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => 'Erreur de connexion');
    throw new Error(message || 'Identifiants invalides');
  }
  const data = (await response.json()) as LoginResponse;
  localStorage.setItem('token', data.access_token);
  return data;
}

export function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
