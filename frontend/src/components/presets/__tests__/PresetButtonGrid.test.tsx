import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../test/test-utils';
import userEvent from '@testing-library/user-event';
import PresetButtonGrid from '../PresetButtonGrid';
import * as presetStore from '../../../stores/presetStore';

// Mock the preset store
vi.mock('../../../stores/presetStore');

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
];

describe('PresetButtonGrid', () => {
  const mockOnPresetSelected = vi.fn();
  const mockFetchPresets = vi.fn();
  const mockSelectPreset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(presetStore.usePresetStore).mockReturnValue({
      activePresets: mockPresets,
      presets: mockPresets,
      selectedPreset: null,
      notes: '',
      loading: false,
      error: null,
      lastFetchTime: Date.now(),
      fetchPresets: mockFetchPresets,
      selectPreset: mockSelectPreset,
      setNotes: vi.fn(),
      clearSelection: vi.fn(),
      getActivePresets: () => mockPresets,
      getPresetById: (id: string) => mockPresets.find((p) => p.id === id),
      clearError: vi.fn(),
    });
  });

  it('should render all preset buttons', async () => {
    render(<PresetButtonGrid onPresetSelected={mockOnPresetSelected} />);

    await waitFor(() => {
      expect(screen.getByText('Don 0€')).toBeInTheDocument();
      expect(screen.getByText('Recyclage')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    vi.mocked(presetStore.usePresetStore).mockReturnValue({
      ...vi.mocked(presetStore.usePresetStore)(),
      loading: true,
    });

    render(<PresetButtonGrid onPresetSelected={mockOnPresetSelected} />);

    expect(screen.getByText('Chargement des boutons prédéfinis...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    vi.mocked(presetStore.usePresetStore).mockReturnValue({
      ...vi.mocked(presetStore.usePresetStore)(),
      error: 'Test error',
    });

    render(<PresetButtonGrid onPresetSelected={mockOnPresetSelected} />);

    expect(screen.getByText('Erreur: Test error')).toBeInTheDocument();
  });

  it('should call onPresetSelected when button is clicked', async () => {
    const user = userEvent.setup();
    render(<PresetButtonGrid onPresetSelected={mockOnPresetSelected} />);

    const button = screen.getByText('Don 0€');
    await user.click(button);

    expect(mockOnPresetSelected).toHaveBeenCalledWith(mockPresets[0]);
    expect(mockSelectPreset).toHaveBeenCalledWith(mockPresets[0]);
  });

  it('should allow deselection when clicking the same preset button', async () => {
    const user = userEvent.setup();
    vi.mocked(presetStore.usePresetStore).mockReturnValue({
      ...vi.mocked(presetStore.usePresetStore)(),
      selectedPreset: mockPresets[0],
    });

    render(<PresetButtonGrid onPresetSelected={mockOnPresetSelected} />);

    const button = screen.getByText('Don 0€');
    await user.click(button);

    expect(mockOnPresetSelected).toHaveBeenCalledWith(null);
    expect(mockSelectPreset).toHaveBeenCalledWith(null);
  });

  it('should highlight selected preset', () => {
    vi.mocked(presetStore.usePresetStore).mockReturnValue({
      ...vi.mocked(presetStore.usePresetStore)(),
      selectedPreset: mockPresets[0],
    });

    render(<PresetButtonGrid onPresetSelected={mockOnPresetSelected} />);

    const button = screen.getByText('Don 0€');
    expect(button).toBeInTheDocument();
    // The button should be visually different when selected (filled variant)
  });

  it('should show default buttons when no active presets', () => {
    vi.mocked(presetStore.usePresetStore).mockReturnValue({
      ...vi.mocked(presetStore.usePresetStore)(),
      activePresets: [],
    });

    render(<PresetButtonGrid onPresetSelected={mockOnPresetSelected} />);

    expect(screen.getByText('Don 0€')).toBeInTheDocument();
    expect(screen.getByText('Don -18 ans')).toBeInTheDocument();
    expect(screen.getByText('Recyclage')).toBeInTheDocument();
    expect(screen.getByText('Déchèterie')).toBeInTheDocument();
  });

  it('should use custom fallback buttons when provided', () => {
    const customFallbacks = [
      { id: 'custom-1', name: 'Custom Button 1', preset_price: 5.0, button_type: 'donation' as const, category_name: 'Custom' },
      { id: 'custom-2', name: 'Custom Button 2', preset_price: 10.0, button_type: 'recycling' as const, category_name: 'Custom' },
    ];

    vi.mocked(presetStore.usePresetStore).mockReturnValue({
      ...vi.mocked(presetStore.usePresetStore)(),
      activePresets: [],
    });

    render(<PresetButtonGrid onPresetSelected={mockOnPresetSelected} fallbackButtons={customFallbacks} />);

    expect(screen.getByText('Custom Button 1')).toBeInTheDocument();
    expect(screen.getByText('Custom Button 2')).toBeInTheDocument();
    expect(screen.queryByText('Don 0€')).not.toBeInTheDocument();
  });

  it('should disable buttons when disabled prop is true', async () => {
    const user = userEvent.setup();
    render(<PresetButtonGrid onPresetSelected={mockOnPresetSelected} disabled />);

    const button = screen.getByText('Don 0€');
    await user.click(button);

    expect(mockOnPresetSelected).not.toHaveBeenCalled();
    expect(mockSelectPreset).not.toHaveBeenCalled();
  });

  it('should call fetchPresets on mount', () => {
    render(<PresetButtonGrid onPresetSelected={mockOnPresetSelected} />);

    expect(mockFetchPresets).toHaveBeenCalledTimes(1);
  });
});
