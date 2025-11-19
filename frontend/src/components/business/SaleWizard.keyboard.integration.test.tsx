import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SaleWizard } from './SaleWizard';
import { useCategoryStore } from '../../stores/categoryStore';
import { usePresetStore } from '../../stores/presetStore';
import type { Category } from '../../services/categoryService';

// Mock the stores
vi.mock('../../stores/categoryStore', () => ({
  useCategoryStore: vi.fn()
}));

vi.mock('../../stores/presetStore', () => ({
  usePresetStore: vi.fn()
}));

const mockUseCategoryStore = vi.mocked(useCategoryStore);
const mockUsePresetStore = vi.mocked(usePresetStore);

const mockCategories: Category[] = [
  {
    id: 'cat-a',
    name: 'Category A',
    shortcut_key: 'a',
    is_active: true,
    parent_id: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-b',
    name: 'Category B',
    shortcut_key: 'b',
    is_active: true,
    parent_id: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'sub-a-1',
    name: 'Subcategory A1',
    shortcut_key: 'x',
    is_active: true,
    parent_id: 'cat-a',
    price: 5.00,
    max_price: 10.00,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'sub-a-2',
    name: 'Subcategory A2',
    shortcut_key: 'y',
    is_active: true,
    parent_id: 'cat-a',
    price: 7.50,
    max_price: 15.00,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

// Mock numpad callbacks
const mockNumpadCallbacks = {
  quantityValue: '',
  quantityError: '',
  priceValue: '',
  priceError: '',
  weightValue: '',
  weightError: '',
  setQuantityValue: vi.fn(),
  setQuantityError: vi.fn(),
  setPriceValue: vi.fn(),
  setPriceError: vi.fn(),
  setWeightValue: vi.fn(),
  setWeightError: vi.fn(),
  setMode: vi.fn()
};

describe('SaleWizard Keyboard Shortcuts Integration', () => {
  const mockOnItemComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock stores
    mockUseCategoryStore.mockReturnValue({
      activeCategories: mockCategories,
      loading: false,
      error: null,
      fetchCategories: vi.fn(),
      getActiveCategories: vi.fn(() => mockCategories),
      getCategoryById: vi.fn((id) => mockCategories.find(cat => cat.id === id)),
      clearError: vi.fn()
    });

    mockUsePresetStore.mockReturnValue({
      selectedPreset: null,
      notes: '',
      clearSelection: vi.fn()
    });

    // Setup DOM for keyboard events
    document.body.innerHTML = `
      <div id="root"></div>
      <input type="text" id="test-input" style="position: absolute; left: -9999px;" />
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('category selection shortcuts', () => {
    it('should trigger category selection via keyboard shortcut', async () => {
      render(
        <SaleWizard
          onItemComplete={mockOnItemComplete}
          numpadCallbacks={mockNumpadCallbacks}
          currentMode="idle"
        />
      );

      // Wait for component to initialize
      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Trigger keyboard shortcut
      const keyEvent = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(keyEvent);

      // Verify category selection (should move to weight step for category without children)
      await waitFor(() => {
        expect(mockNumpadCallbacks.setMode).toHaveBeenCalledWith('weight');
      });
    });

    it('should handle uppercase shortcut keys', async () => {
      render(
        <SaleWizard
          onItemComplete={mockOnItemComplete}
          numpadCallbacks={mockNumpadCallbacks}
          currentMode="idle"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Trigger uppercase shortcut
      const keyEvent = new KeyboardEvent('keydown', { key: 'A' });
      document.dispatchEvent(keyEvent);

      await waitFor(() => {
        expect(mockNumpadCallbacks.setMode).toHaveBeenCalledWith('weight');
      });
    });

    it('should move to subcategory step when category has children', async () => {
      render(
        <SaleWizard
          onItemComplete={mockOnItemComplete}
          numpadCallbacks={mockNumpadCallbacks}
          currentMode="idle"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Category A has children, should go to subcategory step
      const keyEvent = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(keyEvent);

      await waitFor(() => {
        expect(screen.getByText('Sélectionner la sous-catégorie')).toBeInTheDocument();
      });
    });
  });

  describe('subcategory selection shortcuts', () => {
    it('should trigger subcategory selection via keyboard shortcut', async () => {
      render(
        <SaleWizard
          onItemComplete={mockOnItemComplete}
          numpadCallbacks={mockNumpadCallbacks}
          currentMode="idle"
        />
      );

      // First select category A
      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      const categoryEvent = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(categoryEvent);

      // Wait for subcategory step
      await waitFor(() => {
        expect(screen.getByText('Sélectionner la sous-catégorie')).toBeInTheDocument();
      });

      // Now trigger subcategory shortcut
      const subEvent = new KeyboardEvent('keydown', { key: 'x' });
      document.dispatchEvent(subEvent);

      // Should move to weight step
      await waitFor(() => {
        expect(mockNumpadCallbacks.setMode).toHaveBeenCalledWith('weight');
      });
    });

    it('should display shortcut badges for subcategories', async () => {
      render(
        <SaleWizard
          onItemComplete={mockOnItemComplete}
          numpadCallbacks={mockNumpadCallbacks}
          currentMode="idle"
        />
      );

      // Navigate to subcategory step
      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      const categoryEvent = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(categoryEvent);

      await waitFor(() => {
        expect(screen.getByText('Sélectionner la sous-catégorie')).toBeInTheDocument();
      });

      // Check shortcut badges are displayed
      expect(screen.getByTestId('subcategory-shortcut-sub-a-1')).toBeInTheDocument();
      expect(screen.getByTestId('subcategory-shortcut-sub-a-2')).toBeInTheDocument();
      expect(screen.getByText('X')).toBeInTheDocument();
      expect(screen.getByText('Y')).toBeInTheDocument();
    });
  });

  describe('conflict prevention', () => {
    it('should prevent shortcuts when input is focused', async () => {
      render(
        <SaleWizard
          onItemComplete={mockOnItemComplete}
          numpadCallbacks={mockNumpadCallbacks}
          currentMode="idle"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Focus on an input element
      const input = document.getElementById('test-input') as HTMLInputElement;
      input.focus();

      // Try to trigger shortcut
      const keyEvent = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(keyEvent);

      // Should not trigger category selection
      expect(mockNumpadCallbacks.setMode).not.toHaveBeenCalled();
    });

    it('should allow shortcuts when no input is focused', async () => {
      render(
        <SaleWizard
          onItemComplete={mockOnItemComplete}
          numpadCallbacks={mockNumpadCallbacks}
          currentMode="idle"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Ensure no input is focused
      (document.activeElement as HTMLElement)?.blur();

      // Trigger shortcut
      const keyEvent = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(keyEvent);

      // Should trigger category selection
      await waitFor(() => {
        expect(mockNumpadCallbacks.setMode).toHaveBeenCalledWith('weight');
      });
    });
  });

  describe('accessibility', () => {
    it('should announce shortcuts in aria-labels', async () => {
      render(
        <SaleWizard
          onItemComplete={mockOnItemComplete}
          numpadCallbacks={mockNumpadCallbacks}
          currentMode="idle"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      const categoryButton = screen.getByTestId('category-cat-a');
      expect(categoryButton).toHaveAttribute(
        'aria-label',
        'Sélectionner la catégorie Category A. Raccourci clavier: A'
      );
    });

    it('should have aria-hidden on shortcut badges', async () => {
      render(
        <SaleWizard
          onItemComplete={mockOnItemComplete}
          numpadCallbacks={mockNumpadCallbacks}
          currentMode="idle"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      const shortcutBadge = screen.getByTestId('shortcut-cat-a');
      expect(shortcutBadge).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('step transitions', () => {
    it('should activate shortcuts only in category and subcategory steps', async () => {
      render(
        <SaleWizard
          onItemComplete={mockOnItemComplete}
          numpadCallbacks={mockNumpadCallbacks}
          currentMode="idle"
        />
      );

      // Initially in category step - shortcuts should work
      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      const categoryEvent = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(categoryEvent);

      // Move to subcategory step - shortcuts should still work
      await waitFor(() => {
        expect(screen.getByText('Sélectionner la sous-catégorie')).toBeInTheDocument();
      });

      const subEvent = new KeyboardEvent('keydown', { key: 'x' });
      document.dispatchEvent(subEvent);

      // Move to weight step - shortcuts should be deactivated
      await waitFor(() => {
        expect(mockNumpadCallbacks.setMode).toHaveBeenCalledWith('weight');
      });

      // Try to trigger category shortcut in weight step - should not work
      const invalidEvent = new KeyboardEvent('keydown', { key: 'b' });
      document.dispatchEvent(invalidEvent);

      // Weight callback should not be called again
      expect(mockNumpadCallbacks.setWeightValue).not.toHaveBeenCalled();
    });
  });
});
