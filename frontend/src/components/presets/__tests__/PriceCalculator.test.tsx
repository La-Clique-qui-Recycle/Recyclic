import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import userEvent from '@testing-library/user-event';
import PriceCalculator from '../PriceCalculator';
import * as presetStore from '../../../stores/presetStore';

vi.mock('../../../stores/presetStore');

const basePreset = {
  id: '1',
  name: 'Recyclage',
  category_id: 'cat1',
  preset_price: 5.5,
  button_type: 'recycling' as const,
  sort_order: 1,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  category_name: 'Recycling',
};

describe('PriceCalculator', () => {
  const mockOnPriceCalculated = vi.fn();
  const mockOnValidationChange = vi.fn();
  const mockSetNotes = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(presetStore.usePresetStore).mockReturnValue({
      selectedPreset: null,
      notes: '',
      setNotes: mockSetNotes,
    });
  });

  it('renders helper when no preset is selected', () => {
    render(
      <PriceCalculator
        onPriceCalculated={mockOnPriceCalculated}
        onValidationChange={mockOnValidationChange}
      />
    );

    expect(
      screen.getByText('Sélectionnez un bouton prédéfini pour continuer')
    ).toBeInTheDocument();
  });

  it('shows calculated price and optional notes for recycling context', () => {
    vi.mocked(presetStore.usePresetStore).mockReturnValue({
      selectedPreset: basePreset,
      notes: '',
      setNotes: mockSetNotes,
    });

    render(
      <PriceCalculator
        onPriceCalculated={mockOnPriceCalculated}
        onValidationChange={mockOnValidationChange}
      />
    );

    expect(screen.getByText('Prix calculé')).toBeInTheDocument();
    expect(screen.getByText('5.50 €')).toBeInTheDocument();
    expect(
      screen.getByText('Détails (optionnels - recyclage / déchèterie)')
    ).toBeInTheDocument();
    expect(mockOnValidationChange).toHaveBeenCalledWith(true);
  });

  it('adapts label for donation presets', () => {
    const donationPreset = { ...basePreset, button_type: 'donation' as const, name: 'Don 0€' };
    vi.mocked(presetStore.usePresetStore).mockReturnValue({
      selectedPreset: donationPreset,
      notes: '',
      setNotes: mockSetNotes,
    });

    render(<PriceCalculator onPriceCalculated={mockOnPriceCalculated} />);

    expect(screen.getByText('Notes (optionnel)')).toBeInTheDocument();
  });

  it('updates notes via textarea', async () => {
    const user = userEvent.setup();
    vi.mocked(presetStore.usePresetStore).mockReturnValue({
      selectedPreset: basePreset,
      notes: '',
      setNotes: mockSetNotes,
    });

    render(<PriceCalculator onPriceCalculated={mockOnPriceCalculated} />);

    const notesInput = screen.getByPlaceholderText(
      'Ex: type de matière, destination, remarques...'
    );
    await user.type(notesInput, 'Test notes');

    expect(mockSetNotes).toHaveBeenCalledWith('Test notes');
  });

  it('propagates note changes to callback', () => {
    vi.mocked(presetStore.usePresetStore).mockReturnValue({
      selectedPreset: basePreset,
      notes: 'Valid notes',
      setNotes: mockSetNotes,
    });

    render(
      <PriceCalculator
        onPriceCalculated={mockOnPriceCalculated}
        onValidationChange={mockOnValidationChange}
      />
    );

    expect(mockOnPriceCalculated).toHaveBeenCalledWith(5.5, 'Valid notes', '1');
  });

  it('disables textarea when disabled prop is set', () => {
    vi.mocked(presetStore.usePresetStore).mockReturnValue({
      selectedPreset: basePreset,
      notes: '',
      setNotes: mockSetNotes,
    });

    render(<PriceCalculator disabled />);

    const notesInput = screen.getByPlaceholderText(
      'Ex: type de matière, destination, remarques...'
    );
    expect(notesInput).toBeDisabled();
  });
});
