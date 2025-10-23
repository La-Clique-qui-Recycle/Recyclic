import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEmailLogsStore } from '../../stores/emailLogsStore';
import { emailLogService } from '../../services/emailLogService';
import { EmailLog, EmailStatus, EmailType } from '../../services/emailLogService';

// Mock the email log service
vi.mock('../../services/emailLogService', () => ({
  emailLogService: {
    getEmailLogs: vi.fn()
  }
}));

const mockEmailLogs: EmailLog[] = [
  {
    id: '1',
    recipient_email: 'test1@example.com',
    recipient_name: 'Test User 1',
    subject: 'Password Reset',
    body_text: 'Reset your password',
    body_html: '<p>Reset your password</p>',
    email_type: EmailType.PASSWORD_RESET,
    status: EmailStatus.SENT,
    external_id: 'ext-123',
    error_message: null,
    sent_at: '2024-01-01T10:00:00Z',
    delivered_at: null,
    opened_at: null,
    clicked_at: null,
    bounced_at: null,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    user_id: 'user-1',
    metadata: null
  },
  {
    id: '2',
    recipient_email: 'test2@example.com',
    recipient_name: 'Test User 2',
    subject: 'Welcome Email',
    body_text: 'Welcome to our platform',
    body_html: '<p>Welcome to our platform</p>',
    email_type: EmailType.WELCOME,
    status: EmailStatus.DELIVERED,
    external_id: 'ext-456',
    error_message: null,
    sent_at: '2024-01-01T11:00:00Z',
    delivered_at: '2024-01-01T11:05:00Z',
    opened_at: null,
    clicked_at: null,
    bounced_at: null,
    created_at: '2024-01-01T11:00:00Z',
    updated_at: '2024-01-01T11:05:00Z',
    user_id: 'user-2',
    metadata: null
  }
];

const mockResponse = {
  email_logs: mockEmailLogs,
  total: 2,
  page: 1,
  per_page: 50,
  total_pages: 1
};

describe('EmailLogsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store state
    useEmailLogsStore.setState({
      emailLogs: [],
      loading: false,
      error: null,
      total: 0,
      page: 1,
      perPage: 50,
      totalPages: 0,
      filters: {}
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useEmailLogsStore.getState();
      
      expect(state.emailLogs).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.total).toBe(0);
      expect(state.page).toBe(1);
      expect(state.perPage).toBe(50);
      expect(state.totalPages).toBe(0);
      expect(state.filters).toEqual({});
    });
  });

  describe('fetchEmailLogs', () => {
    it('should fetch email logs successfully', async () => {
      vi.mocked(emailLogService.getEmailLogs).mockResolvedValue(mockResponse);
      
      const { fetchEmailLogs } = useEmailLogsStore.getState();
      await fetchEmailLogs();
      
      const state = useEmailLogsStore.getState();
      expect(state.emailLogs).toEqual(mockEmailLogs);
      expect(state.total).toBe(2);
      expect(state.page).toBe(1);
      expect(state.perPage).toBe(50);
      expect(state.totalPages).toBe(1);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      const errorMessage = 'Failed to fetch email logs';
      vi.mocked(emailLogService.getEmailLogs).mockRejectedValue(new Error(errorMessage));
      
      const { fetchEmailLogs } = useEmailLogsStore.getState();
      await fetchEmailLogs();
      
      const state = useEmailLogsStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.loading).toBe(false);
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(emailLogService.getEmailLogs).mockReturnValue(promise);
      
      const { fetchEmailLogs } = useEmailLogsStore.getState();
      fetchEmailLogs();
      
      // Check loading state is set
      let state = useEmailLogsStore.getState();
      expect(state.loading).toBe(true);
      
      // Resolve the promise
      resolvePromise!(mockResponse);
      await promise;
      
      // Check final state
      state = useEmailLogsStore.getState();
      expect(state.loading).toBe(false);
    });

    it('should pass correct parameters to service', async () => {
      vi.mocked(emailLogService.getEmailLogs).mockResolvedValue(mockResponse);
      
      // Set some filters and pagination
      useEmailLogsStore.setState({
        filters: { status: EmailStatus.SENT, recipient_email: 'test@example.com' },
        page: 2,
        perPage: 25
      });
      
      const { fetchEmailLogs } = useEmailLogsStore.getState();
      await fetchEmailLogs();
      
      expect(emailLogService.getEmailLogs).toHaveBeenCalledWith({
        status: EmailStatus.SENT,
        recipient_email: 'test@example.com',
        page: 2,
        per_page: 25
      });
    });
  });

  describe('setFilters', () => {
    it('should update filters correctly', () => {
      const { setFilters } = useEmailLogsStore.getState();
      
      setFilters({ status: EmailStatus.SENT, recipient_email: 'test@example.com' });
      
      const state = useEmailLogsStore.getState();
      expect(state.filters).toEqual({
        status: EmailStatus.SENT,
        recipient_email: 'test@example.com'
      });
    });

    it('should merge with existing filters', () => {
      // Set initial filters
      useEmailLogsStore.setState({
        filters: { status: EmailStatus.SENT }
      });
      
      const { setFilters } = useEmailLogsStore.getState();
      setFilters({ recipient_email: 'test@example.com' });
      
      const state = useEmailLogsStore.getState();
      expect(state.filters).toEqual({
        status: EmailStatus.SENT,
        recipient_email: 'test@example.com'
      });
    });
  });

  describe('setPage', () => {
    it('should update page correctly', () => {
      const { setPage } = useEmailLogsStore.getState();
      
      setPage(3);
      
      const state = useEmailLogsStore.getState();
      expect(state.page).toBe(3);
    });
  });

  describe('setPerPage', () => {
    it('should update perPage correctly', () => {
      const { setPerPage } = useEmailLogsStore.getState();
      
      setPerPage(25);
      
      const state = useEmailLogsStore.getState();
      expect(state.perPage).toBe(25);
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      // Set an error first
      useEmailLogsStore.setState({ error: 'Some error' });
      
      const { clearError } = useEmailLogsStore.getState();
      clearError();
      
      const state = useEmailLogsStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('Integration', () => {
    it('should handle complete workflow', async () => {
      vi.mocked(emailLogService.getEmailLogs).mockResolvedValue(mockResponse);
      
      const { fetchEmailLogs, setFilters, setPage } = useEmailLogsStore.getState();
      
      // Set filters
      setFilters({ status: EmailStatus.SENT });
      
      // Set page
      setPage(2);
      
      // Fetch data
      await fetchEmailLogs();
      
      const state = useEmailLogsStore.getState();
      expect(state.emailLogs).toEqual(mockEmailLogs);
      expect(state.filters).toEqual({ status: EmailStatus.SENT });
      expect(state.page).toBe(2);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle error and recovery', async () => {
      const errorMessage = 'Network error';
      vi.mocked(emailLogService.getEmailLogs)
        .mockRejectedValueOnce(new Error(errorMessage))
        .mockResolvedValueOnce(mockResponse);
      
      const { fetchEmailLogs, clearError } = useEmailLogsStore.getState();
      
      // First fetch should fail
      await fetchEmailLogs();
      let state = useEmailLogsStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.loading).toBe(false);
      
      // Clear error
      clearError();
      state = useEmailLogsStore.getState();
      expect(state.error).toBeNull();
      
      // Second fetch should succeed
      await fetchEmailLogs();
      state = useEmailLogsStore.getState();
      expect(state.emailLogs).toEqual(mockEmailLogs);
      expect(state.error).toBeNull();
    });
  });
});


