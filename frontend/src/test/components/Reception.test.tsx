import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Reception from '../../pages/Reception';
import { ReceptionProvider } from '../../contexts/ReceptionContext';
import { useAuthStore } from '../../stores/authStore';
import { receptionService } from '../../services/receptionService';

// Mock de react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock du store d'authentification
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn()
}));

// Mock du service de réception
vi.mock('../../services/receptionService', () => ({
  receptionService: {
    openPoste: vi.fn(),
    closePoste: vi.fn(),
    createTicket: vi.fn(),
    closeTicket: vi.fn(),
    addLineToTicket: vi.fn(),
    updateTicketLine: vi.fn(),
    deleteTicketLine: vi.fn(),
  }
}));

const mockUser = {
  id: '1',
  username: 'test@example.com',
  role: 'user',
  status: 'active'
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ReceptionProvider>
      {children}
    </ReceptionProvider>
  </BrowserRouter>
);

describe('Reception Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    (useAuthStore as unknown as vi.MockedFunction<typeof useAuthStore>).mockReturnValue({
      user: mockUser
    });

    // Par défaut, simuler l'ouverture immédiate d'un poste ouvert
    (receptionService.openPoste as vi.MockedFunction<typeof receptionService.openPoste>).mockResolvedValue({
      id: 'poste-1',
      status: 'open',
      opened_at: '2025-01-01T00:00:00Z'
    });

    // Par défaut, simuler la création d'un ticket
    (receptionService.createTicket as vi.MockedFunction<typeof receptionService.createTicket>).mockResolvedValue({
      id: 'ticket-1',
      poste_id: 'poste-1',
      created_at: '2025-01-01T00:05:00Z',
      status: 'draft',
      lines: []
    });

    (receptionService.closePoste as vi.MockedFunction<typeof receptionService.closePoste>).mockResolvedValue(undefined);
  });

  it('should render reception module with user info', async () => {
    render(
      <TestWrapper>
        <Reception />
      </TestWrapper>
    );

    // Attendre la fin de l'ouverture du poste
    expect(await screen.findByText('Module de Réception')).toBeInTheDocument();
    expect(screen.getByText('Bonjour, Utilisateur')).toBeInTheDocument();
    expect(screen.getByText('Créer un nouveau ticket de dépôt')).toBeInTheDocument();
    expect(screen.getByText('Terminer ma session')).toBeInTheDocument();
  });

  it('should show loading state when opening poste', () => {
    render(
      <TestWrapper>
        <Reception />
      </TestWrapper>
    );

    // Le composant devrait afficher un état de chargement initial
    expect(screen.getByText('Ouverture du poste de réception...')).toBeInTheDocument();
  });

  it('should handle new ticket creation', async () => {
    render(
      <TestWrapper>
        <Reception />
      </TestWrapper>
    );

    // Attendre que la page principale soit affichée
    await screen.findByText('Module de Réception');

    const newTicketButton = screen.getByText('Créer un nouveau ticket de dépôt');
    fireEvent.click(newTicketButton);

    // Vérifier que la navigation est appelée
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/reception/ticket');
    });
  });

  it('should handle close poste', async () => {
    render(
      <TestWrapper>
        <Reception />
      </TestWrapper>
    );

    // Attendre que la page principale soit affichée
    await screen.findByText('Module de Réception');

    const closeButton = screen.getByText('Terminer ma session');
    fireEvent.click(closeButton);

    // Vérifier que la navigation est appelée
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
