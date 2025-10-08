// Types simples pour contourner le problème d'import
export interface UserCreate {
  telegram_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  status?: string;
  is_active?: boolean;
  site_id?: string;
}

export interface UserResponse {
  id: string;
  telegram_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  status?: string;
  is_active?: boolean;
  site_id?: string;
  created_at: string;
  updated_at: string;
}

export enum UserRole {
  SUPER_ADMIN = 'super-admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user'
}

export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface UserRoleUpdate {
  role: string;
}

export interface UserStatusUpdate {
  status: string;
}

export interface UserUpdate {
  username?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  status?: string;
  is_active?: boolean;
  site_id?: string;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}
