import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../test/test-utils';
import userEvent from '@testing-library/user-event';
import CategorySelector from '../CategorySelector';
import * as categoryStore from '../../../stores/categoryStore';

// Mock the category store
vi.mock('../../../stores/categoryStore');

const mockCategories = [
  {
    id: '1',
    name: 'Electronics',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Furniture',
    is_active: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

describe('CategorySelector', () => {
  const mockOnSelect = vi.fn();
  const mockFetchCategories = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(categoryStore.useCategoryStore).mockReturnValue({
      activeCategories: mockCategories,
      categories: mockCategories,
      loading: false,
      error: null,
      lastFetchTime: Date.now(),
      fetchCategories: mockFetchCategories,
      getActiveCategories: () => mockCategories,
      getCategoryById: (id: string) => mockCategories.find((c) => c.id === id),
      clearError: vi.fn(),
    });
  });

  it('should render all active categories', async () => {
    render(<CategorySelector onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Furniture')).toBeInTheDocument();
    });
  });

  it('should fetch categories on mount', async () => {
    render(<CategorySelector onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(mockFetchCategories).toHaveBeenCalledOnce();
    });
  });

  it('should call onSelect when a category is clicked', async () => {
    const user = userEvent.setup();
    render(<CategorySelector onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    const categoryButton = screen.getByTestId('category-1');
    await user.click(categoryButton);

    expect(mockOnSelect).toHaveBeenCalledWith('1');
  });

  it('should highlight selected category', () => {
    render(<CategorySelector onSelect={mockOnSelect} selectedCategory="1" />);

    const selectedButton = screen.getByTestId('category-1');
    expect(selectedButton).toHaveStyle({ background: '#e8f5e8' });
  });

  it('should render empty when no categories', () => {
    vi.mocked(categoryStore.useCategoryStore).mockReturnValue({
      activeCategories: [],
      categories: [],
      loading: false,
      error: null,
      lastFetchTime: null,
      fetchCategories: mockFetchCategories,
      getActiveCategories: () => [],
      getCategoryById: () => undefined,
      clearError: vi.fn(),
    });

    render(<CategorySelector onSelect={mockOnSelect} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
