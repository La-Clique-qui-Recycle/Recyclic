import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import CategorySelector from './CategorySelector';
import { useCategoryStore } from '../../stores/categoryStore';
import {
  applyDigit,
  applyDecimalPoint,
  formatWeightDisplay,
} from '../../utils/weightMask';

const ModeSelector = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ModeButton = styled.button<{ $active?: boolean }>`
  padding: 0.75rem 1.5rem;
  border: 2px solid ${props => props.$active ? '#2c5530' : '#ddd'};
  background: ${props => props.$active ? '#2c5530' : 'white'};
  color: ${props => props.$active ? 'white' : '#333'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;

  &:hover {
    border-color: #2c5530;
    background: ${props => props.$active ? '#2c5530' : '#f0f8f0'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModeContent = styled.div`
  min-height: 300px;
`;

const ModeTitle = styled.h2`
  margin: 0 0 1rem 0;
  color: #2c5530;
`;

const NumpadContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  max-width: 300px;
  margin: 2rem 0;
`;

const NumpadButton = styled.button`
  padding: 1rem;
  border: 2px solid #ddd;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  transition: all 0.2s;

  &:hover {
    border-color: #2c5530;
    background: #f0f8f0;
  }
`;

const DisplayValue = styled.div<{ $isValid?: boolean }>`
  background: #f8f9fa;
  border: 2px solid ${props => props.$isValid === false ? '#dc3545' : '#ddd'};
  border-radius: 8px;
  padding: 1rem;
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  margin: 1rem 0;
  transition: border-color 0.2s;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  text-align: center;
  min-height: 1.25rem;
`;

export interface SaleItemData {
  category: string;
  weight: number;
  price: number;
  total: number;
}

export interface SaleWizardProps {
  onItemComplete: (item: SaleItemData) => void;
}

type WizardStep = 'category' | 'weight' | 'price';

