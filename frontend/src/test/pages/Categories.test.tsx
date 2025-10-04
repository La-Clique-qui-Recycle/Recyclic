import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test-utils';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Categories from '../../pages/Admin/Categories';
import * as categoryService from '../../services/categoryService';

// Mock the category service
vi.mock('../../services/categoryService');

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
    is_active: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

describe('Categories Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', async () => {
    vi.mocked(categoryService.categoryService.getCategories).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<Categories />);

    await waitFor(() => {
      expect(screen.getByText('Gestion des Catégories')).toBeInTheDocument();
    });
  });

  it('should load and display categories', async () => {
    vi.mocked(categoryService.categoryService.getCategories).mockResolvedValue(mockCategories);

    render(<Categories />);

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Furniture')).toBeInTheDocument();
    });

    expect(screen.getByText('Actif')).toBeInTheDocument();
    expect(screen.getByText('Inactif')).toBeInTheDocument();
  });

  it('should open modal when clicking create button', async () => {
    vi.mocked(categoryService.categoryService.getCategories).mockResolvedValue(mockCategories);

    const user = userEvent.setup();
    render(<Categories />);

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Nouvelle catégorie');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Nom de la catégorie')).toBeInTheDocument();
    });
  });

  it('should create a new category', async () => {
    vi.mocked(categoryService.categoryService.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(categoryService.categoryService.createCategory).mockResolvedValue({
      id: '3',
      name: 'Clothing',
      is_active: true,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    });

    const user = userEvent.setup();
    render(<Categories />);

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Nouvelle catégorie');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Nom de la catégorie')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Nom de la catégorie');
    await user.type(input, 'Clothing');

    const submitButton = screen.getByText('Créer');
    await user.click(submitButton);

    await waitFor(() => {
      expect(categoryService.categoryService.createCategory).toHaveBeenCalledWith({
        name: 'Clothing',
      });
    });
  });

  it('should handle edit category', async () => {
    vi.mocked(categoryService.categoryService.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(categoryService.categoryService.updateCategory).mockResolvedValue({
      ...mockCategories[0],
      name: 'Updated Electronics',
    });

    const user = userEvent.setup();
    render(<Categories />);

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    // Find and click edit button (first action icon button)
    const editButtons = screen.getAllByTitle('Modifier');
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByLabelText('Nom de la catégorie')).toHaveValue('Electronics');
    });

    const input = screen.getByLabelText('Nom de la catégorie');
    await user.clear(input);
    await user.type(input, 'Updated Electronics');

    const submitButton = screen.getByText('Mettre à jour');
    await user.click(submitButton);

    await waitFor(() => {
      expect(categoryService.categoryService.updateCategory).toHaveBeenCalledWith('1', {
        name: 'Updated Electronics',
      });
    });
  });

  it('should deactivate category', async () => {
    vi.mocked(categoryService.categoryService.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(categoryService.categoryService.deleteCategory).mockResolvedValue({
      ...mockCategories[0],
      is_active: false,
    });

    // Mock window.confirm
    global.confirm = vi.fn(() => true);

    const user = userEvent.setup();
    render(<Categories />);

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Désactiver');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(categoryService.categoryService.deleteCategory).toHaveBeenCalledWith('1');
    });

    global.confirm = undefined;
  });

  it('should reactivate category', async () => {
    vi.mocked(categoryService.categoryService.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(categoryService.categoryService.reactivateCategory).mockResolvedValue({
      ...mockCategories[1],
      is_active: true,
    });

    const user = userEvent.setup();
    render(<Categories />);

    await waitFor(() => {
      expect(screen.getByText('Furniture')).toBeInTheDocument();
    });

    const reactivateButtons = screen.getAllByTitle('Réactiver');
    await user.click(reactivateButtons[0]);

    await waitFor(() => {
      expect(categoryService.categoryService.reactivateCategory).toHaveBeenCalledWith('2');
    });
  });

  it('should display error message on fetch failure', async () => {
    vi.mocked(categoryService.categoryService.getCategories).mockRejectedValue({
      response: { data: { detail: 'Failed to load categories' } },
    });

    render(<Categories />);

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des catégories')).toBeInTheDocument();
    });
  });

  it('should refresh categories list', async () => {
    vi.mocked(categoryService.categoryService.getCategories).mockResolvedValue(mockCategories);

    const user = userEvent.setup();
    render(<Categories />);

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Actualiser');
    await user.click(refreshButton);

    await waitFor(() => {
      expect(categoryService.categoryService.getCategories).toHaveBeenCalledTimes(2);
    });
  });
});
