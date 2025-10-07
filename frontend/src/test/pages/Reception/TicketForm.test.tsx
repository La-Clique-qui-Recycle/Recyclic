import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import TicketForm from '../../../pages/Reception/TicketForm';
import { ReceptionProvider } from '../../../contexts/ReceptionContext';
import { useCategoryStore } from '../../../stores/categoryStore';
import { receptionService } from '../../../services/receptionService';

// Mock de react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ ticketId: 'test-ticket-123' })
  };
});

// Mock du store de catégories
vi.mock('../../../stores/categoryStore', () => ({
  useCategoryStore: vi.fn()
}));

// Mock du service de réception
vi.mock('../../../services/receptionService', () => ({
  receptionService: {
    getTicket: vi.fn(),
    addLineToTicket: vi.fn(),
    updateTicketLine: vi.fn(),
    deleteTicketLine: vi.fn(),
    closeTicket: vi.fn()
  }
}));

// Mock du contexte de réception
const mockReceptionContext = {
  currentTicket: {
    id: 'test-ticket-123',
    status: 'draft',
    created_at: '2025-01-01T00:00:00Z',
    lines: []
  },
  isLoading: false,
  addLineToTicket: vi.fn(),
  updateTicketLine: vi.fn(),
  deleteTicketLine: vi.fn(),
  closeTicket: vi.fn()
};

vi.mock('../../../contexts/ReceptionContext', () => ({
  ReceptionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useReception: () => mockReceptionContext
}));

const mockCategories = [
  { id: 'cat-1', name: 'Informatique', slug: 'informatique' },
  { id: 'cat-2', name: 'Électroménager', slug: 'electromenager' },
  { id: 'cat-3', name: 'Mobilier', slug: 'mobilier' }
];

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ReceptionProvider>
      {children}
    </ReceptionProvider>
  </BrowserRouter>
);

