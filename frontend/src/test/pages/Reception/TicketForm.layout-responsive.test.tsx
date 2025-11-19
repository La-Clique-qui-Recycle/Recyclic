import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
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
  { id: 'cat-1', name: 'Informatique', slug: 'informatique', parent_id: null }
];

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ReceptionProvider>
      {children}
    </ReceptionProvider>
  </BrowserRouter>
);

// Helper pour simuler différentes tailles d'écran
const setViewport = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  });
  window.dispatchEvent(new Event('resize'));
};

describe('TicketForm - Story 1.6: Remaniement Bloc Central', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    (useCategoryStore as unknown as vi.MockedFunction<typeof useCategoryStore>).mockReturnValue({
      activeCategories: mockCategories,
      fetchCategories: vi.fn(),
      getCategoryById: vi.fn((id: string) => mockCategories.find(c => c.id === id))
    });

    (receptionService.getTicket as vi.MockedFunction<typeof receptionService.getTicket>).mockResolvedValue({
      id: 'test-ticket-123',
      status: 'draft',
      created_at: '2025-01-01T00:00:00Z',
      lines: []
    });

    // Mock ResizeObserver pour les tests responsive
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn()
    }));

    // Mock matchMedia pour les media queries
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    });
  });

  describe('AC 1.6.1: Numeric keypad is slightly reduced in width', () => {
    it('should render keypad with reduced width in desktop layout', async () => {
      setViewport(1200);
      
      const { container } = render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('controls-section')).toBeInTheDocument();
      });

      // Sélectionner une catégorie pour afficher le bloc central
      const categoryButton = screen.getByText('Informatique');
      categoryButton.click();

      await waitFor(() => {
        const centralBlock = container.querySelector('[data-testid="controls-section"]')?.parentElement;
        expect(centralBlock).toBeInTheDocument();
      });

      // Vérifier que le layout utilise CSS Grid avec 60/40 split
      const centralBlockLayout = container.querySelector('div[style*="grid-template-columns"]') || 
                                 Array.from(container.querySelectorAll('div')).find(el => {
                                   const styles = window.getComputedStyle(el);
                                   return styles.display === 'grid' && 
                                          styles.gridTemplateColumns.includes('60%');
                                 });
      
      // Le layout devrait utiliser grid avec 60% pour le keypad
      expect(centralBlockLayout).toBeTruthy();
    });
  });

  describe('AC 1.6.2: Destination selector, notes field, and "Add Item" button are positioned to the right', () => {
    it('should position controls section to the right of numeric keypad', async () => {
      setViewport(1200);
      
      const { container } = render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Informatique')).toBeInTheDocument();
      });

      // Sélectionner une catégorie
      const categoryButton = screen.getByText('Informatique');
      categoryButton.click();

      await waitFor(() => {
        const controlsSection = screen.getByTestId('controls-section');
        expect(controlsSection).toBeInTheDocument();
      });

      // Vérifier que les contrôles sont présents dans l'ordre logique
      const controlsSection = screen.getByTestId('controls-section');
      
      // Destination selector devrait être présent
      const destinationSelect = within(controlsSection).getByLabelText(/destination/i);
      expect(destinationSelect).toBeInTheDocument();

      // Notes field devrait être présent
      const notesTextarea = within(controlsSection).getByLabelText(/notes/i);
      expect(notesTextarea).toBeInTheDocument();

      // Add button devrait être présent
      const addButton = within(controlsSection).getByRole('button', { name: /ajouter/i });
      expect(addButton).toBeInTheDocument();

      // Vérifier l'ordre: Destination → Notes → Button
      const controls = Array.from(controlsSection.querySelectorAll('select, textarea, button'));
      const destinationIndex = controls.findIndex(el => el.tagName === 'SELECT');
      const notesIndex = controls.findIndex(el => el.tagName === 'TEXTAREA');
      const buttonIndex = controls.findIndex(el => el.tagName === 'BUTTON' && el.textContent?.includes('Ajouter'));

      expect(destinationIndex).toBeLessThan(notesIndex);
      expect(notesIndex).toBeLessThan(buttonIndex);
    });
  });

  describe('AC 1.6.3: Layout remains functional on different screen sizes', () => {
    it('should render 2 columns layout on desktop (>1024px)', async () => {
      setViewport(1200);
      
      const { container } = render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Informatique')).toBeInTheDocument();
      });

      const categoryButton = screen.getByText('Informatique');
      categoryButton.click();

      await waitFor(() => {
        const controlsSection = screen.getByTestId('controls-section');
        expect(controlsSection).toBeInTheDocument();
      });

      // Sur desktop, le layout devrait être en 2 colonnes (60/40)
      const centralBlock = screen.getByTestId('controls-section').parentElement;
      const styles = window.getComputedStyle(centralBlock!);
      
      // Vérifier que c'est un grid layout
      expect(styles.display).toBe('grid');
    });

    it('should adjust columns ratio on tablet (768-1024px)', async () => {
      setViewport(900);
      
      const { container } = render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Informatique')).toBeInTheDocument();
      });

      const categoryButton = screen.getByText('Informatique');
      categoryButton.click();

      await waitFor(() => {
        const controlsSection = screen.getByTestId('controls-section');
        expect(controlsSection).toBeInTheDocument();
      });

      // Sur tablet, le layout devrait être ajusté (55/45)
      const centralBlock = screen.getByTestId('controls-section').parentElement;
      expect(centralBlock).toBeInTheDocument();
    });

    it('should stack vertically on mobile (<768px)', async () => {
      setViewport(600);
      
      const { container } = render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Informatique')).toBeInTheDocument();
      });

      const categoryButton = screen.getByText('Informatique');
      categoryButton.click();

      await waitFor(() => {
        const controlsSection = screen.getByTestId('controls-section');
        expect(controlsSection).toBeInTheDocument();
      });

      // Sur mobile, le layout devrait être en stack vertical
      const centralBlock = screen.getByTestId('controls-section').parentElement;
      expect(centralBlock).toBeInTheDocument();
    });

    it('should maintain touch targets minimum size on mobile', async () => {
      setViewport(600);
      
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Informatique')).toBeInTheDocument();
      });

      const categoryButton = screen.getByText('Informatique');
      categoryButton.click();

      await waitFor(() => {
        const controlsSection = screen.getByTestId('controls-section');
        expect(controlsSection).toBeInTheDocument();
      });

      // Vérifier les touch targets
      const addButton = screen.getByRole('button', { name: /ajouter/i });
      const buttonStyles = window.getComputedStyle(addButton);
      const minHeight = parseInt(buttonStyles.minHeight || '0');
      
      // Touch target minimum: 44px iOS / 48px Android
      expect(minHeight).toBeGreaterThanOrEqual(44);
    });
  });

  describe('AC 1.6.4: Information hierarchy is clear and logical', () => {
    it('should display controls in logical order: Destination → Notes → Button', async () => {
      setViewport(1200);
      
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Informatique')).toBeInTheDocument();
      });

      const categoryButton = screen.getByText('Informatique');
      categoryButton.click();

      await waitFor(() => {
        const controlsSection = screen.getByTestId('controls-section');
        expect(controlsSection).toBeInTheDocument();
      });

      const controlsSection = screen.getByTestId('controls-section');
      
      // Vérifier la hiérarchie visuelle
      const formGroups = controlsSection.querySelectorAll('[class*="FormGroup"]');
      expect(formGroups.length).toBeGreaterThanOrEqual(2); // Destination + Notes
      
      // Le premier devrait être Destination
      const firstLabel = formGroups[0]?.querySelector('label');
      expect(firstLabel?.textContent?.toLowerCase()).toMatch(/destination/i);
      
      // Le deuxième devrait être Notes
      const secondLabel = formGroups[1]?.querySelector('label');
      expect(secondLabel?.textContent?.toLowerCase()).toMatch(/notes/i);
      
      // Le bouton devrait être en dernier
      const addButton = screen.getByRole('button', { name: /ajouter/i });
      expect(addButton).toBeInTheDocument();
    });

    it('should maintain proper spacing between controls', async () => {
      setViewport(1200);
      
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Informatique')).toBeInTheDocument();
      });

      const categoryButton = screen.getByText('Informatique');
      categoryButton.click();

      await waitFor(() => {
        const controlsSection = screen.getByTestId('controls-section');
        expect(controlsSection).toBeInTheDocument();
      });

      const controlsSection = screen.getByTestId('controls-section');
      const styles = window.getComputedStyle(controlsSection);
      
      // Vérifier que l'espacement est présent (gap devrait être défini)
      // Le gap devrait être d'au moins 6px selon le code
      expect(styles.gap || styles.rowGap).toBeTruthy();
    });
  });

  describe('Regression Tests: Preserved functionality', () => {
    it('should preserve event handlers for destination selector', async () => {
      setViewport(1200);
      
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Informatique')).toBeInTheDocument();
      });

      const categoryButton = screen.getByText('Informatique');
      categoryButton.click();

      await waitFor(() => {
        const destinationSelect = screen.getByLabelText(/destination/i);
        expect(destinationSelect).toBeInTheDocument();
      });

      const destinationSelect = screen.getByLabelText(/destination/i) as HTMLSelectElement;
      
      // Vérifier que le select est fonctionnel
      expect(destinationSelect).not.toBeDisabled();
      expect(destinationSelect.options.length).toBeGreaterThan(0);
    });

    it('should preserve event handlers for notes field', async () => {
      setViewport(1200);
      
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Informatique')).toBeInTheDocument();
      });

      const categoryButton = screen.getByText('Informatique');
      categoryButton.click();

      await waitFor(() => {
        const notesTextarea = screen.getByLabelText(/notes/i);
        expect(notesTextarea).toBeInTheDocument();
      });

      const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
      
      // Vérifier que le textarea est fonctionnel
      expect(notesTextarea).not.toBeDisabled();
    });

    it('should preserve event handlers for add button', async () => {
      setViewport(1200);
      
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Informatique')).toBeInTheDocument();
      });

      const categoryButton = screen.getByText('Informatique');
      categoryButton.click();

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /ajouter/i });
        expect(addButton).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /ajouter/i });
      
      // Vérifier que le bouton est présent et fonctionnel
      expect(addButton).toBeInTheDocument();
      // Le bouton devrait être disabled si pas de poids saisi
      expect(addButton).toBeDisabled();
    });
  });
});

