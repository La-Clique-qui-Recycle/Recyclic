import React, { useEffect } from 'react';
import { Button, Grid, Text } from '@mantine/core';
import { usePresetStore } from '../../stores/presetStore';
import { PresetButtonWithCategory } from '../../services/presetService';

interface PresetButtonGridProps {
  onPresetSelected?: (preset: PresetButtonWithCategory | null) => void;
  disabled?: boolean;
  selectedPresetId?: string;
  compact?: boolean;
  fallbackButtons?: Array<{
    id: string;
    name: string;
    preset_price: number;
    button_type: 'donation' | 'recycling';
    category_name: string;
  }>;
  // Nouvelles props pour état isolé par transaction
  selectedPreset?: PresetButtonWithCategory | null;
  onPresetSelect?: (preset: PresetButtonWithCategory | null) => void;
}

// Default fallback buttons as specified in the story
const DEFAULT_FALLBACK_BUTTONS = [
  { id: 'don-0', name: 'Don 0€', preset_price: 0, button_type: 'donation' as const, category_name: 'Donation' },
  { id: 'don-18', name: 'Don -18 ans', preset_price: 0, button_type: 'donation' as const, category_name: 'Donation' },
  { id: 'recyclage', name: 'Recyclage', preset_price: 0, button_type: 'recycling' as const, category_name: 'Recyclage' },
  { id: 'decheterie', name: 'Déchèterie', preset_price: 0, button_type: 'recycling' as const, category_name: 'Déchèterie' },
];

const PresetButtonGrid: React.FC<PresetButtonGridProps> = ({
  onPresetSelected,
  disabled = false,
  selectedPresetId,
  compact = false,
  fallbackButtons = DEFAULT_FALLBACK_BUTTONS,
  selectedPreset: propSelectedPreset,
  onPresetSelect: propOnPresetSelect
}) => {
  const {
    activePresets,
    selectedPreset: storeSelectedPreset,
    loading,
    error,
    fetchPresets,
    selectPreset: storeSelectPreset,
  } = usePresetStore();

  // Utiliser l'état local si fourni, sinon l'état global du store
  const currentSelectedPreset = propSelectedPreset !== undefined ? propSelectedPreset : storeSelectedPreset;
  const handlePresetSelect = propOnPresetSelect || storeSelectPreset;

  // Fetch presets on component mount
  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const handlePresetClick = (preset: any) => {
    if (disabled) return;

    // Si on clique sur le même preset, on le désélectionne
    if (currentSelectedPreset?.id === preset.id) {
      handlePresetSelect(null);
      onPresetSelected?.(null);
    } else {
      // Pour les fallback buttons, créer un objet compatible
      const presetToSelect = activePresets.length > 0 ? preset : {
        ...preset,
        category_id: '', // Valeur par défaut pour fallback
        sort_order: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Sinon on sélectionne le nouveau preset
      handlePresetSelect(presetToSelect);
      onPresetSelected?.(presetToSelect);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <Text size="sm" c="dimmed">Chargement des boutons prédéfinis...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <Text size="sm" c="red">Erreur: {error}</Text>
      </div>
    );
  }

  // If no active presets, show configurable fallback buttons
  const buttonsToShow = activePresets.length > 0 ? activePresets : fallbackButtons;

  return (
    <div>
      <Grid gutter="xs">
        {buttonsToShow.map((preset) => (
          <Grid.Col key={preset.id} span={6}>
            <Button
              fullWidth
              variant={currentSelectedPreset?.id === preset.id ? 'filled' : 'outline'}
              color={currentSelectedPreset?.id === preset.id ? 'green' : 'blue'}
              size="md"
              onClick={() => handlePresetClick(preset)}
              disabled={disabled}
              style={{
                minHeight: '48px',
                fontWeight: 500,
              }}
            >
              {preset.name}
            </Button>
          </Grid.Col>
        ))}
      </Grid>
    </div>
  );
};

export default PresetButtonGrid;
