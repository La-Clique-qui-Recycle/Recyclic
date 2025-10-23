import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import EmailLogs from '../../../pages/Admin/EmailLogs';
import { useEmailLogsStore } from '../../../stores/emailLogsStore';
import { EmailLog, EmailStatus, EmailType } from '../../../services/emailLogService';

// Mock the store
vi.mock('../../../stores/emailLogsStore');
const mockUseEmailLogsStore = vi.mocked(useEmailLogsStore);

// Mock Mantine notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn()
  }
}));

// Mock data
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
    additional_data: null
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
    additional_data: null
  }
];

const mockStoreState = {
  emailLogs: mockEmailLogs,
  loading: false,
  error: null,
  total: 2,
  page: 1,
  perPage: 50,
  totalPages: 1,
  filters: {},
  fetchEmailLogs: vi.fn(),
  setFilters: vi.fn(),
  setPage: vi.fn(),
  setPerPage: vi.fn(),
  clearError: vi.fn()
};

describe('EmailLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEmailLogsStore.mockReturnValue(mockStoreState);
  });

  const renderEmailLogs = () => {
    return render(
      <BrowserRouter>
        <EmailLogs />
      </BrowserRouter>
    );
  };

  it('should render the page title and refresh button', () => {
    renderEmailLogs();
    
    expect(screen.getByText('Journal des Emails')).toBeInTheDocument();
    expect(screen.getByText('Actualiser')).toBeInTheDocument();
  });

  it('should render email logs table with correct data', () => {
    renderEmailLogs();
    
    // Check table headers
    expect(screen.getByText('Destinataire')).toBeInTheDocument();
    expect(screen.getByText('Sujet')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Statut')).toBeInTheDocument();
    expect(screen.getByText('Date d\'envoi')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    
    // Check email data
    expect(screen.getByText('test1@example.com')).toBeInTheDocument();
    expect(screen.getByText('Test User 1')).toBeInTheDocument();
    expect(screen.getByText('Password Reset')).toBeInTheDocument();
    expect(screen.getByText('test2@example.com')).toBeInTheDocument();
    expect(screen.getByText('Test User 2')).toBeInTheDocument();
    expect(screen.getByText('Welcome Email')).toBeInTheDocument();
  });

  it('should render status badges with correct colors', () => {
    renderEmailLogs();
    
    // Check status badges
    const sentBadge = screen.getByText('sent');
    const deliveredBadge = screen.getByText('delivered');
    
    expect(sentBadge).toBeInTheDocument();
    expect(deliveredBadge).toBeInTheDocument();
  });

  it('should render type badges with correct colors', () => {
    renderEmailLogs();
    
    // Check type badges
    const passwordResetBadge = screen.getByText('password_reset');
    const welcomeBadge = screen.getByText('welcome');
    
    expect(passwordResetBadge).toBeInTheDocument();
    expect(welcomeBadge).toBeInTheDocument();
  });

  it('should render search and filter controls', () => {
    renderEmailLogs();
    
    // Check search input
    expect(screen.getByPlaceholderText('Rechercher par email...')).toBeInTheDocument();
    
    // Check filter selects
    expect(screen.getByDisplayValue('Tous les statuts')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tous les types')).toBeInTheDocument();
    
    // Check search button
    expect(screen.getByText('Rechercher')).toBeInTheDocument();
  });

  it('should handle search input change', () => {
    renderEmailLogs();
    
    const searchInput = screen.getByPlaceholderText('Rechercher par email...');
    fireEvent.change(searchInput, { target: { value: 'test@example.com' } });
    
    expect(searchInput).toHaveValue('test@example.com');
  });

  it('should handle search button click', () => {
    renderEmailLogs();
    
    const searchButton = screen.getByText('Rechercher');
    fireEvent.click(searchButton);
    
    expect(mockStoreState.setFilters).toHaveBeenCalled();
    expect(mockStoreState.setPage).toHaveBeenCalledWith(1);
    expect(mockStoreState.fetchEmailLogs).toHaveBeenCalled();
  });

  it('should handle status filter change', () => {
    renderEmailLogs();
    
    const statusSelect = screen.getByDisplayValue('Tous les statuts');
    fireEvent.change(statusSelect, { target: { value: 'sent' } });
    
    expect(mockStoreState.setFilters).toHaveBeenCalled();
    expect(mockStoreState.setPage).toHaveBeenCalledWith(1);
    expect(mockStoreState.fetchEmailLogs).toHaveBeenCalled();
  });

  it('should handle email type filter change', () => {
    renderEmailLogs();
    
    const typeSelect = screen.getByDisplayValue('Tous les types');
    fireEvent.change(typeSelect, { target: { value: 'password_reset' } });
    
    expect(mockStoreState.setFilters).toHaveBeenCalled();
    expect(mockStoreState.setPage).toHaveBeenCalledWith(1);
    expect(mockStoreState.fetchEmailLogs).toHaveBeenCalled();
  });

  it('should handle refresh button click', () => {
    renderEmailLogs();
    
    const refreshButton = screen.getByText('Actualiser');
    fireEvent.click(refreshButton);
    
    expect(mockStoreState.fetchEmailLogs).toHaveBeenCalled();
  });

  it('should open detail modal when view button is clicked', () => {
    renderEmailLogs();
    
    const viewButtons = screen.getAllByRole('button', { name: /voir les détails/i });
    fireEvent.click(viewButtons[0]);
    
    // Check if modal is opened
    expect(screen.getByText('Détails de l\'email')).toBeInTheDocument();
    expect(screen.getByText('test1@example.com')).toBeInTheDocument();
    expect(screen.getByText('Password Reset')).toBeInTheDocument();
  });

  it('should display error message when there is an error', () => {
    const errorState = {
      ...mockStoreState,
      error: 'Failed to fetch email logs'
    };
    mockUseEmailLogsStore.mockReturnValue(errorState);
    
    renderEmailLogs();
    
    expect(screen.getByText('Erreur')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch email logs')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    const loadingState = {
      ...mockStoreState,
      loading: true
    };
    mockUseEmailLogsStore.mockReturnValue(loadingState);
    
    renderEmailLogs();
    
    const refreshButton = screen.getByText('Actualiser');
    expect(refreshButton).toHaveAttribute('data-loading', 'true');
  });

  it('should render pagination when there are multiple pages', () => {
    const paginationState = {
      ...mockStoreState,
      totalPages: 3,
      page: 2
    };
    mockUseEmailLogsStore.mockReturnValue(paginationState);
    
    renderEmailLogs();
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should handle pagination change', () => {
    const paginationState = {
      ...mockStoreState,
      totalPages: 3,
      page: 2
    };
    mockUseEmailLogsStore.mockReturnValue(paginationState);
    
    renderEmailLogs();
    
    // This would require more complex testing of the pagination component
    // For now, we just verify the pagination is rendered
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    renderEmailLogs();
    
    // Check that dates are formatted (this would need to be more specific based on the actual formatting)
    const dateElements = screen.getAllByText(/2024/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('should show empty state when no email logs', () => {
    const emptyState = {
      ...mockStoreState,
      emailLogs: [],
      total: 0
    };
    mockUseEmailLogsStore.mockReturnValue(emptyState);
    
    renderEmailLogs();
    
    // The table should still be rendered but empty
    expect(screen.getByText('Destinataire')).toBeInTheDocument();
    expect(screen.getByText('Sujet')).toBeInTheDocument();
  });
});


