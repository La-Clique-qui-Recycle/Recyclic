import React, { useEffect, useState } from 'react';
import { Text, Stack, Box, Textarea } from '@mantine/core';
import { usePresetStore } from '../../stores/presetStore';

interface PriceCalculatorProps {
  onPriceCalculated?: (price: number, notes: string, presetId?: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  disabled?: boolean;
  // Nouvelles props pour état isolé par transaction
  selectedPreset?: PresetButtonWithCategory | null;
  notes?: string;
  onNotesChange?: (notes: string) => void;
  // Catégorie actuelle sélectionnée (pour affichage au lieu de category_name du preset)
  categoryName?: string;
}

const PriceCalculator: React.FC<PriceCalculatorProps> = ({
  onPriceCalculated,
  onValidationChange,
  disabled = false,
  selectedPreset: propSelectedPreset,
  notes: propNotes,
  onNotesChange: propOnNotesChange,
  categoryName
}) => {
  const {
    selectedPreset: storeSelectedPreset,
    notes: storeNotes,
    setNotes: storeSetNotes,
  } = usePresetStore();

  // Utiliser l'état local si fourni, sinon l'état global du store
  const currentSelectedPreset = propSelectedPreset !== undefined ? propSelectedPreset : storeSelectedPreset;
  const currentNotes = propNotes !== undefined ? propNotes : storeNotes;
  const handleNotesChange = propOnNotesChange || storeSetNotes;

  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

  // Calculate price when preset changes
  // IMPORTANT: Les presets (Don 0€, Don -18 ans, Recyclage, Déchèterie) ont toujours un prix de 0€
  // Le preset_price sert uniquement à identifier le type de transaction, pas à calculer le prix
  useEffect(() => {
    if (currentSelectedPreset) {
      // Prix toujours 0€ pour tous les presets
      const price = 0;
      setCalculatedPrice(price);
      onValidationChange?.(true);
      onPriceCalculated?.(price, currentNotes, currentSelectedPreset.id);
    } else {
      setCalculatedPrice(0);
      onValidationChange?.(false);
    }
  }, [currentSelectedPreset, currentNotes, onPriceCalculated, onValidationChange]);

  // Update when notes change to propagate latest value
  useEffect(() => {
    if (currentSelectedPreset) {
      onPriceCalculated?.(calculatedPrice, currentNotes, currentSelectedPreset.id);
    }
  }, [currentNotes, calculatedPrice, currentSelectedPreset, onPriceCalculated]);

  const handleNotesChangeLocal = (value: string) => {
    handleNotesChange(value);
  };

  if (!currentSelectedPreset) {
    return (
      <Box p="md">
        <Text size="sm" c="dimmed">
          Sélectionnez un bouton prédéfini pour continuer
        </Text>
      </Box>
    );
  }

  const isRecyclingContext =
    currentSelectedPreset?.button_type === 'recycling' ||
    currentSelectedPreset?.name?.toLowerCase().includes('déchet');
  const notesLabel = isRecyclingContext
    ? "Détails (optionnels - recyclage / déchèterie)"
    : "Notes (optionnel)";
  const notesPlaceholder = isRecyclingContext
    ? "Ex: type de matière, destination, remarques..."
    : "Ajoutez une note si nécessaire";

  return (
    <Stack gap="md">
      <Box>
        <Text size="sm" fw={500} mb="xs">
          Prix calculé
        </Text>
        <Text size="xl" fw={700} c="green">
          {(calculatedPrice || 0).toFixed(2)} €
        </Text>
        <Text size="sm" c="dimmed">
          {currentSelectedPreset?.name}{categoryName ? ` - ${categoryName}` : currentSelectedPreset?.category_name ? ` - ${currentSelectedPreset.category_name}` : ''}
        </Text>
      </Box>

      <Textarea
        label={notesLabel}
        placeholder={notesPlaceholder}
        value={currentNotes}
        onChange={(event) => handleNotesChangeLocal(event.currentTarget.value)}
        disabled={disabled}
        autosize
        minRows={2}
        maxRows={4}
      />

      {isRecyclingContext && (
        <Text size="xs" c="dimmed">
          Facultatif mais recommandé pour tracer le recyclage ou la déchèterie.
        </Text>
      )}
    </Stack>
  );
};

export default PriceCalculator;
