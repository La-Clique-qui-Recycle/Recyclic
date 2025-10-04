import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Category, categoryService } from '../services/categoryService';

interface CategoryState {
  // State
  categories: Category[];
  activeCategories: Category[];
  loading: boolean;
  error: string | null;
  lastFetchTime: number | null;

  // Actions
  fetchCategories: (forceRefresh?: boolean) => Promise<void>;
  getActiveCategories: () => Category[];
  getCategoryById: (id: string) => Category | undefined;
  clearError: () => void;
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const useCategoryStore = create<CategoryState>()(
  devtools(
    (set, get) => ({
      // Initial state
      categories: [],
      activeCategories: [],
      loading: false,
      error: null,
      lastFetchTime: null,

      // Fetch categories with caching
      fetchCategories: async (forceRefresh = false) => {
        const state = get();
        const now = Date.now();

        // Check if we have cached data and it's still fresh
        if (
          !forceRefresh &&
          state.lastFetchTime &&
          now - state.lastFetchTime < CACHE_DURATION &&
          state.categories.length > 0
        ) {
          // Return cached data
          return;
        }

        set({ loading: true, error: null });

        try {
          const allCategories = await categoryService.getCategories();
          const active = allCategories.filter((cat) => cat.is_active);

          set({
            categories: allCategories,
            activeCategories: active,
            loading: false,
            error: null,
            lastFetchTime: now,
          });
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.detail || 'Erreur lors du chargement des catégories',
          });
        }
      },

      // Get active categories
      getActiveCategories: () => {
        return get().activeCategories;
      },

      // Get category by ID
      getCategoryById: (id: string) => {
        return get().categories.find((cat) => cat.id === id);
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'categoryStore' }
  )
);

export default useCategoryStore;
