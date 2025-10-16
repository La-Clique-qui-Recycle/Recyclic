/**
 * Types générés automatiquement à partir de la spécification OpenAPI
 * Source: ../api/openapi.json
 * Généré le: 2025-10-15T12:52:29.503Z
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum CashSessionStatus {
  OPEN = 'open',
  CLOSED = 'closed'
}
export enum DepositStatus {
  PENDING_AUDIO = 'pending_audio',
  AUDIO_PROCESSING = 'audio_processing',
  PENDING_VALIDATION = 'pending_validation',
  CLASSIFICATION_FAILED = 'classification_failed',
  CLASSIFIED = 'classified',
  VALIDATED = 'validated',
  COMPLETED = 'completed'
}
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
  REJECTED = 'rejected',
  ACTIVE = 'active'
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface ActivityEvent {
  id: string | string;
  event_type: string;
  description: string;
  date: string;
  metadata?: object | any;
}
export interface AdminResponse {
  data?: object | any;
  message: string;
  success?: boolean;
}
export interface AdminUser {
  id: string | string;
  telegram_id?: string | number | any;
  username?: string | any;
  first_name?: string | any;
  last_name?: string | any;
  full_name?: string | any;
  email?: string | any;
  role: UserRole;
  status: UserStatus;
  is_active: boolean;
  site_id?: string | string | any;
  created_at: string;
  updated_at: string;
}
export interface AlertThresholds_Input {
  cash_discrepancy: number;
  low_inventory: number;
}
export interface AlertThresholds_Output {
  cashDiscrepancy: number;
  lowInventory: number;
}
export interface AlertThresholdsResponse {
  thresholds: AlertThresholds_Output;
  siteId?: string | any;
}
export interface AlertThresholdsUpdate {
  thresholds: AlertThresholds_Input;
  site_id?: string | any;
}
export interface AuthUser {
  id: string;
  telegram_id?: number | any;
  username?: string | any;
  first_name?: string | any;
  last_name?: string | any;
  role: string;
  status?: string | any;
  is_active: boolean;
  created_at?: string | any;
  updated_at?: string | any;
}
export interface CashRegisterCreate {
  name: string;
  location?: string | any;
  site_id?: string | any;
  is_active?: boolean;
}
export interface CashRegisterResponse {
  name: string;
  location?: string | any;
  site_id?: string | any;
  is_active?: boolean;
  id: string;
}
export interface CashRegisterUpdate {
  name?: string | any;
  location?: string | any;
  site_id?: string | any;
  is_active?: boolean | any;
}
export interface CashSessionClose {
  actual_amount: number;
  variance_comment?: string | any;
}
export interface CashSessionCreate {
  operator_id: string;
  site_id: string;
  register_id?: string | any;
  initial_amount: number;
}
export interface CashSessionListResponse {
  data: CashSessionResponse[];
  total: number;
  skip: number;
  limit: number;
}
export interface CashSessionResponse {
  operator_id: string;
  site_id: string;
  register_id?: string | any;
  initial_amount: number;
  id: string;
  current_amount: number;
  status: any;
  opened_at: string;
  closed_at?: string | any;
  total_sales?: number | any;
  total_items?: number | any;
  closing_amount?: number | any;
  actual_amount?: number | any;
  variance?: number | any;
  variance_comment?: string | any;
  report_download_url?: string | any;
  report_email_sent?: boolean | any;
}
export interface CashSessionStats {
  total_sessions: number;
  open_sessions: number;
  closed_sessions: number;
  total_sales: number;
  total_items: number;
  average_session_duration?: number | any;
}
export interface CashSessionSummary {
  sessionId: string;
  siteId: string;
  operator: string;
  openedAt: string;
  closedAt?: string | any;
  initialAmount: number;
  currentAmount: number;
  totalSales: number;
  totalItems: number;
  status: string;
}
export interface CashSessionUpdate {
  status?: CashSessionStatus | any;
  current_amount?: number | any;
  total_sales?: number | any;
  total_items?: number | any;
}
export interface DashboardMetrics {
  totalSessions: number;
  openSessions: number;
  closedSessions: number;
  totalSales: number;
  totalItems: number;
  averageSessionDuration?: number | any;
}
export interface DashboardStatsResponse {
  metrics: DashboardMetrics;
  encryptedMetrics: string;
  recentReports?: RecentReport[];
  recentSessions?: CashSessionSummary[];
}
export interface DepositCreate {
  user_id: string;
  site_id?: string | any;
  telegram_user_id?: string | any;
  audio_file_path?: string | any;
  status?: DepositStatus | any;
  category?: EEECategory | any;
  weight?: number | any;
  description?: string | any;
  ai_classification?: string | any;
  ai_confidence?: number | any;
  transcription?: string | any;
  eee_category?: EEECategory | any;
  confidence_score?: number | any;
  alternative_categories?: object | object[] | any;
}
export interface DepositCreateFromBot {
  telegram_user_id: string;
  audio_file_path?: string | any;
  status?: any;
}
export interface DepositFinalize {
  final_category?: EEECategory | any;
  correction_applied?: boolean;
  validated?: boolean;
}
export interface DepositResponse {
  user_id: string;
  site_id?: string | any;
  telegram_user_id?: string | any;
  audio_file_path?: string | any;
  status?: DepositStatus | any;
  category?: EEECategory | any;
  weight?: number | any;
  description?: string | any;
  ai_classification?: string | any;
  ai_confidence?: number | any;
  transcription?: string | any;
  eee_category?: EEECategory | any;
  confidence_score?: number | any;
  alternative_categories?: object | object[] | any;
  id: string;
  created_at: string;
  updated_at: string;
}
export interface ForgotPasswordRequest {
  email: string;
}
export interface ForgotPasswordResponse {
  message: string;
}
export interface HTTPValidationError {
  detail?: ValidationError[];
}
export interface LoginRequest {
  username: string;
  password: string;
}
export interface LoginResponse {
  access_token: string;
  token_type?: string;
  user: AuthUser;
}
export interface PendingUserResponse {
  id: string | string;
  telegram_id: number | string;
  username?: string | any;
  first_name?: string | any;
  last_name?: string | any;
  full_name?: string | any;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}
export interface RecentReport {
  filename: string;
  downloadUrl: string;
  generatedAt: string;
  sizeBytes: number;
}
export interface ReportEntry {
  filename: string;
  size_bytes: number;
  modified_at: string;
  download_url: string;
}
export interface ReportListResponse {
  reports: ReportEntry[];
  total: number;
}
export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}
export interface ResetPasswordResponse {
  message: string;
}
export interface SaleCreate {
  cash_session_id: string;
  items: SaleItemCreate[];
  total_amount: number;
}
export interface SaleItemCreate {
  category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}
export interface SaleItemResponse {
  category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  id: string;
  sale_id: string;
}
export interface SaleResponse {
  cash_session_id: string;
  total_amount: number;
  id: string;
  created_at: string;
  updated_at: string;
  items?: SaleItemResponse[];
}
export interface SignupRequest {
  username: string;
  password: string;
  email?: string | any;
}
export interface SignupResponse {
  message: string;
  user_id: string;
  status: string;
}
export interface SiteCreate {
  name: string;
  address?: string | any;
  city?: string | any;
  postal_code?: string | any;
  country?: string | any;
  configuration?: object | any;
  is_active?: boolean;
}
export interface SiteResponse {
  name: string;
  address?: string | any;
  city?: string | any;
  postal_code?: string | any;
  country?: string | any;
  configuration?: object | any;
  is_active?: boolean;
  id: string;
  created_at: string;
  updated_at: string;
}
export interface SiteUpdate {
  name?: string | any;
  address?: string | any;
  city?: string | any;
  postal_code?: string | any;
  country?: string | any;
  configuration?: object | any;
  is_active?: boolean | any;
}
export interface TestEmailRequest {
  to_email: string;
}
export interface UserApprovalRequest {
  message?: string | any;
}
export interface UserCreate {
  telegram_id?: string | any;
  username?: string | any;
  first_name?: string | any;
  last_name?: string | any;
  role?: any;
  status?: any;
  is_active?: boolean;
  site_id?: string | any;
  password: string;
}
export interface UserHistoryResponse {
  user_id: string | string;
  events: ActivityEvent[];
  total_count: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}
export interface UserProfileUpdate {
  first_name?: string | any;
  last_name?: string | any;
  username?: string | any;
  role?: UserRole | any;
  status?: UserStatus | any;
}
export interface UserRejectionRequest {
  reason?: string | any;
}
export interface UserResponse {
  telegram_id?: string | any;
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
export interface UserStatusUpdate {
  status: UserStatus;
  is_active: boolean;
  reason?: string | any;
}
export interface UserUpdate {
  username?: string | any;
  first_name?: string | any;
  last_name?: string | any;
  role?: UserRole | any;
  status?: UserStatus | any;
  is_active?: boolean | any;
  site_id?: string | any;
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