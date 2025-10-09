import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

interface WeightEntry {
  weight: number;
  timestamp: Date;
}

interface MultipleWeightEntryProps {
  currentWeight: string;
  weightError: string;
  onClearWeight: () => void;
  onValidate: (totalWeight: number) => void;
}

const MultipleWeightEntry: React.FC<MultipleWeightEntryProps> = ({
  currentWeight,
  weightError,
  onClearWeight,
  onValidate,
}) => {
  const [weights, setWeights] = useState<WeightEntry[]>([]);

  // Calcul du poids total
  const totalWeight = weights.reduce((sum, entry) => sum + entry.weight, 0);
  const isCurrentWeightValid = currentWeight && !weightError && parseFloat(currentWeight) > 0;

  // Fonction pour formater l'affichage du poids
  const formatWeightDisplay = (weight: string | number): string => {
    const numWeight = typeof weight === 'string' ? parseFloat(weight) : weight;
    return numWeight.toFixed(2);
  };

  // Ajouter une pesée
  const handleConfirmWeight = useCallback(() => {
    if (isCurrentWeightValid) {
      const weight = parseFloat(currentWeight);
      const newEntry: WeightEntry = {
        weight,
        timestamp: new Date(),
      };
      setWeights(prev => [...prev, newEntry]);
      onClearWeight();
    }
  }, [isCurrentWeightValid, currentWeight, onClearWeight]);

  // Supprimer une pesée
  const handleDeleteWeight = useCallback((index: number) => {
    setWeights(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Valider le poids total (avec auto-ajout si nécessaire)
  const handleValidate = useCallback(() => {
    let finalWeights = [...weights];

    // Auto-ajouter le poids en cours si valide
    if (isCurrentWeightValid) {
      const weight = parseFloat(currentWeight);
      finalWeights.push({
        weight,
        timestamp: new Date(),
      });
    }

    const finalTotal = finalWeights.reduce((sum, entry) => sum + entry.weight, 0);
    onValidate(finalTotal);
  }, [weights, isCurrentWeightValid, currentWeight, onValidate]);

  // Raccourcis clavier - "+" pour ajouter, "Enter" pour valider
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorer si on est dans un input ou textarea
      if (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // "+" pour ajouter une pesée
      if (event.key === '+') {
        event.preventDefault();
        handleConfirmWeight();
      }

      // "Enter" pour valider le poids total
      if (event.key === 'Enter') {
        event.preventDefault();
        // Ne valider que s'il y a au moins une pesée OU un poids en cours
        if (weights.length > 0 || isCurrentWeightValid) {
          handleValidate();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleConfirmWeight, handleValidate, weights.length, isCurrentWeightValid]);

  return (
    <Container data-testid="multiple-weight-container">
      {/* Zone scrollable des pesées */}
      <WeightListArea>
        <WeightListTitle>Pesées effectuées ({weights.length})</WeightListTitle>
        {weights.length === 0 ? (
          <EmptyMessage>Aucune pesée enregistrée</EmptyMessage>
        ) : (
          <WeightList>
            {weights.map((weight, index) => (
              <WeightItem key={index} data-testid={`weight-item-${index}`}>
                <WeightValue>{formatWeightDisplay(weight.weight)} kg</WeightValue>
                <DeleteButton
                  onClick={() => handleDeleteWeight(index)}
                  data-testid={`delete-weight-${index}`}
                >
                  Supprimer
                </DeleteButton>
              </WeightItem>
            ))}
          </WeightList>
        )}
      </WeightListArea>

      {/* Footer avec les 2 blocs alignés avec le ticket */}
      <WeightFooter>
        {/* Bloc gauche : Poids total + Valider */}
        <TotalSection>
          <TotalLabel>Poids total</TotalLabel>
          <TotalValue data-testid="total-weight">
            {formatWeightDisplay(totalWeight)} kg
          </TotalValue>
          <ValidateButton
            onClick={handleValidate}
            disabled={weights.length === 0 && !isCurrentWeightValid}
            data-testid="validate-total-button"
          >
            Valider le poids total
          </ValidateButton>
        </TotalSection>

        {/* Bloc droit : Ajouter cette pesée */}
        <AddSection>
          <DisplayValue $isValid={!weightError} data-testid="weight-input">
            {currentWeight || '0'} kg
          </DisplayValue>
          <ErrorMessage>{weightError}</ErrorMessage>
          <AddButton
            onClick={handleConfirmWeight}
            disabled={!isCurrentWeightValid}
            data-testid="add-weight-button"
          >
            + Ajouter cette pesée
          </AddButton>
        </AddSection>
      </WeightFooter>
    </Container>
  );
};

// === STYLED COMPONENTS ===

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const WeightListArea = styled.div`
  flex: 1;
  overflow-y: auto;
  background: #f8f9fa;
  border: 2px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
  margin: 0.5rem 1rem 0 1rem; /* Marge en bas à 0 pour tester alignement */
  min-height: 0; /* CRITIQUE pour permettre le scroll */
  max-height: 100%; /* Empêche de grandir au-delà du conteneur */
`;

const WeightFooter = styled.div`
  flex-shrink: 0; /* CRITIQUE : Empêche la compression */
  padding: 1.5rem; /* Aligné avec TicketFooter */
  border-top: 2px solid #eee;
  background: #f8f9fa;
  border-radius: 0 0 8px 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.1);

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const WeightListTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: #2c5530;
  font-size: 1.1rem;
`;

const WeightList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const WeightItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem;
`;

const WeightValue = styled.span`
  font-weight: bold;
  color: #2c5530;
`;

const DeleteButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  
  &:hover {
    background: #c82333;
  }
`;

const EmptyMessage = styled.div`
  color: #666;
  font-style: italic;
  text-align: center;
  padding: 2rem;
`;

const TotalSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #e8f5e8;
  border: 2px solid #2c5530;
  border-radius: 6px;
  padding: 0.75rem;
`;

const TotalLabel = styled.div`
  font-weight: bold;
  color: #2c5530;
  font-size: 0.9rem;
`;

const TotalValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c5530;
`;

const ValidateButton = styled.button`
  background: #2c5530;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #1e3d21;
    transform: translateY(-1px);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const AddSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: white;
  border: 2px solid #2c5530;
  border-radius: 6px;
  padding: 0.75rem;
`;

const DisplayValue = styled.div<{ $isValid?: boolean }>`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => props.$isValid ? '#2c5530' : '#dc3545'};
  text-align: center;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.8rem;
  text-align: center;
  min-height: 1rem;
`;

const AddButton = styled.button`
  background: #2c5530;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #1e3d21;
    transform: translateY(-1px);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

export default MultipleWeightEntry;