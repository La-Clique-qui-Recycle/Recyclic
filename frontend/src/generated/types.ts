/**
 * Types générés automatiquement à partir de la spécification OpenAPI
 * Source: ../api/openapi.json
 * Généré le: 2025-09-14T22:21:41.899Z
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum EEECategory {
  SMALL_APPLIANCE = 'small_appliance',
  LARGE_APPLIANCE = 'large_appliance',
  IT_EQUIPMENT = 'it_equipment',
  LIGHTING = 'lighting',
  TOOLS = 'tools',
  TOYS = 'toys',
  MEDICAL_DEVICES = 'medical_devices',
  MONITORING_CONTROL = 'monitoring_control',
  AUTOMATIC_DISPENSERS = 'automatic_dispensers',
  OTHER = 'other'
}
export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  MOBILE_PAYMENT = 'mobile_payment',
  VOUCHER = 'voucher'
}
export enum SessionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  PAUSED = 'paused'
}
export enum UserRole {
  SUPER_ADMIN = 'super-admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  CASHIER = 'cashier',
  USER = 'user'
}
export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface AdminResponse {
  data?: object | any;
  message: string;
  success?: boolean;
}
export interface AdminUser {
  id: string;
  telegram_id: number;
  username?: string | any;
  first_name?: string | any;
  last_name?: string | any;
  full_name?: string | any;
  email?: string | any;
  role: UserRole;
  status: UserStatus;
  is_active: boolean;
  site_id?: string | any;
  created_at: string;
  updated_at: string;
}
export interface CashSessionCreate {
  user_id: string;
  site_id: string;
  status?: any;
  total_amount?: number;
}
export interface CashSessionResponse {
  user_id: string;
  site_id: string;
  status?: any;
  total_amount?: number;
  id: string;
  opened_at: string;
  closed_at?: string | any;
  created_at: string;
  updated_at: string;
}
export interface DepositCreate {
  user_id: string;
  site_id: string;
  category: EEECategory;
  weight?: number | any;
  description?: string | any;
  ai_classification?: string | any;
  ai_confidence?: number | any;
}
export interface DepositResponse {
  user_id: string;
  site_id: string;
  category: EEECategory;
  weight?: number | any;
  description?: string | any;
  ai_classification?: string | any;
  ai_confidence?: number | any;
  id: string;
  created_at: string;
  updated_at: string;
}
export interface HTTPValidationError {
  detail?: ValidationError[];
}
export interface SaleCreate {
  cash_session_id: string;
  deposit_id: string;
  amount: number;
  payment_method: PaymentMethod;
}
export interface SaleResponse {
  cash_session_id: string;
  deposit_id: string;
  amount: number;
  payment_method: PaymentMethod;
  id: string;
  created_at: string;
  updated_at: string;
}
export interface SiteCreate {
  name: string;
  address?: string | any;
  configuration?: object | any;
  is_active?: boolean;
}
export interface SiteResponse {
  name: string;
  address?: string | any;
  configuration?: object | any;
  is_active?: boolean;
  id: string;
  created_at: string;
  updated_at: string;
}
export interface UserCreate {
  telegram_id: string;
  username?: string | any;
  first_name?: string | any;
  last_name?: string | any;
  role?: any;
  status?: any;
  is_active?: boolean;
  site_id?: string | any;
}
export interface UserResponse {
  telegram_id: string;
  username?: string | any;
  first_name?: string | any;
  last_name?: string | any;
  role?: any;
  status?: any;
  is_active?: boolean;
  site_id?: string | any;
  id: string;
  created_at: string;
  updated_at: string;
}
export interface UserRoleUpdate {
  role: any;
}
export interface ValidationError {
  loc: string | number[];
  msg: string;
  type: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  detail: string;
  type?: string;
  code?: string;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}