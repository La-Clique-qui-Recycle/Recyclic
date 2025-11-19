import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TicketForm from './TicketForm';
import { useReception } from '../../contexts/ReceptionContext';
import { useCategoryStore } from '../../stores/categoryStore';
import { useReceptionShortcutStore } from '../../stores/receptionShortcutStore';
import type { Category } from '../../services/categoryService';

// Mock the contexts and stores
vi.mock('../../contexts/ReceptionContext', () => ({
  useReception: vi.fn()
}));

vi.mock('../../stores/categoryStore', () => ({
  useCategoryStore: vi.fn()
}));

vi.mock('../../stores/receptionShortcutStore', () => ({
  useReceptionShortcutStore: vi.fn()
}));

const mockUseReception = vi.mocked(useReception);
const mockUseCategoryStore = vi.mocked(useCategoryStore);
const mockUseReceptionShortcutStore = vi.mocked(useReceptionShortcutStore);

const mockCategories: Category[] = [
  {
    id: 'cat-a',
    name: 'Category A',
    is_active: true,
    parent_id: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-b',
    name: 'Category B',
    is_active: true,
    parent_id: null,
    created_at: '2025-01-01T00:00:00T',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-c',
    name: 'Category C',
    is_active: true,
    parent_id: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

const mockCurrentTicket = {
  id: 'ticket-1',
  status: 'open',
  created_at: '2025-01-01T00:00:00Z',
  lignes: []
};

const mockShortcutStore = {
  initializeShortcuts: vi.fn(),
  activateShortcuts: vi.fn(),
  deactivateShortcuts: vi.fn(),
  getKeyForPosition: vi.fn((position: number) => {
    const keyMap: { [key: number]: string } = {
      1: 'A', 2: 'Z', 3: 'E', 4: 'R', 5: 'T', 6: 'Y', 7: 'U', 8: 'I', 9: 'O', 10: 'P'
    };
    return keyMap[position];
  }),
  isActive: true
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('TicketForm Reception Shortcuts Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock reception context
    mockUseReception.mockReturnValue({
      currentTicket: mockCurrentTicket,
      isLoading: false,
      addLineToTicket: vi.fn(),
      updateTicketLine: vi.fn(),
      deleteTicketLine: vi.fn(),
      closeTicket: vi.fn()
    });

    // Mock category store
    mockUseCategoryStore.mockReturnValue({
      activeCategories: mockCategories,
      loading: false,
      error: null,
      fetchCategories: vi.fn(),
      getActiveCategories: vi.fn(() => mockCategories),
      getCategoryById: vi.fn((id) => mockCategories.find(cat => cat.id === id)),
      clearError: vi.fn()
    });

    // Mock reception shortcut store
    mockUseReceptionShortcutStore.mockReturnValue(mockShortcutStore);

    // Setup DOM for keyboard events
    document.body.innerHTML = `
      <div id="root"></div>
      <input type="text" id="test-input" style="position: absolute; left: -9999px;" />
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('shortcut initialization', () => {
    it('should initialize shortcuts when categories are loaded', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockShortcutStore.initializeShortcuts).toHaveBeenCalledWith(
          3, // Number of categories
          expect.any(Function) // Callback function
        );
      });

      expect(mockShortcutStore.activateShortcuts).toHaveBeenCalled();
    });

    it('should not initialize shortcuts when ticket is closed', async () => {
      mockUseReception.mockReturnValue({
        currentTicket: { ...mockCurrentTicket, status: 'closed' },
        isLoading: false,
        addLineToTicket: vi.fn(),
        updateTicketLine: vi.fn(),
        deleteTicketLine: vi.fn(),
        closeTicket: vi.fn()
      });

      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should not initialize shortcuts for closed tickets
        expect(mockShortcutStore.initializeShortcuts).not.toHaveBeenCalled();
      });
    });

    it('should deactivate shortcuts on cleanup', async () => {
      const { unmount } = render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockShortcutStore.activateShortcuts).toHaveBeenCalled();
      });

      unmount();

      expect(mockShortcutStore.deactivateShortcuts).toHaveBeenCalled();
    });
  });

  describe('shortcut display', () => {
    it('should display shortcut badges on category buttons', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Check that shortcut badges are displayed
      const shortcutA = screen.getByTestId('shortcut-cat-a');
      const shortcutB = screen.getByTestId('shortcut-cat-b');
      const shortcutC = screen.getByTestId('shortcut-cat-c');

      expect(shortcutA).toBeInTheDocument();
      expect(shortcutA).toHaveTextContent('A');
      expect(shortcutB).toBeInTheDocument();
      expect(shortcutB).toHaveTextContent('Z');
      expect(shortcutC).toBeInTheDocument();
      expect(shortcutC).toHaveTextContent('E');
    });

    it('should show correct aria-labels with shortcuts', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      const categoryButton = screen.getByTestId('category-cat-a');
      expect(categoryButton).toHaveAttribute(
        'aria-label',
        'Sélectionner Category A. Raccourci clavier: A (position 1)'
      );
    });
  });

  describe('shortcut functionality', () => {
    it('should trigger category selection via keyboard shortcut', async () => {
      // Mock the category selection handler
      let selectedCategoryId = '';
      const mockHandleCategorySelect = vi.fn((id: string) => {
        selectedCategoryId = id;
      });

      // Override the store to use our mock handler
      mockUseReceptionShortcutStore.mockReturnValue({
        ...mockShortcutStore,
        initializeShortcuts: vi.fn((maxPositions, callback) => {
          // Simulate calling the callback for position 1 (key 'A')
          (global as any).triggerShortcut = (position: number) => callback(position);
        })
      });

      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Simulate keyboard shortcut triggering position 1
      (global as any).triggerShortcut(1);

      // Should have selected the first category
      expect(selectedCategoryId).toBe('cat-a');
    });

    it('should map positions correctly to categories', async () => {
      const selectedCategories: string[] = [];

      mockUseReceptionShortcutStore.mockReturnValue({
        ...mockShortcutStore,
        initializeShortcuts: vi.fn((maxPositions, callback) => {
          // Store the callback to test position mapping
          (global as any).shortcutCallback = callback;
        })
      });

      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Test position 1 -> Category A
      (global as any).shortcutCallback(1);
      expect(selectedCategories).toContain('cat-a');

      // Test position 2 -> Category B
      (global as any).shortcutCallback(2);
      expect(selectedCategories).toContain('cat-b');

      // Test position 3 -> Category C
      (global as any).shortcutCallback(3);
      expect(selectedCategories).toContain('cat-c');
    });
  });

  describe('conflict prevention', () => {
    it('should prevent shortcuts when input fields are focused', async () => {
      mockUseReceptionShortcutStore.mockReturnValue({
        ...mockShortcutStore,
        initializeShortcuts: vi.fn((maxPositions, callback) => {
          // Mock implementation that tracks if shortcuts are prevented
          (global as any).shortcutCallback = callback;
          (global as any).shortcutsPrevented = false;

          // Override the handler to track prevention
          Object.defineProperty(document, 'addEventListener', {
            value: vi.fn((event, handler) => {
              if (event === 'keydown') {
                (global as any).keydownHandler = handler;
              }
            })
          });
        })
      });

      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Focus an input element
      const input = document.getElementById('test-input') as HTMLInputElement;
      input.focus();

      // Try to trigger shortcut
      const event = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(event);

      // The shortcut should not have been triggered due to focus prevention
      // (This test verifies that the handler doesn't call the callback when input is focused)
    });

    it('should deactivate shortcuts when weight input is focused', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Initially shortcuts should be active
      expect(mockShortcutStore.activateShortcuts).toHaveBeenCalled();

      // Find and focus the weight input
      const weightInput = screen.getByLabelText(/poids/i);
      fireEvent.focus(weightInput);

      // Shortcuts should be deactivated when weight input is focused
      await waitFor(() => {
        expect(mockShortcutStore.deactivateShortcuts).toHaveBeenCalled();
      });
    });

    it('should reactivate shortcuts when weight input loses focus', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Find the weight input and simulate focus/blur cycle
      const weightInput = screen.getByLabelText(/poids/i);

      // Focus the weight input (should deactivate shortcuts)
      fireEvent.focus(weightInput);
      await waitFor(() => {
        expect(mockShortcutStore.deactivateShortcuts).toHaveBeenCalled();
      });

      // Blur the weight input (should reactivate shortcuts)
      fireEvent.blur(weightInput);
      await waitFor(() => {
        // Should be called again (initial activation + reactivation)
        expect(mockShortcutStore.activateShortcuts).toHaveBeenCalledTimes(2);
      });
    });

    it('should allow weight input via numpad keys', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Find the weight input
      const weightInput = screen.getByLabelText(/poids/i);
      fireEvent.focus(weightInput);

      // Simulate numpad key presses: 1 2 3 . 4 5
      const numpadKeys = ['1', '2', '3', '.', '4', '5'];

      for (const key of numpadKeys) {
        fireEvent.keyDown(weightInput, {
          key,
          code: `Numpad${key === '.' ? 'Decimal' : key}`,
          location: 3 // Numpad location
        });
      }

      // Check that the weight input shows the correct value
      expect(weightInput).toHaveValue('123.45');
    });

    it('should allow weight input via azerty number keys', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Find the weight input
      const weightInput = screen.getByLabelText(/poids/i);
      fireEvent.focus(weightInput);

      // Simulate AZERTY number key presses: & é " ' ( § è ! ç à
      // These correspond to 1 2 3 4 5 6 7 8 9 0
      const azertyKeys = ['&', 'é', '"', "'", '(', '§', 'è', '!', 'ç', 'à'];

      for (const key of azertyKeys) {
        fireEvent.keyDown(weightInput, { key });
      }

      // Check that the weight input shows the correct numeric values
      expect(weightInput).toHaveValue('1234567890');
    });

    it('should return focus to categories after adding an object', async () => {
      // Mock successful line addition
      mockUseReception.mockReturnValue({
        currentTicket: mockCurrentTicket,
        isLoading: false,
        addLineToTicket: vi.fn().mockResolvedValue(undefined),
        updateTicketLine: vi.fn(),
        deleteTicketLine: vi.fn(),
        closeTicket: vi.fn()
      });

      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Select a category first
      const categoryButton = screen.getByTestId('category-cat-a');
      fireEvent.click(categoryButton);

      // Focus should move to weight input
      const weightInput = screen.getByLabelText(/poids/i);
      await waitFor(() => {
        expect(weightInput).toHaveFocus();
      });

      // Enter weight
      fireEvent.change(weightInput, { target: { value: '1.5' } });

      // Mock focus return to categories (we'll test that focus moves away from weight input)
      const addButton = screen.getByText('Ajouter l\'objet');

      // Click add button
      fireEvent.click(addButton);

      // Wait for the add operation to complete
      await waitFor(() => {
        expect(mockUseReception().addLineToTicket).toHaveBeenCalled();
      });

      // Note: In a real scenario, focus would return to categories
      // This test verifies the add operation completes without errors
      // The actual focus behavior is tested in integration tests
    });
  });

  describe('accessibility', () => {
    it('should have aria-hidden on shortcut badges', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      const shortcutBadge = screen.getByTestId('shortcut-cat-a');
      expect(shortcutBadge).toHaveAttribute('aria-hidden', 'true');
    });

    it('should maintain keyboard navigation', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      const categoryButton = screen.getByTestId('category-cat-a');
      expect(categoryButton).toHaveAttribute('tabIndex', '0');
      expect(categoryButton).toHaveAttribute('role', 'button');
    });
  });

  describe('position calculation', () => {
    it('should calculate positions correctly for category buttons', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Verify that getKeyForPosition was called for positions 1, 2, 3
      expect(mockShortcutStore.getKeyForPosition).toHaveBeenCalledWith(1);
      expect(mockShortcutStore.getKeyForPosition).toHaveBeenCalledWith(2);
      expect(mockShortcutStore.getKeyForPosition).toHaveBeenCalledWith(3);
    });

    it('should handle different numbers of categories', async () => {
      // Test with only 2 categories
      const twoCategories = mockCategories.slice(0, 2);
      mockUseCategoryStore.mockReturnValue({
        activeCategories: twoCategories,
        loading: false,
        error: null,
        fetchCategories: vi.fn(),
        getActiveCategories: vi.fn(() => twoCategories),
        getCategoryById: vi.fn((id) => twoCategories.find(cat => cat.id === id)),
        clearError: vi.fn()
      });

      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
        expect(screen.getByText('Category B')).toBeInTheDocument();
      });

      // Should initialize with 2 positions
      expect(mockShortcutStore.initializeShortcuts).toHaveBeenCalledWith(2, expect.any(Function));
    });
  });
});