export const SaleWizard: React.FC<SaleWizardProps> = ({ onItemComplete }) => {
  const { getCategoryById } = useCategoryStore();

  const [currentStep, setCurrentStep] = useState<WizardStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [weightError, setWeightError] = useState<string>('');
  const [priceError, setPriceError] = useState<string>('');

  // Validation functions
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

  const validatePrice = (value: string): boolean => {
    if (!value) {
      setPriceError('Prix requis');
      return false;
    }
    const num = parseFloat(value);
    if (isNaN(num) || num < 0.01 || num > 9999.99) {
      setPriceError('Prix doit être entre 0.01€ et 9999.99€');
      return false;
    }
    setPriceError('');
    return true;
  };

  const isWeightValid = useMemo(() => {
    if (!weight) return false;
    const num = parseFloat(weight);
    return !isNaN(num) && num > 0 && num <= 9999.99;
  }, [weight]);

  const isPriceValid = useMemo(() => {
    if (!price) return false;
    const num = parseFloat(price);
    return !isNaN(num) && num >= 0.01 && num <= 9999.99;
  }, [price]);

  // Handlers
  const handleNumberClick = (digit: string) => {
    if (currentStep === 'weight') {
      const newValue = applyDigit(weight, digit);
      setWeight(newValue);
      validateWeight(newValue);
    } else if (currentStep === 'price') {
      const newValue = price + digit;
      if (/^\d*\.?\d{0,2}$/.test(newValue) && parseFloat(newValue || '0') <= 9999.99) {
        setPrice(newValue);
        validatePrice(newValue);
      }
    }
  };

  const handleDecimalClick = () => {
    if (currentStep === 'weight') {
      const newValue = applyDecimalPoint(weight);
      setWeight(newValue);
    } else if (currentStep === 'price') {
      const newValue = price.includes('.') ? price : price + '.';
      setPrice(newValue);
    }
  };

  const handleClear = () => {
    if (currentStep === 'weight') {
      setWeight('');
      setWeightError('');
    } else if (currentStep === 'price') {
      setPrice('');
      setPriceError('');
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentStep('weight');
  };

  const handleWeightConfirm = () => {
    if (!isWeightValid) return;

    const category = getCategoryById(selectedCategory);

    // If category has a fixed price, skip to completion
    if (category?.price !== null && category?.price !== undefined) {
      const numWeight = parseFloat(weight);
      const fixedPrice = category.price;

      onItemComplete({
        category: selectedCategory,
        weight: numWeight,
        price: fixedPrice,
        total: fixedPrice,
      });

      // Reset wizard
      resetWizard();
    } else {
      // Otherwise, go to price step
      setCurrentStep('price');
    }
  };

  const handlePriceConfirm = () => {
    if (!isPriceValid || !isWeightValid) return;

    const numWeight = parseFloat(weight);
    const numPrice = parseFloat(price);

    onItemComplete({
      category: selectedCategory,
      weight: numWeight,
      price: numPrice,
      total: numPrice,
    });

    // Reset wizard
    resetWizard();
  };

  const resetWizard = () => {
    setSelectedCategory('');
    setWeight('');
    setPrice('');
    setWeightError('');
    setPriceError('');
    setCurrentStep('category');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'category':
        return (
          <ModeContent>
            <ModeTitle>Sélectionner la catégorie EEE</ModeTitle>
            <CategorySelector
              onSelect={handleCategorySelect}
              selectedCategory={selectedCategory}
            />
          </ModeContent>
        );

      case 'weight':
        return (
          <ModeContent>
            <ModeTitle>Poids (kg)</ModeTitle>
            <DisplayValue $isValid={!weightError} data-testid="weight-input">
              {formatWeightDisplay(weight) || '0'} kg
            </DisplayValue>
            <ErrorMessage>{weightError}</ErrorMessage>
            <NumpadContainer>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '.'].map((item) => (
                <NumpadButton
                  key={item}
                  onClick={() => {
                    if (item === 'C') {
                      handleClear();
                    } else if (item === '.') {
                      handleDecimalClick();
                    } else {
                      handleNumberClick(item.toString());
                    }
                  }}
                >
                  {item}
                </NumpadButton>
              ))}
              <NumpadButton
                disabled={!isWeightValid}
                style={{
                  opacity: !isWeightValid ? 0.5 : 1,
                  cursor: !isWeightValid ? 'not-allowed' : 'pointer',
                  gridColumn: 'span 3'
                }}
                data-testid="validate-weight-button"
                data-isvalid={String(!!isWeightValid)}
                onClick={handleWeightConfirm}
              >
                Valider
              </NumpadButton>
            </NumpadContainer>
          </ModeContent>
        );

      case 'price':
        return (
          <ModeContent>
            <ModeTitle>Prix unitaire (€)</ModeTitle>
            <DisplayValue $isValid={!priceError} data-testid="price-input">
              {price || '0'}
            </DisplayValue>
            <ErrorMessage>{priceError}</ErrorMessage>
            <NumpadContainer>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '.'].map((item) => (
                <NumpadButton
                  key={item}
                  onClick={() => {
                    if (item === 'C') {
                      handleClear();
                    } else {
                      handleNumberClick(item.toString());
                    }
                  }}
                >
                  {item}
                </NumpadButton>
              ))}
              <NumpadButton
                disabled={!isPriceValid}
                style={{
                  opacity: !isPriceValid ? 0.5 : 1,
                  cursor: !isPriceValid ? 'not-allowed' : 'pointer',
                  gridColumn: 'span 3'
                }}
                data-testid="add-item-button"
                data-isvalid={String(!!isPriceValid)}
                onClick={handlePriceConfirm}
              >
                Valider
              </NumpadButton>
            </NumpadContainer>
          </ModeContent>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div>
        <h3>Mode de saisie</h3>
        <ModeSelector>
          <ModeButton
            $active={currentStep === 'category'}
            data-active={currentStep === 'category'}
            onClick={() => setCurrentStep('category')}
          >
            Catégorie
          </ModeButton>
          <ModeButton
            $active={currentStep === 'weight'}
            data-active={currentStep === 'weight'}
            disabled={!selectedCategory}
          >
            Poids
          </ModeButton>
          <ModeButton
            $active={currentStep === 'price'}
            data-active={currentStep === 'price'}
            disabled={!weight}
          >
            Prix
          </ModeButton>
        </ModeSelector>
      </div>

      {renderStepContent()}
    </div>
  );
};

export default SaleWizard;
