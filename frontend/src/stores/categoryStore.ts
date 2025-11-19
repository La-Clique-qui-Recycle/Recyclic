import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Category, categoryService } from '../services/categoryService';

interface CategoryState {
  // State
  categories: Category[];
  activeCategories: Category[];
  visibleCategories: Category[]; // Categories visible for ENTRY tickets
  loading: boolean;
  error: string | null;
  lastFetchTime: number | null;

  // Actions
  fetchCategories: (forceRefresh?: boolean) => Promise<void>;
  fetchVisibleCategories: (forceRefresh?: boolean) => Promise<void>;
  getActiveCategories: () => Category[];
  getVisibleCategories: () => Category[];
  getCategoryById: (id: string) => Category | undefined;
  toggleCategoryVisibility: (categoryId: string, isVisible: boolean) => Promise<void>;
  updateDisplayOrder: (categoryId: string, displayOrder: number) => Promise<void>;
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
      visibleCategories: [],
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

      // Fetch visible categories for ENTRY tickets
      fetchVisibleCategories: async (forceRefresh = false) => {
        const state = get();
        const now = Date.now();

        // Check cache
        if (
          !forceRefresh &&
          state.lastFetchTime &&
          now - state.lastFetchTime < CACHE_DURATION &&
          state.visibleCategories.length > 0
        ) {
          return;
        }

        set({ loading: true, error: null });

        try {
          const visibleCategories = await categoryService.getCategoriesForEntryTickets(true);
          set({
            visibleCategories,
            loading: false,
            error: null,
            lastFetchTime: now,
          });
        } catch (error: any) {
          // Fallback: if endpoint fails (e.g., migration not run), use all active categories
          console.warn('Failed to fetch visible categories, falling back to active categories', error);
          try {
            // Try to fetch all categories and filter visible ones
            const allCategories = await categoryService.getCategories(true);
            const visible = allCategories.filter((cat) => cat.is_visible !== false);
            set({
              visibleCategories: visible.length > 0 ? visible : allCategories, // Fallback to all if none visible
              loading: false,
              error: null,
              lastFetchTime: now,
            });
          } catch (fallbackError: any) {
            set({
              loading: false,
              error: error.response?.data?.detail || 'Erreur lors du chargement des catégories visibles',
            });
          }
        }
      },

      // Get visible categories
      getVisibleCategories: () => {
        return get().visibleCategories;
      },

      // Get category by ID
      getCategoryById: (id: string) => {
        return get().categories.find((cat) => cat.id === id);
      },

      // Toggle category visibility
      toggleCategoryVisibility: async (categoryId: string, isVisible: boolean) => {
        // Mise à jour optimiste : mettre à jour immédiatement dans le store
        const state = get();
        const updatedCategories = state.categories.map((cat) =>
          cat.id === categoryId ? { ...cat, is_visible: isVisible } : cat
        );
        const updatedActiveCategories = updatedCategories.filter((cat) => cat.is_active);
        const updatedVisibleCategories = updatedActiveCategories.filter((cat) => cat.is_visible);

        // Mettre à jour le store immédiatement (sans loading pour éviter le re-render complet)
        set({
          categories: updatedCategories,
          activeCategories: updatedActiveCategories,
          visibleCategories: updatedVisibleCategories,
        });

        // Ensuite, synchroniser avec l'API en arrière-plan (sans bloquer l'UI)
        try {
          await categoryService.updateCategoryVisibility(categoryId, isVisible);
          // Si succès, on peut optionnellement recharger pour avoir les données à jour
          // Mais on ne force pas le rechargement pour éviter le scroll reset
        } catch (error: any) {
          // En cas d'erreur, restaurer l'état précédent
          set({
            categories: state.categories,
            activeCategories: state.activeCategories,
            visibleCategories: state.visibleCategories,
            error: error.response?.data?.detail || 'Erreur lors de la mise à jour de la visibilité',
          });
          throw error;
        }
      },

      // Update display order
      updateDisplayOrder: async (categoryId: string, displayOrder: number) => {
        // Mise à jour optimiste : mettre à jour immédiatement dans le store
        const state = get();
        const updatedCategories = state.categories.map((cat) =>
          cat.id === categoryId ? { ...cat, display_order: displayOrder } : cat
        );
        const updatedActiveCategories = updatedCategories.filter((cat) => cat.is_active);
        const updatedVisibleCategories = updatedActiveCategories.filter((cat) => cat.is_visible);

        // Mettre à jour le store immédiatement (sans loading pour éviter le re-render complet)
        set({
          categories: updatedCategories,
          activeCategories: updatedActiveCategories,
          visibleCategories: updatedVisibleCategories,
        });

        // Ensuite, synchroniser avec l'API en arrière-plan (sans bloquer l'UI)
        try {
          await categoryService.updateDisplayOrder(categoryId, displayOrder);
          // Si succès, on peut optionnellement recharger pour avoir les données à jour
          // Mais on ne force pas le rechargement pour éviter le scroll reset
        } catch (error: any) {
          // En cas d'erreur, restaurer l'état précédent
          set({
            categories: state.categories,
            activeCategories: state.activeCategories,
            visibleCategories: state.visibleCategories,
            error: error.response?.data?.detail || 'Erreur lors de la mise à jour de l\'ordre d\'affichage',
          });
          throw error;
        }
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
