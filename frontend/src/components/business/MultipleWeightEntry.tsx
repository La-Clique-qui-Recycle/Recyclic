import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import {
  applyDigit,
  applyDecimalPoint,
  formatWeightDisplay,
  handleAZERTYWeightKey,
} from '../../utils/weightMask';
import { createAZERTYHandler } from '../../utils/azertyKeyboard';

const Container = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.75rem;
  min-height: auto;
  max-height: 450px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
    min-height: auto;
    max-height: none;
  }
`;

// Colonne de gauche : Liste des pesées et validation
const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 280px;
  max-width: 350px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    min-width: 0;
    max-width: none;
    order: 2;
  }
`;

const WeightListContainer = styled.div`
  background: #f8f9fa;
  border: 2px solid #ddd;
  border-radius: 6px;
  padding: 0.5rem;
  flex: 1;
  max-height: 180px;
  overflow-y: auto;

  @media (max-width: 768px) {
    max-height: 140px;
    padding: 0.4rem;
  }
`;

const WeightListTitle = styled.h4`
  margin: 0 0 0.4rem 0;
  font-size: 0.85rem;
  color: #2c5530;

  @media (max-width: 768px) {
    font-size: 0.8rem;
    margin: 0 0 0.3rem 0;
  }
`;

const WeightItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem;
  background: white;
  border-radius: 4px;
  margin-bottom: 0.4rem;

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    padding: 0.3rem;
    margin-bottom: 0.3rem;
  }
`;

const WeightValue = styled.span`
  font-weight: 500;
  color: #333;
`;

const DeleteButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.2s;

  &:hover {
    background: #c82333;
  }

  @media (max-width: 768px) {
    padding: 0.15rem 0.4rem;
    font-size: 0.75rem;
  }
`;

const TotalContainer = styled.div`
  background: #e8f5e8;
  border: 2px solid #2c5530;
  border-radius: 8px;
  padding: 0.75rem;
  text-align: center;

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const TotalLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.2rem;

  @media (max-width: 768px) {
    font-size: 0.75rem;
    margin-bottom: 0.15rem;
  }
`;

const TotalValue = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #2c5530;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

// Colonne de droite : Saisie du poids
const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  min-width: 280px;

  @media (max-width: 768px) {
    min-width: 0;
    order: 1;
  }
`;

const AddWeightSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const AddButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #2c5530;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: background 0.2s;

  &:hover {
    background: #1e3d21;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const NumpadSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: white;
  border: 2px solid #2c5530;
  border-radius: 6px;
  padding: 0.75rem;
  flex: 1;

  @media (max-width: 768px) {
    padding: 0.5rem;
    gap: 0.4rem;
  }
`;

const DisplayValue = styled.div<{ $isValid?: boolean }>`
  background: #f8f9fa;
  border: 2px solid ${props => props.$isValid === false ? '#dc3545' : '#ddd'};
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
  transition: border-color 0.2s;

  @media (max-width: 768px) {
    padding: 0.4rem;
    font-size: 1rem;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.75rem;
  margin-top: 0.2rem;
  text-align: center;
  min-height: 0.9rem;

  @media (max-width: 768px) {
    font-size: 0.7rem;
    margin-top: 0.15rem;
    min-height: 0.75rem;
  }
`;

const NumpadContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  max-width: 420px; /* élargir le pavé numérique */
  width: 100%;
  margin: 0.5rem auto 0; /* compacter l'espace vertical */

  @media (max-width: 768px) {
    gap: 0.4rem;
    max-width: 360px;
  }