describe('TicketForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    (useCategoryStore as unknown as vi.MockedFunction<typeof useCategoryStore>).mockReturnValue({
      activeCategories: mockCategories,
      fetchCategories: vi.fn()
    });

    (receptionService.getTicket as vi.MockedFunction<typeof receptionService.getTicket>).mockResolvedValue({
      id: 'test-ticket-123',
      status: 'draft',
      created_at: '2025-01-01T00:00:00Z',
      lines: []
    });
  });

  it('should render ticket form with categories', async () => {
    render(
      <TestWrapper>
        <TicketForm />
      </TestWrapper>
    );

    // Attendre le chargement du ticket
    await waitFor(() => {
      expect(screen.getByText('Informatique')).toBeInTheDocument();
    });

    expect(screen.getByText('Électroménager')).toBeInTheDocument();
    expect(screen.getByText('Mobilier')).toBeInTheDocument();
    expect(screen.getByText('Poids (kg) *')).toBeInTheDocument();
    expect(screen.getByText('Destination')).toBeInTheDocument();
  });

  it('should add line with category_id when form is submitted', async () => {
    render(
      <TestWrapper>
        <TicketForm />
      </TestWrapper>
    );

    // Attendre le chargement du ticket
    await waitFor(() => {
      expect(screen.getByText('Informatique')).toBeInTheDocument();
    });

    // Sélectionner une catégorie
    const categoryButton = screen.getByText('Informatique');
    fireEvent.click(categoryButton);

    // Saisir un poids
    const weightInput = screen.getByDisplayValue('0.00');
    fireEvent.keyDown(weightInput, { key: '1' });
    fireEvent.keyDown(weightInput, { key: '2' });
    fireEvent.keyDown(weightInput, { key: '.' });
    fireEvent.keyDown(weightInput, { key: '5' });

    // Cliquer sur le bouton d'ajout
    const addButton = screen.getByText("Ajouter l'objet");
    fireEvent.click(addButton);

    // Vérifier que addLineToTicket est appelé avec category_id
    await waitFor(() => {
      expect(mockReceptionContext.addLineToTicket).toHaveBeenCalledWith('test-ticket-123', {
        category_id: 'cat-1',
        weight: 12.5,
        destination: 'MAGASIN',
        notes: undefined
      });
    });
  });

  it('should update line with category_id when editing', async () => {
    const mockTicketWithLines = {
      id: 'test-ticket-123',
      status: 'draft',
      created_at: '2025-01-01T00:00:00Z',
      lines: [
        {
          id: 'line-1',
          category_id: 'cat-1',
          category_label: 'Informatique',
          weight: 5.0,
          destination: 'MAGASIN',
          notes: 'Test note'
        }
      ]
    };

    (receptionService.getTicket as vi.MockedFunction<typeof receptionService.getTicket>).mockResolvedValue(mockTicketWithLines);

    render(
      <TestWrapper>
        <TicketForm />
      </TestWrapper>
    );

    // Attendre le chargement du ticket
    await waitFor(() => {
      expect(screen.getByText('Informatique')).toBeInTheDocument();
    });

    // Ouvrir le drawer du ticket
    const ticketTrigger = screen.getByText('Voir le Ticket (1)');
    fireEvent.click(ticketTrigger);

    // Cliquer sur le bouton d'édition
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    // Vérifier que les champs sont pré-remplis avec category_id
    await waitFor(() => {
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });

    // Modifier le poids
    const weightInput = screen.getByDisplayValue('5');
    fireEvent.keyDown(weightInput, { key: 'Backspace' });
    fireEvent.keyDown(weightInput, { key: '1' });
    fireEvent.keyDown(weightInput, { key: '0' });

    // Cliquer sur le bouton de mise à jour
    const updateButton = screen.getByText('Mettre à jour');
    fireEvent.click(updateButton);

    // Vérifier que updateTicketLine est appelé avec category_id
    await waitFor(() => {
      expect(mockReceptionContext.updateTicketLine).toHaveBeenCalledWith('test-ticket-123', 'line-1', {
        category_id: 'cat-1',
        weight: 10,
        destination: 'MAGASIN',
        notes: 'Test note'
      });
    });
  });

  it('should display category name correctly in ticket lines', async () => {
    const mockTicketWithLines = {
      id: 'test-ticket-123',
      status: 'draft',
      created_at: '2025-01-01T00:00:00Z',
      lines: [
        {
          id: 'line-1',
          category_id: 'cat-1',
          category_label: 'Informatique',
          weight: 5.0,
          destination: 'MAGASIN',
          notes: 'Test note'
        },
        {
          id: 'line-2',
          category_id: 'cat-2',
          weight: 3.0,
          destination: 'RECYCLAGE'
        }
      ]
    };

    (receptionService.getTicket as vi.MockedFunction<typeof receptionService.getTicket>).mockResolvedValue(mockTicketWithLines);

    render(
      <TestWrapper>
        <TicketForm />
      </TestWrapper>
    );

    // Attendre le chargement du ticket
    await waitFor(() => {
      expect(screen.getByText('Informatique')).toBeInTheDocument();
    });

    // Ouvrir le drawer du ticket
    const ticketTrigger = screen.getByText('Voir le Ticket (2)');
    fireEvent.click(ticketTrigger);

    // Vérifier que les noms de catégories sont affichés correctement
    await waitFor(() => {
      expect(screen.getByText('Informatique')).toBeInTheDocument();
      expect(screen.getByText('Électroménager')).toBeInTheDocument();
    });

    // Vérifier les détails des lignes
    expect(screen.getByText('5kg - Magasin')).toBeInTheDocument();
    expect(screen.getByText('3kg - Recyclage')).toBeInTheDocument();
  });

  it('should handle category selection correctly', async () => {
    render(
      <TestWrapper>
        <TicketForm />
      </TestWrapper>
    );

    // Attendre le chargement du ticket
    await waitFor(() => {
      expect(screen.getByText('Informatique')).toBeInTheDocument();
    });

    // Sélectionner une catégorie
    const categoryButton = screen.getByText('Électroménager');
    fireEvent.click(categoryButton);

    // Vérifier que la catégorie est sélectionnée visuellement
    expect(categoryButton).toHaveStyle('border-color: #2e7d32');
    expect(categoryButton).toHaveStyle('background: #e8f5e8');
  });

  it('should show validation error when trying to add line without category or weight', async () => {
    // Mock window.alert
    const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <TestWrapper>
        <TicketForm />
      </TestWrapper>
    );

    // Attendre le chargement du ticket
    await waitFor(() => {
      expect(screen.getByText('Informatique')).toBeInTheDocument();
    });

    // Essayer d'ajouter une ligne sans sélectionner de catégorie
    const addButton = screen.getByText("Ajouter l'objet");
    fireEvent.click(addButton);

    // Vérifier que l'alerte est affichée
    expect(mockAlert).toHaveBeenCalledWith('Veuillez sélectionner une catégorie et saisir un poids');

    mockAlert.mockRestore();
  });
});


