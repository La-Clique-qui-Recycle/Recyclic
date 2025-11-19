import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnhancedCategorySelector } from './EnhancedCategorySelector';
import { useCategoryStore } from '../../stores/categoryStore';
import type { Category } from '../../services/categoryService';

// Mock the category store
vi.mock('../../stores/categoryStore', () => ({
  useCategoryStore: vi.fn()
}));

const mockUseCategoryStore = vi.mocked(useCategoryStore);

const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Category A',
    shortcut_key: 'a',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Category B',
    shortcut_key: 'b',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Category C',
    shortcut_key: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

describe('EnhancedCategorySelector', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    mockUseCategoryStore.mockReturnValue({
      activeCategories: mockCategories,
      loading: false,
      error: null,
      fetchCategories: vi.fn(),
      getActiveCategories: vi.fn(),
      getCategoryById: vi.fn(),
      clearError: vi.fn()
    });
  });

  describe('rendering', () => {
    it('should render all root categories', () => {
      render(
        <EnhancedCategorySelector
          onSelect={mockOnSelect}
          selectedCategory={undefined}
        />
      );

      expect(screen.getByText('Category A')).toBeInTheDocument();
      expect(screen.getByText('Category B')).toBeInTheDocument();
      expect(screen.getByText('Category C')).toBeInTheDocument();
    });

    it('should show shortcut badges for categories with shortcuts', () => {
      render(
        <EnhancedCategorySelector
          onSelect={mockOnSelect}
          selectedCategory={undefined}
        />
      );

      const shortcutA = screen.getByTestId('shortcut-1');
      const shortcutB = screen.getByTestId('shortcut-2');

      expect(shortcutA).toBeInTheDocument();
      expect(shortcutA).toHaveTextContent('A');
      expect(shortcutB).toBeInTheDocument();
      expect(shortcutB).toHaveTextContent('B');
    });

    it('should not show shortcut badges for categories without shortcuts', () => {
      render(
        <EnhancedCategorySelector
          onSelect={mockOnSelect}
          selectedCategory={undefined}
        />
      );

      expect(screen.queryByTestId('shortcut-3')).not.toBeInTheDocument();
    });

    it('should show selected category styling', () => {
      render(
        <EnhancedCategorySelector
          onSelect={mockOnSelect}
          selectedCategory="1"
        />
      );

      const categoryButton = screen.getByTestId('category-1');
      expect(categoryButton).toHaveAttribute('data-selected', 'true');
      expect(categoryButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('accessibility', () => {
    it('should have proper aria-labels for categories with shortcuts', () => {
      render(
        <EnhancedCategorySelector
          onSelect={mockOnSelect}
          selectedCategory={undefined}
        />
      );

      const categoryButton = screen.getByTestId('category-1');
      expect(categoryButton).toHaveAttribute(
        'aria-label',
        'Sélectionner la catégorie Category A. Raccourci clavier: A'
      );
    });

    it('should have proper aria-labels for categories without shortcuts', () => {
      render(
        <EnhancedCategorySelector
          onSelect={mockOnSelect}
          selectedCategory={undefined}
        />
      );

      const categoryButton = screen.getByTestId('category-3');
      expect(categoryButton).toHaveAttribute(
        'aria-label',
        'Sélectionner la catégorie Category C'
      );
    });

    it('should have aria-hidden on shortcut badges', () => {
      render(
        <EnhancedCategorySelector
          onSelect={mockOnSelect}
          selectedCategory={undefined}
        />
      );

      const shortcutBadge = screen.getByTestId('shortcut-1');
      expect(shortcutBadge).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have proper role and group structure', () => {
      render(
        <EnhancedCategorySelector
          onSelect={mockOnSelect}
          selectedCategory={undefined}
        />
      );

      const container = screen.getByRole('group');
      expect(container).toHaveAttribute('aria-label', 'Sélection de catégorie');
    });
  });

  describe('interactions', () => {
    it('should call onSelect when category button is clicked', () => {
      render(
        <EnhancedCategorySelector
          onSelect={mockOnSelect}
          selectedCategory={undefined}
        />
      );

      const categoryButton = screen.getByTestId('category-1');
      fireEvent.click(categoryButton);

      expect(mockOnSelect).toHaveBeenCalledWith('1');
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('should call onSelect for different categories', () => {
      render(
        <EnhancedCategorySelector
          onSelect={mockOnSelect}
          selectedCategory={undefined}
        />
      );

      const categoryB = screen.getByTestId('category-2');
      fireEvent.click(categoryB);

      expect(mockOnSelect).toHaveBeenCalledWith('2');
    });
  });

  describe('loading and error states', () => {
    it('should show loading state', () => {
      mockUseCategoryStore.mockReturnValue({
        activeCategories: [],
        loading: true,
        error: null,
        fetchCategories: vi.fn(),
        getActiveCategories: vi.fn(),
        getCategoryById: vi.fn(),
        clearError: vi.fn()
      });

      render(
        <EnhancedCategorySelector
          onSelect={mockOnSelect}
          selectedCategory={undefined}
        />
      );

      expect(screen.getByText('Chargement des catégories...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should show error state', () => {
      mockUseCategoryStore.mockReturnValue({
        activeCategories: [],
        loading: false,
        error: 'Network error',
        fetchCategories: vi.fn(),
        getActiveCategories: vi.fn(),
        getCategoryById: vi.fn(),
        clearError: vi.fn()
      });

      render(
        <EnhancedCategorySelector
          onSelect={mockOnSelect}
          selectedCategory={undefined}
        />
      );

      expect(screen.getByText('Erreur lors du chargement des catégories: Network error')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply correct styling to shortcut badges', () => {
      render(
        <EnhancedCategorySelector
          onSelect={mockOnSelect}
          selectedCategory={undefined}
        />
      );

      const shortcutBadge = screen.getByTestId('shortcut-1');

      // Check that it's positioned absolutely
      expect(shortcutBadge).toHaveStyle({
        position: 'absolute',
        bottom: '0.5rem',
        left: '0.5rem'
      });

      // Check text styling
      expect(shortcutBadge).toHaveStyle({
        textTransform: 'uppercase',
        fontWeight: 'bold',
        fontSize: '0.75rem'
      });
    });
  });
});
