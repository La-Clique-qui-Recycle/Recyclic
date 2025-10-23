import { create } from 'zustand';
import { EmailLog, EmailLogListResponse, EmailLogFilters, EmailStatus, EmailType } from '../services/emailLogService';
import { emailLogService } from '../services/emailLogService';

interface EmailLogsState {
  emailLogs: EmailLog[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  filters: EmailLogFilters;
  
  // Actions
  fetchEmailLogs: () => Promise<void>;
  setFilters: (filters: Partial<EmailLogFilters>) => void;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  clearError: () => void;
}

export const useEmailLogsStore = create<EmailLogsState>((set, get) => ({
  emailLogs: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  perPage: 50,
  totalPages: 0,
  filters: {},

  fetchEmailLogs: async () => {
    set({ loading: true, error: null });
    
    try {
      const { filters, page, perPage } = get();
      const response: EmailLogListResponse = await emailLogService.getEmailLogs({
        ...filters,
        page,
        per_page: perPage
      });
      
      set({
        emailLogs: response.email_logs,
        total: response.total,
        page: response.page,
        perPage: response.per_page,
        totalPages: response.total_pages,
        loading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        loading: false
      });
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  setPage: (page) => {
    set({ page });
  },

  setPerPage: (perPage) => {
    set({ perPage });
  },

  clearError: () => {
    set({ error: null });
  }
}));


