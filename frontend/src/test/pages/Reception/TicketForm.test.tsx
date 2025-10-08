import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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
  { id: 'cat-1', name: 'Informatique', slug: 'informatique', parent_id: null },
  { id: 'cat-2', name: 'Électroménager', slug: 'electromenager', parent_id: null },
  { id: 'cat-3', name: 'Mobilier', slug: 'mobilier', parent_id: null }
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

  it('should add line with category_id when form is submitted (ticket mode)', async () => {
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

    // Saisir un poids via le pavé numérique
    const keypad = screen.getByRole('group', { name: /Pavé numérique de saisie du poids/i });
    fireEvent.click(within(keypad).getByRole('button', { name: /Entrer le chiffre 1/i }));
    fireEvent.click(within(keypad).getByRole('button', { name: /Entrer le chiffre 2/i }));
    fireEvent.click(within(keypad).getByRole('button', { name: /Point décimal/i }));
    fireEvent.click(within(keypad).getByRole('button', { name: /Entrer le chiffre 5/i }));

    // Cliquer sur le bouton d'ajout
    const addButton = screen.getByText("Ajouter l'objet");
    fireEvent.click(addButton);

    // Vérifier que receptionService.addLineToTicket est appelé (mode ticketId) avec category_id
    await waitFor(() => {
      expect(receptionService.addLineToTicket).toHaveBeenCalledWith('test-ticket-123', {
        category_id: 'cat-1',
        weight: 12.5,
        destination: 'MAGASIN',
        notes: undefined
      });
    });
  });

  it('should update line with category_id when editing (ticket mode)', async () => {
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
      expect(screen.getAllByText('Informatique').length).toBeGreaterThan(0);
    });

    // Ouvrir le drawer du ticket
    const ticketTrigger = screen.getByText('Voir le Ticket (1)');
    fireEvent.click(ticketTrigger);

    // Cliquer sur le bouton d'édition
    const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
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

    // Vérifier que receptionService.updateTicketLine est appelé (mode ticketId) avec category_id
    await waitFor(() => {
      expect(receptionService.updateTicketLine).toHaveBeenCalledWith('test-ticket-123', 'line-1', {
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
      expect(screen.getAllByText('Informatique').length).toBeGreaterThan(0);
    });

    // Ouvrir le drawer du ticket
    const ticketTrigger = screen.getByText('Voir le Ticket (2)');
    fireEvent.click(ticketTrigger);

    // Vérifier que les noms de catégories sont affichés correctement
    await waitFor(() => {
      expect(screen.getAllByText('Informatique').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Électroménager').length).toBeGreaterThan(0);
    });

    // Vérifier les détails des lignes (texte fragmenté sur plusieurs nœuds)
    const hasText = (t: string) => (_: any, node: Element | null) => !!node && node.textContent?.includes(t);
    expect(screen.getAllByText(hasText('5kg - Magasin')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(hasText('3kg - Recyclage')).length).toBeGreaterThan(0);
  });

  it('should handle category selection correctly', async () => {
    // Reset mocks to use flat categories for this test
    vi.clearAllMocks();
    
    (useCategoryStore as any).mockReturnValue({
      activeCategories: mockCategories,
      loading: false,
      error: null,
      fetchCategories: vi.fn(),
      getCategoryById: (id: string) => mockCategories.find(cat => cat.id === id)
    });

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
    const categoryButton = screen.getByRole('button', { name: /Sélectionner Électroménager/i });
    fireEvent.click(categoryButton);

    // Vérifier l'état d'accessibilité sélectionné
    expect(categoryButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('should keep add button disabled when category or weight is missing', async () => {
    // Reset mocks to use flat categories for this test
    vi.clearAllMocks();
    
    (useCategoryStore as any).mockReturnValue({
      activeCategories: mockCategories,
      loading: false,
      error: null,
      fetchCategories: vi.fn(),
      getCategoryById: (id: string) => mockCategories.find(cat => cat.id === id)
    });

    // Pas d'alerte attendue, le bouton reste désactivé

    render(
      <TestWrapper>
        <TicketForm />
      </TestWrapper>
    );

    // Attendre le chargement du ticket
    await waitFor(() => {
      expect(screen.getByText('Informatique')).toBeInTheDocument();
    });

    // Le bouton d'ajout doit être désactivé tant que la catégorie ou le poids manquent
    const addButton = screen.getByText("Ajouter l'objet").closest('button')!;
    expect(addButton).toBeDisabled();
  });

  describe('Hierarchical Category Navigation', () => {
    const mockHierarchicalCategories = [
      {
        id: 'cat-1',
        name: 'Informatique',
        is_active: true,
        parent_id: null,
        price: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'cat-1-1',
        name: 'Ordinateurs',
        is_active: true,
        parent_id: 'cat-1',
        price: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'cat-1-1-1',
        name: 'Laptops',
        is_active: true,
        parent_id: 'cat-1-1',
        price: 15.00,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'cat-1-1-2',
        name: 'Desktops',
        is_active: true,
        parent_id: 'cat-1-1',
        price: 20.00,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    beforeEach(() => {
      // Reset mocks before each test
      vi.clearAllMocks();
      
      (useCategoryStore as any).mockReturnValue({
        activeCategories: mockHierarchicalCategories,
        loading: false,
        error: null,
        fetchCategories: vi.fn(),
        getCategoryById: (id: string) => mockHierarchicalCategories.find(cat => cat.id === id)
      });
    });

    it('should display root categories initially', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Informatique')).toBeInTheDocument();
      });

      // Should not show subcategories initially
      expect(screen.queryByText('Ordinateurs')).not.toBeInTheDocument();
    });

    it('should navigate to subcategories when clicking parent category', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Informatique')).toBeInTheDocument();
      });

      // Click on parent category
      const informatiqueButton = screen.getByText('Informatique');
      fireEvent.click(informatiqueButton);

      // Should show subcategories
      await waitFor(() => {
        expect(screen.getByText('Ordinateurs')).toBeInTheDocument();
      });

      // Should show back button
      expect(screen.getByText('← Retour')).toBeInTheDocument();
    });

    it('should navigate back to parent level when clicking back button', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Informatique')).toBeInTheDocument();
      });

      // Navigate to subcategories
      const informatiqueButton = screen.getByText('Informatique');
      fireEvent.click(informatiqueButton);

      await waitFor(() => {
        expect(screen.getByText('Ordinateurs')).toBeInTheDocument();
      });

      // Click back button
      const backButton = screen.getByText('← Retour');
      fireEvent.click(backButton);

      // Should return to root categories
      await waitFor(() => {
        expect(screen.getByText('Informatique')).toBeInTheDocument();
      });

      // Back button should be hidden
      expect(screen.queryByText('← Retour')).not.toBeInTheDocument();
    });

    it('should select final category when clicking leaf category and reset to root', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Informatique')).toBeInTheDocument();
      });

      // Navigate to subcategories
      const informatiqueButton = screen.getByText('Informatique');
      fireEvent.click(informatiqueButton);

      await waitFor(() => {
        expect(screen.getByText('Ordinateurs')).toBeInTheDocument();
      });

      // Navigate to leaf categories
      const ordinateursButton = screen.getByText('Ordinateurs');
      fireEvent.click(ordinateursButton);

      await waitFor(() => {
        expect(screen.getByText('Laptops')).toBeInTheDocument();
        expect(screen.getByText('Desktops')).toBeInTheDocument();
      });

      // Click on final category
      const laptopsButton = screen.getByText('Laptops');
      fireEvent.click(laptopsButton);

      // After selecting a leaf, UI resets to root and focuses entry; back button hidden
      await waitFor(() => {
        expect(screen.getByText('Informatique')).toBeInTheDocument();
      });
      expect(screen.queryByText('← Retour')).not.toBeInTheDocument();
    });

    it('should display breadcrumb navigation path', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Informatique')).toBeInTheDocument();
      });

      // Navigate to subcategories
      const informatiqueButton = screen.getByText('Informatique');
      fireEvent.click(informatiqueButton);

      await waitFor(() => {
        expect(screen.getByText('Ordinateurs')).toBeInTheDocument();
      });

      // Should show breadcrumb item
      expect(screen.getByText('Informatique')).toBeInTheDocument();
    });
  });
});


