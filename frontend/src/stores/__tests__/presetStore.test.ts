import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '../../test/test-utils';
import { usePresetStore } from '../presetStore';
import { presetService } from '../../services/presetService';

// Mock the preset service
vi.mock('../../services/presetService');

const mockPresets = [
  {
    id: '1',
    name: 'Don 0€',
    category_id: 'cat1',
    preset_price: 0,
    button_type: 'donation' as const,
    sort_order: 1,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    category_name: 'Donation',
  },
  {
    id: '2',
    name: 'Recyclage',
    category_id: 'cat2',
    preset_price: 0,
    button_type: 'recycling' as const,
    sort_order: 2,
    is_active: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    category_name: 'Recycling',
  },
  {
    id: '3',
    name: 'Inactive Preset',
    category_id: 'cat3',
    preset_price: 5.0,
    button_type: 'donation' as const,
    sort_order: 3,
    is_active: false,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    category_name: 'Donation',
  },
];

describe('presetStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    const { result } = renderHook(() => usePresetStore());
    act(() => {
      result.current.presets = [];
      result.current.activePresets = [];
      result.current.selectedPreset = null;
      result.current.notes = '';
      result.current.lastFetchTime = null;
      result.current.error = null;
    });
  });

  it('should fetch presets successfully', async () => {
    vi.mocked(presetService.getPresets).mockResolvedValue(mockPresets);

    const { result } = renderHook(() => usePresetStore());

    act(() => {
      result.current.fetchPresets();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.presets).toEqual(mockPresets);
    expect(result.current.activePresets).toHaveLength(2); // Only active presets
    expect(result.current.error).toBeNull();
    expect(result.current.lastFetchTime).toBeGreaterThan(0);
  });

  it('should handle fetch error', async () => {
    const errorMessage = 'Network error';
    vi.mocked(presetService.getPresets).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => usePresetStore());

    act(() => {
      result.current.fetchPresets();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(`Erreur lors du chargement des boutons prédéfinis`);
    expect(result.current.presets).toEqual([]);
    expect(result.current.activePresets).toEqual([]);
  });

  it('should select a preset', () => {
    const { result } = renderHook(() => usePresetStore());

    act(() => {
      result.current.selectPreset(mockPresets[0]);
    });

    expect(result.current.selectedPreset).toEqual(mockPresets[0]);
  });

  it('should clear selection', () => {
    const { result } = renderHook(() => usePresetStore());

    // First select a preset
    act(() => {
      result.current.selectPreset(mockPresets[0]);
      result.current.setNotes('Test notes');
    });

    expect(result.current.selectedPreset).toEqual(mockPresets[0]);
    expect(result.current.notes).toBe('Test notes');

    // Then clear selection
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedPreset).toBeNull();
    expect(result.current.notes).toBe('');
  });

  it('should set notes', () => {
    const { result } = renderHook(() => usePresetStore());
    const testNotes = 'These are test notes';

    act(() => {
      result.current.setNotes(testNotes);
    });

    expect(result.current.notes).toBe(testNotes);
  });

  it('should get active presets', () => {
    const { result } = renderHook(() => usePresetStore());

    act(() => {
      result.current.presets = mockPresets;
      result.current.activePresets = mockPresets.filter(p => p.is_active);
    });

    const activePresets = result.current.getActivePresets();
    expect(activePresets).toHaveLength(2);
    expect(activePresets.every(p => p.is_active)).toBe(true);
  });

  it('should get preset by id', () => {
    const { result } = renderHook(() => usePresetStore());

    act(() => {
      result.current.presets = mockPresets;
    });

    const preset = result.current.getPresetById('2');
    expect(preset).toEqual(mockPresets[1]);

    const nonExistentPreset = result.current.getPresetById('999');
    expect(nonExistentPreset).toBeUndefined();
  });

  it('should clear error', () => {
    const { result } = renderHook(() => usePresetStore());

    act(() => {
      result.current.error = 'Test error';
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should use cached data when not expired', async () => {
    vi.mocked(presetService.getPresets).mockResolvedValue(mockPresets);

    const { result } = renderHook(() => usePresetStore());

    // First fetch
    act(() => {
      result.current.fetchPresets();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const firstFetchTime = result.current.lastFetchTime;

    // Second fetch with forceRefresh = false (should use cache)
    act(() => {
      result.current.fetchPresets(false);
    });

    // Should not call the service again due to caching
    expect(vi.mocked(presetService.getPresets)).toHaveBeenCalledTimes(1);
    expect(result.current.lastFetchTime).toBe(firstFetchTime);
  });

  it('should refresh cache when forceRefresh is true', async () => {
    vi.mocked(presetService.getPresets).mockResolvedValue(mockPresets);

    const { result } = renderHook(() => usePresetStore());

    // First fetch
    act(() => {
      result.current.fetchPresets();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Second fetch with forceRefresh = true
    act(() => {
      result.current.fetchPresets(true);
    });

    await waitFor(() => {
      expect(vi.mocked(presetService.getPresets)).toHaveBeenCalledTimes(2);
    });
  });
});
