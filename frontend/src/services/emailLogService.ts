/**
 * Service for managing email logs
 */

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  BOUNCED = 'bounced',
  FAILED = 'failed'
}

export enum EmailType {
  PASSWORD_RESET = 'password_reset',
  WELCOME = 'welcome',
  NOTIFICATION = 'notification',
  ADMIN_NOTIFICATION = 'admin_notification',
  OTHER = 'other'
}

export interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  body_text?: string;
  body_html?: string;
  email_type: EmailType;
  status: EmailStatus;
  external_id?: string;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  bounced_at?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  additional_data?: string;
}

export interface EmailLogListResponse {
  email_logs: EmailLog[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface EmailLogFilters {
  recipient_email?: string;
  status?: EmailStatus;
  email_type?: EmailType;
  user_id?: string;
  page?: number;
  per_page?: number;
}

class EmailLogService {
  private baseUrl = '/api/v1/admin';

  async getEmailLogs(filters: EmailLogFilters = {}): Promise<EmailLogListResponse> {
    const params = new URLSearchParams();
    
    if (filters.recipient_email) {
      params.append('recipient_email', filters.recipient_email);
    }
    if (filters.status) {
      params.append('status', filters.status);
    }
    if (filters.email_type) {
      params.append('email_type', filters.email_type);
    }
    if (filters.user_id) {
      params.append('user_id', filters.user_id);
    }
    if (filters.page) {
      params.append('page', filters.page.toString());
    }
    if (filters.per_page) {
      params.append('per_page', filters.per_page.toString());
    }

    const response = await fetch(`${this.baseUrl}/email-logs?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de la récupération des logs d\'emails');
    }

    return response.json();
  }

  async getEmailLogById(id: string): Promise<EmailLog> {
    const response = await fetch(`${this.baseUrl}/email-logs/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de la récupération du log d\'email');
    }

    return response.json();
  }
}

export const emailLogService = new EmailLogService();


