import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import CategorySelector from './CategorySelector';
import MultipleWeightEntry from './MultipleWeightEntry';
import StagingItem from './StagingItem';
import { useCategoryStore } from '../../stores/categoryStore';
import {
  applyDigit,
  applyDecimalPoint,
  formatWeightDisplay,
  handleAZERTYWeightKey,
} from '../../utils/weightMask';
import { computeLineAmount, formatLineAmount } from '../../utils/lineAmount';
import { createAZERTYHandler } from '../../utils/azertyKeyboard';

// Removed TwoColumnLayout - numpad is now in parent Sale.tsx

const WizardContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModeSelector = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const CategoryContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin: 0.5rem 0;
`;

const CategoryButton = styled.button<{ $selected?: boolean }>`
  padding: 0.75rem;
  min-height: 44px;
  border: 2px solid ${props => props.$selected ? '#2c5530' : '#ddd'};
  background: ${props => props.$selected ? '#e8f5e8' : 'white'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;

  &:hover {
    border-color: #2c5530;
    background: #f0f8f0;
  }

  &:focus {
    outline: 2px solid #2c5530;
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CategoryName = styled.div`
  font-weight: bold;
  margin-bottom: 0.25rem;
`;

const CategoryDescription = styled.div`
  font-size: 0.85rem;
  color: #666;
`;

const ModeButton = styled.button<{ $active?: boolean }>`
  padding: 0.6rem 1.25rem;
  min-height: 44px;
  border: 2px solid ${props => props.$active ? '#2c5530' : '#ddd'};
  background: ${props => props.$active ? '#2c5530' : 'white'};
  color: ${props => props.$active ? 'white' : '#333'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  font-size: 0.9rem;

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
  min-height: 0; /* IMPORTANT pour flexbox */
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* EMPÊCHE le débordement */
`;

const ModeTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #2c5530;
  font-size: 1.1rem;
`;

const StepContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StepTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #2c5530;
  font-size: 1.2rem;
  text-align: center;
`;

const DisplayValue = styled.div<{ $isValid?: boolean }>`
  background: #f8f9fa;
  border: 2px solid ${props => props.$isValid === false ? '#dc3545' : '#ddd'};
  border-radius: 8px;
  padding: 1rem;
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  margin: 0.5rem 0;
  transition: border-color 0.2s;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  text-align: center;
  min-height: 1.25rem;
`;

const HelpMessage = styled.div`
  color: #6c757d;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  text-align: center;
  min-height: 1rem;
`;

const InfoSection = styled.div`
  background: #f8f9fa;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  flex: 1;
`;

const ValidateButton = styled.button`
  padding: 1rem 2rem;
  background: #2c5530;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1.1rem;
  transition: background 0.2s;
  margin-top: auto;

  &:hover {
    background: #1e3d21;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export interface SaleItemData {
  category: string;
  subcategory?: string;
  quantity: number;
  weight: number;
  price: number;
  total: number;
}

export interface NumpadCallbacks {
  quantityValue: string;
  quantityError: string;
  priceValue: string;
  priceError: string;
  weightValue: string;
  weightError: string;
  setQuantityValue: (value: string) => void;
  setQuantityError: (error: string) => void;
  setPriceValue: (value: string) => void;
  setPriceError: (error: string) => void;
  setWeightValue: (value: string) => void;
  setWeightError: (error: string) => void;
  setMode: (mode: 'quantity' | 'price' | 'weight' | 'idle') => void;
}

export interface SaleWizardProps {
  onItemComplete: (item: SaleItemData) => void;
  numpadCallbacks: NumpadCallbacks;
  currentMode: 'quantity' | 'price' | 'weight' | 'idle';
}

type WizardStep = 'category' | 'subcategory' | 'quantity' | 'weight' | 'price';

export const SaleWizard: React.FC<SaleWizardProps> = ({ onItemComplete, numpadCallbacks, currentMode }) => {
  const { getCategoryById, activeCategories } = useCategoryStore();

  const [currentStep, setCurrentStep] = useState<WizardStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [weightError, setWeightError] = useState<string>('');

  // Use numpad state from parent - now properly separated
  const quantity = numpadCallbacks.quantityValue;
  const quantityError = numpadCallbacks.quantityError;
  const price = numpadCallbacks.priceValue;
  const priceError = numpadCallbacks.priceError;

  // Keyboard handling removed - numpad in parent handles all input


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
      numpadCallbacks.setPriceError('Prix requis');
      return false;
    }
    const num = parseFloat(value);
    if (isNaN(num) || num < 0.01 || num > 9999.99) {
      numpadCallbacks.setPriceError('Prix doit être entre 0.01€ et 9999.99€');
      return false;
    }
    numpadCallbacks.setPriceError('');
    return true;
  };

  const validateQuantity = (value: string): boolean => {
    if (!value) {
      numpadCallbacks.setQuantityError('Quantité requise');
      return false;
    }
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0 || num > 9999 || !Number.isInteger(parseFloat(value))) {
      numpadCallbacks.setQuantityError('Quantité doit être un entier positif entre 1 et 9999');
      return false;
    }
    numpadCallbacks.setQuantityError('');
    return true;
  };

  const isQuantityValid = useMemo(() => {
    if (!quantity) return false;
    const num = parseInt(quantity, 10);
    return !isNaN(num) && num > 0 && num <= 9999 && Number.isInteger(parseFloat(quantity));
  }, [quantity]);

  const isWeightValid = useMemo(() => {
    if (!weight) return false;
    const num = parseFloat(weight);
    return !isNaN(num) && num > 0 && num <= 9999.99;
  }, [weight]);

  const isPriceValid = useMemo(() => {
    if (!price) return false;
    const num = parseFloat(price);
    if (isNaN(num) || num < 0.01 || num > 9999.99) return false;
    const cat = getCategoryById(selectedCategory);
    // Validation entre price(min) et max_price si max_price>0
    const hasMax = cat?.max_price != null && Number(cat.max_price) > 0;
    const hasMin = cat?.price != null;
    if (hasMax && hasMin) {
      const min = Number(cat!.price);
      const max = Number(cat!.max_price);
      return num >= min && num <= max;
    }
    return true;
  }, [price, selectedCategory, getCategoryById]);

  // Removed handleNumberClick, handleDecimalClick, handleClear - now handled by parent numpad

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);

    // Check if this category has children (subcategories)
    const hasChildren = activeCategories.some(cat => cat.parent_id === categoryId);

    if (hasChildren) {
      setCurrentStep('subcategory');
      numpadCallbacks.setMode('idle');
    } else {
      // No children, go directly to weight
      setCurrentStep('weight');
      // Initialize numpad for weight input
      numpadCallbacks.setWeightValue('');
      numpadCallbacks.setWeightError('');
      numpadCallbacks.setMode('weight');
    }
  };

  // Navigation non-linéaire - permet de sauter à n'importe quelle étape
  const goToStep = (step: WizardStep) => {
    // Validation des prérequis pour chaque étape
    switch (step) {
      case 'category':
        setCurrentStep('category');
        numpadCallbacks.setMode('idle');
        break;
      case 'subcategory':
        if (selectedCategory && activeCategories.some(cat => cat.parent_id === selectedCategory)) {
          setCurrentStep('subcategory');
          numpadCallbacks.setMode('idle');
        }
        break;
      case 'weight':
        if (selectedCategory) {
          setCurrentStep('weight');
          numpadCallbacks.setMode('weight');
        }
        break;
      case 'quantity':
        if (weight) {
          setCurrentStep('quantity');
          numpadCallbacks.setMode('quantity');
        }
        break;
      case 'price':
        if (quantity) {
          setCurrentStep('price');
          numpadCallbacks.setMode('price');
        }
        break;
    }
    
    // Gestion du focus pour l'accessibilité
    setTimeout(() => {
      const focusableElement = document.querySelector(`[data-step="${step}"] input, [data-step="${step}"] button, [data-step="${step}"] [tabindex="0"]`);
      if (focusableElement instanceof HTMLElement) {
        focusableElement.focus();
      }
    }, 100);
  };

  const handleStepNavigation = (step: WizardStep) => {
    goToStep(step);
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
    setCurrentStep('weight');
    // Initialize numpad for weight input
    numpadCallbacks.setWeightValue('');
    numpadCallbacks.setWeightError('');
    numpadCallbacks.setMode('weight');
  };

  const handleQuantityConfirm = () => {
    if (!isQuantityValid) return;

    // Use subcategory if selected, otherwise use category
    const actualCategoryId = selectedSubcategory || selectedCategory;
    const category = getCategoryById(actualCategoryId);

    // Nouvelle logique:
    // - Si max_price > 0 => demander saisie du prix (aller à l'étape price)
    // - Sinon, utiliser price (prix minimum) comme prix final et sauter l'étape
    const hasMaxPrice = category?.max_price != null && Number(category.max_price) > 0;
    if (hasMaxPrice) {
      setCurrentStep('price');
      // Initialize numpad for price input
      numpadCallbacks.setPriceValue('');
      numpadCallbacks.setPriceError('');
      numpadCallbacks.setMode('price');
      return;
    }

    if (category?.price != null) {
      const numQuantity = parseInt(quantity, 10);
      const numWeight = parseFloat(weight);
      const unitPrice = Number(category.price);
      const totalPrice = unitPrice * numQuantity;
      onItemComplete({
        category: selectedCategory,
        subcategory: selectedSubcategory || undefined,
        quantity: numQuantity,
        weight: numWeight,
        price: unitPrice,
        total: totalPrice,
      });
      resetWizard();
      return;
    }

    // Par défaut si pas de price défini, demander le prix
    setCurrentStep('price');
    // Initialize numpad for price input
    numpadCallbacks.setPriceValue('');
    numpadCallbacks.setPriceError('');
    numpadCallbacks.setMode('price');
  };

  const handleWeightConfirm = (totalWeight: number) => {
    // Store the total weight in state
    setWeight(totalWeight.toString());
    setCurrentStep('quantity');
    // Initialize numpad for quantity input
    numpadCallbacks.setQuantityValue('');
    numpadCallbacks.setQuantityError('');
    numpadCallbacks.setMode('quantity');
  };

  const handlePriceConfirm = () => {
    if (!isPriceValid || !isWeightValid) return;

    const numWeight = parseFloat(weight);
    const numPrice = parseFloat(price);
    const numQuantity = parseInt(quantity, 10);
    const totalPrice = numPrice * numQuantity;

    onItemComplete({
      category: selectedCategory,
      subcategory: selectedSubcategory || undefined,
      quantity: numQuantity,
      weight: numWeight,
      price: numPrice,
      total: totalPrice,
    });

    // Reset wizard
    resetWizard();
  };

  const resetWizard = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setWeight('');
    setWeightError('');
    numpadCallbacks.setQuantityValue('');
    numpadCallbacks.setQuantityError('');
    numpadCallbacks.setPriceValue('');
    numpadCallbacks.setPriceError('');
    numpadCallbacks.setWeightValue('');
    numpadCallbacks.setWeightError('');
    numpadCallbacks.setMode('idle');
    setCurrentStep('category');
  };

  // Gestionnaire séparé pour la touche Entrée
  useEffect(() => {
    const handleEnterKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) {
        return; // Ignorer si on est dans un input
      }
      
      if (event.key === 'Enter') {
        event.preventDefault();
        if (currentStep === 'quantity' && isQuantityValid) {
          handleQuantityConfirm();
        } else if (currentStep === 'price' && isPriceValid) {
          handlePriceConfirm();
        }
      }
    };

    document.addEventListener('keydown', handleEnterKey);
    return () => document.removeEventListener('keydown', handleEnterKey);
  }, [currentStep, isQuantityValid, isPriceValid, handleQuantityConfirm, handlePriceConfirm]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 'category':
        return (
          <ModeContent data-step="category">
            <CategorySelector
              onSelect={handleCategorySelect}
              selectedCategory={selectedCategory}
            />
          </ModeContent>
        );

      case 'subcategory': {
        const subcategories = activeCategories.filter(cat => cat.parent_id === selectedCategory);
        return (
          <ModeContent data-step="subcategory">
            <ModeTitle>Sélectionner la sous-catégorie</ModeTitle>
            <CategoryContainer role="group" aria-label="Sélection de sous-catégorie">
              {subcategories.map((subcat) => {
                // Format price display
                const formatPrice = () => {
                  if (subcat.price && subcat.max_price && Number(subcat.max_price) > 0) {
                    const minPrice = Number(subcat.price).toFixed(2);
                    const maxPrice = Number(subcat.max_price).toFixed(2);
                    return `${minPrice}€ - ${maxPrice}€`;
                  } else if (subcat.price) {
                    return `${Number(subcat.price).toFixed(2)}€`;
                  }
                  return 'Prix non défini';
                };

                return (
                  <CategoryButton
                    key={subcat.id}
                    $selected={selectedSubcategory === subcat.id}
                    onClick={() => handleSubcategorySelect(subcat.id)}
                    data-testid={`subcategory-${subcat.id}`}
                    data-selected={selectedSubcategory === subcat.id ? 'true' : 'false'}
                    aria-pressed={selectedSubcategory === subcat.id}
                    aria-label={`Sélectionner la sous-catégorie ${subcat.name}`}
                  >
                    <CategoryName>{subcat.name}</CategoryName>
                    <CategoryDescription>{formatPrice()}</CategoryDescription>
                  </CategoryButton>
                );
              })}
            </CategoryContainer>
          </ModeContent>
        );
      }

      case 'quantity':
        // Calcul du prix total en temps réel
        const actualCategoryId = selectedSubcategory || selectedCategory;
        const category = getCategoryById(actualCategoryId);
        const unitPrice = category?.price ? Number(category.price) : 0;
        const quantityNum = quantity ? parseInt(quantity, 10) : 0;
        const lineAmount = computeLineAmount(unitPrice, quantityNum);

        return (
          <StepContent data-step="quantity">
            <StepTitle>Quantité</StepTitle>
            <DisplayValue $isValid={!quantityError} data-testid="quantity-input">
              {quantity || '0'}
            </DisplayValue>
            <ErrorMessage>{quantityError}</ErrorMessage>

            {category?.price && !category?.max_price && quantity && isQuantityValid && (
              <InfoSection>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                  Calcul automatique
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c5530' }}>
                  {formatLineAmount(unitPrice)} × {quantity} = {formatLineAmount(lineAmount)}
                </div>
              </InfoSection>
            )}

            <ValidateButton
              disabled={!isQuantityValid}
              onClick={handleQuantityConfirm}
              data-testid="validate-quantity-button"
            >
              Valider la quantité
            </ValidateButton>
          </StepContent>
        );

      case 'weight':
        return (
          <ModeContent data-step="weight">
            <MultipleWeightEntry
              onValidate={handleWeightConfirm}
              currentWeight={numpadCallbacks.weightValue}
              weightError={numpadCallbacks.weightError}
              onClearWeight={() => {
                numpadCallbacks.setWeightValue('');
                numpadCallbacks.setWeightError('');
              }}
            />
          </ModeContent>
        );

      case 'price':
        return (
          <StepContent data-step="price">
            <StepTitle>Prix unitaire</StepTitle>
            <DisplayValue $isValid={!priceError} data-testid="price-input">
              {price || '0'} €
            </DisplayValue>

            {(() => {
              const cat = getCategoryById(selectedCategory);
              const hasMax = cat?.max_price != null && Number(cat.max_price) > 0;
              const hasMin = cat?.price != null;
              if (hasMin && hasMax) {
                const min = Number(cat!.price).toFixed(2);
                const max = Number(cat!.max_price).toFixed(2);
                return (
                  <InfoSection>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                      Fourchette de prix autorisée
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2c5530' }}>
                      {min} € – {max} €
                    </div>
                  </InfoSection>
                );
              }
              return null;
            })()}

            <ErrorMessage>{priceError}</ErrorMessage>

            <ValidateButton
              disabled={!isPriceValid}
              onClick={handlePriceConfirm}
              data-testid="add-item-button"
            >
              Valider le prix
            </ValidateButton>
          </StepContent>
        );

      default:
        return null;
    }
  };

  // Build staging item data for breadcrumb
  const stagingItemData = useMemo(() => {
    const categoryName = selectedCategory ? getCategoryById(selectedCategory)?.name : undefined;
    const subcategoryName = selectedSubcategory ? getCategoryById(selectedSubcategory)?.name : undefined;
    const quantityNum = quantity ? parseInt(quantity, 10) : undefined;
    const weightNum = weight ? parseFloat(weight) : undefined;
    const priceNum = price ? parseFloat(price) : undefined;

    return {
      categoryName,
      subcategoryName,
      quantity: quantityNum,
      weight: weightNum,
      price: priceNum,
    };
  }, [selectedCategory, selectedSubcategory, quantity, weight, price, getCategoryById]);

  return (
    <WizardContainer>
      <div>
        <ModeSelector>
          <ModeButton
            $active={currentStep === 'category'}
            data-active={currentStep === 'category'}
            onClick={() => handleStepNavigation('category')}
          >
            Catégorie
          </ModeButton>
          {activeCategories.some(cat => cat.parent_id === selectedCategory) && (
            <ModeButton
              $active={currentStep === 'subcategory'}
              data-active={currentStep === 'subcategory'}
              disabled={!selectedCategory}
              onClick={() => handleStepNavigation('subcategory')}
            >
              Sous-catégorie
            </ModeButton>
          )}
          <ModeButton
            $active={currentStep === 'weight'}
            data-active={currentStep === 'weight'}
            disabled={!selectedCategory}
            onClick={() => handleStepNavigation('weight')}
          >
            Poids
          </ModeButton>
          <ModeButton
            $active={currentStep === 'quantity'}
            data-active={currentStep === 'quantity'}
            disabled={!weight}
            onClick={() => handleStepNavigation('quantity')}
          >
            Quantité
          </ModeButton>
          <ModeButton
            $active={currentStep === 'price'}
            data-active={currentStep === 'price'}
            disabled={!quantity}
            onClick={() => handleStepNavigation('price')}
          >
            Prix
          </ModeButton>
        </ModeSelector>
      </div>

      <StagingItem data={stagingItemData} />

      {renderStepContent()}
    </WizardContainer>
  );
};

export default SaleWizard;
