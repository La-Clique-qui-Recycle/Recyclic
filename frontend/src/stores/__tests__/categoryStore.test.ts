import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '../../test/test-utils';
import { useCategoryStore } from '../categoryStore';
import { categoryService } from '../../services/categoryService';

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
    is_active: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    name: 'Inactive Category',
    is_active: false,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
];

describe('categoryStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    const { result } = renderHook(() => useCategoryStore());
    act(() => {
      result.current.categories = [];
      result.current.activeCategories = [];
      result.current.lastFetchTime = null;
      result.current.error = null;
    });
  });

  it('should fetch categories successfully', async () => {
    vi.mocked(categoryService.getCategories).mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategoryStore());

    await act(async () => {
      await result.current.fetchCategories();
    });

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(3);
      expect(result.current.activeCategories).toHaveLength(2);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  it('should cache categories and not refetch if cache is fresh', async () => {
    vi.mocked(categoryService.getCategories).mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategoryStore());

    // First fetch
    await act(async () => {
      await result.current.fetchCategories();
    });

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(3);
    });

    // Second fetch should use cache
    await act(async () => {
      await result.current.fetchCategories();
    });

    // Should only be called once due to caching
    expect(categoryService.getCategories).toHaveBeenCalledTimes(1);
  });

  it('should refetch if forceRefresh is true', async () => {
    vi.mocked(categoryService.getCategories).mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategoryStore());

    // First fetch
    await act(async () => {
      await result.current.fetchCategories();
    });

    // Second fetch with force refresh
    await act(async () => {
      await result.current.fetchCategories(true);
    });

    // Should be called twice
    expect(categoryService.getCategories).toHaveBeenCalledTimes(2);
  });

  it('should handle errors gracefully', async () => {
    const errorMessage = 'Erreur lors du chargement des catégories';
    vi.mocked(categoryService.getCategories).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCategoryStore());

    await act(async () => {
      await result.current.fetchCategories();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.categories).toHaveLength(0);
    });
  });

  it('should get active categories correctly', async () => {
    vi.mocked(categoryService.getCategories).mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategoryStore());

    await act(async () => {
      await result.current.fetchCategories();
    });

    await waitFor(() => {
      const activeCategories = result.current.getActiveCategories();
      expect(activeCategories).toHaveLength(2);
      expect(activeCategories.every(cat => cat.is_active)).toBe(true);
    });
  });

  it('should get category by ID correctly', async () => {
    vi.mocked(categoryService.getCategories).mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategoryStore());

    await act(async () => {
      await result.current.fetchCategories();
    });

    await waitFor(() => {
      const category = result.current.getCategoryById('1');
      expect(category).toEqual(mockCategories[0]);
    });
  });

  it('should clear error correctly', async () => {
    const { result } = renderHook(() => useCategoryStore());

    act(() => {
      result.current.error = 'Some error';
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });
});
