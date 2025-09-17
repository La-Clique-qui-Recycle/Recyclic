import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { NotificationsProvider } from '@mantine/notifications';
import OpenCashSession from '../../../pages/CashRegister/OpenCashSession';
import { useCashSessionStore } from '../../../stores/cashSessionStore';
import { useAuthStore } from '../../../stores/authStore';

// Mock des stores
jest.mock('../../../stores/cashSessionStore');
jest.mock('../../../stores/authStore');

// Mock de react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockUseCashSessionStore = useCashSessionStore as jest.MockedFunction<typeof useCashSessionStore>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

const mockCashSessionStore = {
  openSession: jest.fn(),
  loading: false,
  error: null,
  clearError: jest.fn(),
};

const mockAuthStore = {
  currentUser: {
    id: 'test-user-id',
    username: 'testuser',
    role: 'cashier',
    status: 'approved',
    is_active: true,
    created_at: '2025-01-27T10:00:00Z',
    updated_at: '2025-01-27T10:00:00Z',
    telegram_id: 123456789,
    first_name: 'Test',
    last_name: 'User'
  },
  isAuthenticated: true,
  loading: false,
  error: null,
  setCurrentUser: jest.fn(),
  setAuthenticated: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
  clearError: jest.fn(),
  logout: jest.fn(),
  isAdmin: jest.fn(() => false),
  isCashier: jest.fn(() => true),
  canManageUsers: jest.fn(() => false)
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <MantineProvider>
        <NotificationsProvider>
          {component}
        </NotificationsProvider>
      </MantineProvider>
    </BrowserRouter>
  );
};

describe('OpenCashSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCashSessionStore.mockReturnValue(mockCashSessionStore);
    mockUseAuthStore.mockReturnValue(mockAuthStore);
  });

  it('renders the form correctly', () => {
    renderWithProviders(<OpenCashSession />);
    
    expect(screen.getByText('Ouverture de Session de Caisse')).toBeInTheDocument();
    expect(screen.getByLabelText('Opérateur')).toBeInTheDocument();
    expect(screen.getByLabelText('Fond de caisse initial')).toBeInTheDocument();
    expect(screen.getByText('Ouvrir la Session')).toBeInTheDocument();
    expect(screen.getByText('Annuler')).toBeInTheDocument();
  });

  it('displays current user as operator', () => {
    renderWithProviders(<OpenCashSession />);
    
    const operatorSelect = screen.getByLabelText('Opérateur');
    expect(operatorSelect).toHaveValue('test-user-id');
  });

  it('validates form inputs', async () => {
    renderWithProviders(<OpenCashSession />);
    
    const submitButton = screen.getByText('Ouvrir la Session');
    fireEvent.click(submitButton);
    
    // Le formulaire devrait rester affiché car la validation échoue
    expect(screen.getByText('Ouverture de Session de Caisse')).toBeInTheDocument();
  });

  it('validates negative amount', async () => {
    renderWithProviders(<OpenCashSession />);
    
    const amountInput = screen.getByLabelText('Fond de caisse initial');
    fireEvent.change(amountInput, { target: { value: '-10' } });
    
    const submitButton = screen.getByText('Ouvrir la Session');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Le montant initial ne peut pas être négatif')).toBeInTheDocument();
    });
  });

  it('validates amount too high', async () => {
    renderWithProviders(<OpenCashSession />);
    
    const amountInput = screen.getByLabelText('Fond de caisse initial');
    fireEvent.change(amountInput, { target: { value: '15000' } });
    
    const submitButton = screen.getByText('Ouvrir la Session');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Le montant initial ne peut pas dépasser 10 000€')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockSession = {
      id: 'session-123',
      operator_id: 'test-user-id',
      initial_amount: 50.0,
      current_amount: 50.0,
      status: 'open',
      opened_at: '2025-01-27T10:00:00Z',
      total_sales: 0,
      total_items: 0
    };

    mockCashSessionStore.openSession.mockResolvedValue(mockSession);

    renderWithProviders(<OpenCashSession />);
    
    const amountInput = screen.getByLabelText('Fond de caisse initial');
    fireEvent.change(amountInput, { target: { value: '50' } });
    
    const submitButton = screen.getByText('Ouvrir la Session');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockCashSessionStore.openSession).toHaveBeenCalledWith({
        operator_id: 'test-user-id',
        initial_amount: 50
      });
    });
  });

  it('handles successful session creation', async () => {
    const mockSession = {
      id: 'session-123',
      operator_id: 'test-user-id',
      initial_amount: 50.0,
      current_amount: 50.0,
      status: 'open',
      opened_at: '2025-01-27T10:00:00Z',
      total_sales: 0,
      total_items: 0
    };

    mockCashSessionStore.openSession.mockResolvedValue(mockSession);

    renderWithProviders(<OpenCashSession />);
    
    const amountInput = screen.getByLabelText('Fond de caisse initial');
    fireEvent.change(amountInput, { target: { value: '50' } });
    
    const submitButton = screen.getByText('Ouvrir la Session');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/cash-register/sale');
    });
  });

  it('handles session creation error', async () => {
    mockCashSessionStore.openSession.mockRejectedValue(new Error('Erreur de création'));

    renderWithProviders(<OpenCashSession />);
    
    const amountInput = screen.getByLabelText('Fond de caisse initial');
    fireEvent.change(amountInput, { target: { value: '50' } });
    
    const submitButton = screen.getByText('Ouvrir la Session');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockCashSessionStore.openSession).toHaveBeenCalled();
    });
  });

  it('displays loading state', () => {
    mockUseCashSessionStore.mockReturnValue({
      ...mockCashSessionStore,
      loading: true
    });

    renderWithProviders(<OpenCashSession />);
    
    expect(screen.getByText('Ouvrir la Session')).toBeDisabled();
    expect(screen.getByText('Annuler')).toBeDisabled();
  });

  it('displays error message', () => {
    mockUseCashSessionStore.mockReturnValue({
      ...mockCashSessionStore,
      error: 'Erreur de connexion'
    });

    renderWithProviders(<OpenCashSession />);
    
    expect(screen.getByText('Erreur de connexion')).toBeInTheDocument();
  });

  it('clears error when form is submitted', async () => {
    mockUseCashSessionStore.mockReturnValue({
      ...mockCashSessionStore,
      error: 'Erreur précédente'
    });

    renderWithProviders(<OpenCashSession />);
    
    const amountInput = screen.getByLabelText('Fond de caisse initial');
    fireEvent.change(amountInput, { target: { value: '50' } });
    
    const submitButton = screen.getByText('Ouvrir la Session');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockCashSessionStore.clearError).toHaveBeenCalled();
    });
  });

  it('handles cancel button', () => {
    renderWithProviders(<OpenCashSession />);
    
    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/cash-register');
  });

  it('calls onSessionOpened callback when provided', async () => {
    const mockOnSessionOpened = jest.fn();
    const mockSession = {
      id: 'session-123',
      operator_id: 'test-user-id',
      initial_amount: 50.0,
      current_amount: 50.0,
      status: 'open',
      opened_at: '2025-01-27T10:00:00Z',
      total_sales: 0,
      total_items: 0
    };

    mockCashSessionStore.openSession.mockResolvedValue(mockSession);

    renderWithProviders(<OpenCashSession onSessionOpened={mockOnSessionOpened} />);
    
    const amountInput = screen.getByLabelText('Fond de caisse initial');
    fireEvent.change(amountInput, { target: { value: '50' } });
    
    const submitButton = screen.getByText('Ouvrir la Session');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSessionOpened).toHaveBeenCalledWith('session-123');
    });
  });
});
