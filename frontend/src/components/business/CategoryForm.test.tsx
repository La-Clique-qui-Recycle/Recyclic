import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { CategoryForm } from './CategoryForm';
import { Category, categoryService } from '../../services/categoryService';

// Wrapper component with MantineProvider
const renderWithProviders = (component: React.ReactElement) => {
  return render(<MantineProvider>{component}</MantineProvider>);
};

// Mock the categoryService
vi.mock('../../services/categoryService', () => ({
  categoryService: {
    getCategories: vi.fn(),
  },
}));

describe('CategoryForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockGetCategories = vi.mocked(categoryService.getCategories);

  const mockCategories: Category[] = [
    {
      id: '1',
      name: 'Electronics',
      is_active: true,
      parent_id: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Furniture',
      is_active: true,
      parent_id: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCategories.mockResolvedValue(mockCategories);
  });

  it('should render the form with name input and parent category select', async () => {
    renderWithProviders(
      <CategoryForm
        category={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/Nom de la catégorie/i)).toBeInTheDocument();
    expect(screen.getByTestId('parent-category-select')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Créer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Annuler/i })).toBeInTheDocument();

    // Wait for categories to load
    await waitFor(() => {
      expect(mockGetCategories).toHaveBeenCalledWith(true);
    });
  });

  it('should not show price fields for root categories (no parent_id)', async () => {
    const rootCategory: Category = {
      id: '1',
      name: 'Electronics',
      is_active: true,
      parent_id: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    renderWithProviders(
      <CategoryForm
        category={rootCategory}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(mockGetCategories).toHaveBeenCalledWith(true);
    });

    expect(screen.queryByTestId('price-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('min-price-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('max-price-input')).not.toBeInTheDocument();
  });

  it('should show price fields for subcategories (with parent_id)', async () => {
    const subcategory: Category = {
      id: '2',
      name: 'Laptops',
      is_active: true,
      parent_id: '1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    renderWithProviders(
      <CategoryForm
        category={subcategory}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(mockGetCategories).toHaveBeenCalledWith(true);
    });

    expect(screen.getByTestId('price-input')).toBeInTheDocument();
    expect(screen.getByTestId('min-price-input')).toBeInTheDocument();
    expect(screen.getByTestId('max-price-input')).toBeInTheDocument();
  });

  it('should populate price fields when editing a subcategory with prices', async () => {
    const subcategoryWithPrices: Category = {
      id: '2',
      name: 'Laptops',
      is_active: true,
      parent_id: '1',
      price: 299.99,
      min_price: 199.99,
      max_price: 499.99,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    renderWithProviders(
      <CategoryForm
        category={subcategoryWithPrices}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(mockGetCategories).toHaveBeenCalledWith(true);
    });

    // Verify price fields are present (they should be rendered for subcategories)
    expect(screen.getByTestId('price-input')).toBeInTheDocument();
    expect(screen.getByTestId('min-price-input')).toBeInTheDocument();
    expect(screen.getByTestId('max-price-input')).toBeInTheDocument();
  });

  it('should submit form with name and parent_id for root category', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    renderWithProviders(
      <CategoryForm
        category={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(mockGetCategories).toHaveBeenCalledWith(true);
    });

    const nameInput = screen.getByLabelText(/Nom de la catégorie/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'New Category');

    const submitButton = screen.getByRole('button', { name: /Créer/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New Category',
        parent_id: null,
      });
    });
  });

  it('should submit form with price fields for subcategory', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    const subcategory: Category = {
      id: '2',
      name: 'Laptops',
      is_active: true,
      parent_id: '1',
      price: 299.99,
      min_price: 199.99,
      max_price: 499.99,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    renderWithProviders(
      <CategoryForm
        category={subcategory}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(mockGetCategories).toHaveBeenCalledWith(true);
    });

    // Verify price fields are rendered
    expect(screen.getByTestId('price-input')).toBeInTheDocument();
    expect(screen.getByTestId('min-price-input')).toBeInTheDocument();
    expect(screen.getByTestId('max-price-input')).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: /Mettre à jour/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Laptops',
        parent_id: '1',
        price: 299.99,
        min_price: 199.99,
        max_price: 499.99,
      });
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CategoryForm
        category={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Annuler/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should not call onSubmit if name is empty', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CategoryForm
        category={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(mockGetCategories).toHaveBeenCalledWith(true);
    });

    const submitButton = screen.getByRole('button', { name: /Créer/i });
    await user.click(submitButton);

    // Validation should prevent submission
    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('should allow selecting a parent category', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    renderWithProviders(
      <CategoryForm
        category={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(mockGetCategories).toHaveBeenCalledWith(true);
    });

    const nameInput = screen.getByLabelText(/Nom de la catégorie/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'New Subcategory');

    // Select a parent category
    const parentSelect = screen.getByTestId('parent-category-select');
    await user.click(parentSelect);
    
    // Wait for options to appear and select Electronics
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Electronics'));

    const submitButton = screen.getByRole('button', { name: /Créer/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New Subcategory',
        parent_id: '1',
        price: null,
        min_price: null,
        max_price: null,
      });
    });
  });

  it('should show price fields when parent category is selected', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CategoryForm
        category={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(mockGetCategories).toHaveBeenCalledWith(true);
    });

    // Initially no price fields should be visible
    expect(screen.queryByTestId('price-input')).not.toBeInTheDocument();

    // Select a parent category
    const parentSelect = screen.getByTestId('parent-category-select');
    await user.click(parentSelect);
    
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Electronics'));

    // Now price fields should be visible
    await waitFor(() => {
      expect(screen.getByTestId('price-input')).toBeInTheDocument();
      expect(screen.getByTestId('min-price-input')).toBeInTheDocument();
      expect(screen.getByTestId('max-price-input')).toBeInTheDocument();
    });
  });
});