`;

const NumpadButton = styled.button`
  padding: 0.55rem; /* légèrement plus compact en hauteur */
  min-height: 42px; /* compacter la hauteur tout en restant confortable */
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.05rem; /* lisibilité accrue avec pavé plus large */
  font-weight: bold;
  transition: all 0.2s;

  &:hover {
    border-color: #2c5530;
    background: #f0f8f0;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 0.5rem;
    font-size: 1rem;
    min-height: 40px;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const ConfirmButton = styled.button`
  padding: 0.6rem 1.2rem;
  background: #2c5530;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  flex: 1;
  font-size: 0.9rem;

  &:hover {
    background: #1e3d21;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
`;

const CancelButton = styled.button`
  padding: 0.6rem 1.2rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  flex: 1;
  font-size: 0.9rem;

  &:hover {
    background: #5a6268;
  }

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 0.75rem;
  font-size: 0.9rem;

  @media (max-width: 768px) {
    padding: 0.5rem;
    font-size: 0.85rem;
  }
`;

const ValidateButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #2c5530;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: background 0.2s;

  &:hover {
    background: #1e3d21;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }
`;

export interface MultipleWeightEntryProps {
  onConfirm: (totalWeight: number) => void;
}

export const MultipleWeightEntry: React.FC<MultipleWeightEntryProps> = ({ onConfirm }) => {
  const [weights, setWeights] = useState<number[]>([]);
  const [currentWeight, setCurrentWeight] = useState<string>('');
  const [weightError, setWeightError] = useState<string>('');

  const totalWeight = useMemo(() => {
    return weights.reduce((sum, weight) => sum + weight, 0);
  }, [weights]);

  const handleValidate = () => {
    if (totalWeight > 0) {
      onConfirm(totalWeight);
    }
  };

  // Gestionnaire d'événements clavier pour support AZERTY
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorer si on est dans un input ou textarea
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key;
      
      // Gérer les touches AZERTY pour la saisie de poids
      if (/^[0-9]$/.test(key) || ['&', 'é', '"', "'", '(', '-', 'è', '_', 'ç', 'à'].includes(key)) {
        event.preventDefault();
        const newValue = handleAZERTYWeightKey(currentWeight, key, event);
        setCurrentWeight(newValue);
        validateWeight(newValue);
      }
      
      // Gérer les touches spéciales
      if (key === 'Backspace' || key === 'Delete') {
        event.preventDefault();
        setCurrentWeight(prev => prev.slice(0, -1));
      }
      
      if (key === '.' || key === ',') {
        event.preventDefault();
        const newValue = applyDecimalPoint(currentWeight);
        setCurrentWeight(newValue);
      }

      // Support de la touche "+" pour AJOUTER le poids (comme le bouton +)
      if (key === '+' || key === '=') {  // = car sur AZERTY, + nécessite Shift
        event.preventDefault();
        if (isCurrentWeightValid) {
          handleConfirmWeight();
        }
      }

      // Support de la touche Entrée pour VALIDER LE POIDS TOTAL et passer à l'étape suivante
      if (key === 'Enter') {
        event.preventDefault();
        // Si un poids est en cours de saisie, l'ajouter d'abord
        if (currentWeight && isCurrentWeightValid) {
          const weight = parseFloat(currentWeight);
          const newWeights = [...weights, weight];
          const newTotal = newWeights.reduce((sum, w) => sum + w, 0);
          // Valider directement le total et passer à l'étape suivante
          onConfirm(newTotal);
        } else if (weights.length > 0) {
          // Pas de poids en cours, valider le total existant
          handleValidate();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentWeight, weights, handleValidate]);

  const validateWeight = (value: string): boolean => {
    if (!value) {
      setWeightError('Poids requis');
      return false;
    }
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0 || num > 9999.99) {
      setWeightError('Poids doit être supérieur à 0 et inférieur à 9999.99 kg');
      return false;
    }
    setWeightError('');
    return true;
  };

  const isCurrentWeightValid = useMemo(() => {
    if (!currentWeight) return false;
    const num = parseFloat(currentWeight);
    return !isNaN(num) && num > 0 && num <= 9999.99;
  }, [currentWeight]);

  const handleNumberClick = (digit: string) => {
    const newValue = applyDigit(currentWeight, digit);
    setCurrentWeight(newValue);
    validateWeight(newValue);
  };

  const handleDecimalClick = () => {
    const newValue = applyDecimalPoint(currentWeight);
    setCurrentWeight(newValue);
  };

  const handleClear = () => {
    setCurrentWeight('');
    setWeightError('');
  };

  const handleAddWeight = () => {
    setCurrentWeight('');
    setWeightError('');
  };

  const handleConfirmWeight = () => {
    if (!isCurrentWeightValid) return;

    const weight = parseFloat(currentWeight);
    setWeights([...weights, weight]);
    setCurrentWeight('');
    setWeightError('');
  };

  const handleDeleteWeight = (index: number) => {
    setWeights(weights.filter((_, i) => i !== index));
  };

  return (
    <Container data-testid="multiple-weight-container">
      {/* Colonne de gauche : Liste des pesées et validation */}
      <LeftColumn>
        <WeightListContainer>
          <WeightListTitle>Pesées effectuées ({weights.length})</WeightListTitle>
          {weights.length === 0 ? (
            <EmptyMessage>Aucune pesée enregistrée</EmptyMessage>
          ) : (
            weights.map((weight, index) => (
              <WeightItem key={index} data-testid={`weight-item-${index}`}>
                <WeightValue>{formatWeightDisplay(weight.toString())} kg</WeightValue>
                <DeleteButton
                  onClick={() => handleDeleteWeight(index)}
                  data-testid={`delete-weight-${index}`}
                >
                  Supprimer
                </DeleteButton>
              </WeightItem>
            ))
          )}
        </WeightListContainer>

        <TotalContainer>
          <TotalLabel>Poids total</TotalLabel>
          <TotalValue data-testid="total-weight">
            {formatWeightDisplay(totalWeight.toString())} kg
          </TotalValue>
          <ValidateButton
            onClick={handleValidate}
            disabled={weights.length === 0}
            data-testid="validate-total-button"
            style={{ marginTop: '1rem' }}
          >
            Valider le poids total
          </ValidateButton>
        </TotalContainer>
      </LeftColumn>

      {/* Colonne de droite : Saisie du poids */}
      <RightColumn>
        <AddWeightSection>
          <NumpadSection>
            <h4 style={{ margin: '0 0 0.5rem 0', textAlign: 'center', color: '#2c5530', fontSize: '0.95rem' }}>
              Saisir le poids (kg)
            </h4>
            <DisplayValue $isValid={!weightError} data-testid="weight-input">
              {formatWeightDisplay(currentWeight) || '0'} kg
            </DisplayValue>
            <ErrorMessage>{weightError}</ErrorMessage>
            <NumpadContainer>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '.'].map((item) => (
                <NumpadButton
                  key={item}
                  onClick={() => {
                    if (item === '⌫') {
                      // Backspace pour supprimer le dernier caractère
                      setCurrentWeight(prev => prev.slice(0, -1));
                    } else if (item === '.') {
                      handleDecimalClick();
                    } else {
                      handleNumberClick(item.toString());
                    }
                  }}
                  data-testid={`numpad-${item}`}
                >
                  {item}
                </NumpadButton>
              ))}
              <NumpadButton
                onClick={handleConfirmWeight}
                disabled={!isCurrentWeightValid}
                data-testid="confirm-weight-button"
                style={{
                  gridColumn: 'span 3',
                  opacity: !isCurrentWeightValid ? 0.5 : 1,
                  cursor: !isCurrentWeightValid ? 'not-allowed' : 'pointer',
                }}
              >
                +
              </NumpadButton>
            </NumpadContainer>
          </NumpadSection>
        </AddWeightSection>
      </RightColumn>
    </Container>
  );
};

export default MultipleWeightEntry;
