import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { PresetButtonWithCategory, presetService } from '../services/presetService';

interface PresetState {
  // State
  presets: PresetButtonWithCategory[];
  activePresets: PresetButtonWithCategory[];
  selectedPreset: PresetButtonWithCategory | null;
  notes: string;
  loading: boolean;
  error: string | null;
  lastFetchTime: number | null;

  // Actions
  fetchPresets: (forceRefresh?: boolean) => Promise<void>;
  selectPreset: (preset: PresetButtonWithCategory | null) => void;
  setNotes: (notes: string) => void;
  clearSelection: () => void;
  getActivePresets: () => PresetButtonWithCategory[];
  getPresetById: (id: string) => PresetButtonWithCategory | undefined;
  clearError: () => void;
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const usePresetStore = create<PresetState>()(
  devtools(
    (set, get) => ({
      // Initial state
      presets: [],
      activePresets: [],
      selectedPreset: null,
      notes: '',
      loading: false,
      error: null,
      lastFetchTime: null,

      // Fetch presets with caching
      fetchPresets: async (forceRefresh = false) => {
        const state = get();
        const now = Date.now();

        // Check if we have cached data and it's still fresh
        if (
          !forceRefresh &&
          state.lastFetchTime &&
          now - state.lastFetchTime < CACHE_DURATION &&
          state.presets.length > 0
        ) {
          // Return cached data
          return;
        }

        set({ loading: true, error: null });

        try {
          const allPresets = await presetService.getPresets();
          const active = allPresets.filter((preset) => preset.is_active);

          set({
            presets: allPresets,
            activePresets: active,
            loading: false,
            error: null,
            lastFetchTime: now,
          });
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.detail || 'Erreur lors du chargement des boutons prédéfinis',
          });
        }
      },

      // Select a preset button
      selectPreset: (preset) => {
        set({
          selectedPreset: preset,
          // Clear notes when selecting a different preset
          notes: preset ? get().notes : '',
        });
      },

      // Set transaction notes
      setNotes: (notes) => {
        set({ notes });
      },

      // Clear current selection
      clearSelection: () => {
        set({
          selectedPreset: null,
          notes: '',
        });
      },

      // Get active presets
      getActivePresets: () => {
        return get().activePresets;
      },

      // Get preset by ID
      getPresetById: (id: string) => {
        return get().presets.find((preset) => preset.id === id);
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'presetStore' }
  )
);

export default usePresetStore;
