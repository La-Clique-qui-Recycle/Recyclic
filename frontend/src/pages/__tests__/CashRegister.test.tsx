import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CashRegister from '../CashRegister';
import { useCashSessionStore } from '../../stores/cashSessionStore';

// Mock du store de session de caisse
vi.mock('../../stores/cashSessionStore', () => ({
  useCashSessionStore: vi.fn(),
}));

// Mock de react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CashRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner when checking session status', () => {
    const mockStore = {
      currentSession: null,
      loading: true,
      fetchCurrentSession: vi.fn(),
    };
    
    vi.mocked(useCashSessionStore).mockReturnValue(mockStore);

    render(
      <MemoryRouter>
        <CashRegister />
      </MemoryRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Vérification de la session...')).toBeInTheDocument();
  });

  it('should redirect to open session when no active session', async () => {
    const mockStore = {
      currentSession: null,
      loading: false,
      fetchCurrentSession: vi.fn(),
    };
    
    vi.mocked(useCashSessionStore).mockReturnValue(mockStore);

    render(
      <MemoryRouter>
        <CashRegister />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/cash-register/session/open');
    });
  });

  it('should redirect to sale when active session is open', async () => {
    const mockStore = {
      currentSession: {
        id: 'session-123',
        status: 'open',
        operator_id: 'user-123',
        initial_amount: 50,
      },
      loading: false,
      fetchCurrentSession: vi.fn(),
    };
    
    vi.mocked(useCashSessionStore).mockReturnValue(mockStore);

    render(
      <MemoryRouter>
        <CashRegister />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/cash-register/sale');
    });
  });

  it('should redirect to open session when session is closed', async () => {
    const mockStore = {
      currentSession: {
        id: 'session-123',
        status: 'closed',
        operator_id: 'user-123',
        initial_amount: 50,
      },
      loading: false,
      fetchCurrentSession: vi.fn(),
    };
    
    vi.mocked(useCashSessionStore).mockReturnValue(mockStore);

    render(
      <MemoryRouter>
        <CashRegister />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/cash-register/session/open');
    });
  });

  it('should call fetchCurrentSession on mount', () => {
    const mockFetchCurrentSession = vi.fn();
    const mockStore = {
      currentSession: null,
      loading: false,
      fetchCurrentSession: mockFetchCurrentSession,
    };
    
    vi.mocked(useCashSessionStore).mockReturnValue(mockStore);

    render(
      <MemoryRouter>
        <CashRegister />
      </MemoryRouter>
    );

    expect(mockFetchCurrentSession).toHaveBeenCalled();
  });
});

