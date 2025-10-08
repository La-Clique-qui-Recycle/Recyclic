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
  min-height: auto;
`;

const ModeTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #2c5530;
  font-size: 1.1rem;
`;

const NumpadContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  max-width: 300px;
  margin: 0.75rem 0;
`;

const NumpadButton = styled.button`
  padding: 0.75rem;
  min-height: 44px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1rem;
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
  padding: 0.75rem;
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  margin: 0.5rem 0;
  transition: border-color 0.2s;
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

export interface SaleItemData {
  category: string;
  subcategory?: string;
  quantity: number;
  weight: number;
  price: number;
  total: number;
}

export interface SaleWizardProps {
  onItemComplete: (item: SaleItemData) => void;
}

type WizardStep = 'category' | 'subcategory' | 'quantity' | 'weight' | 'price';

export const SaleWizard: React.FC<SaleWizardProps> = ({ onItemComplete }) => {
  const { getCategoryById, activeCategories } = useCategoryStore();

  const [currentStep, setCurrentStep] = useState<WizardStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [weightError, setWeightError] = useState<string>('');
  const [priceError, setPriceError] = useState<string>('');
  const [quantityError, setQuantityError] = useState<string>('');

  // Gestionnaire d'événements clavier pour support AZERTY
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorer si on est dans un input ou textarea
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key;
      
      // Gérer les touches AZERTY pour les étapes numériques
      if (currentStep === 'quantity' || currentStep === 'weight' || currentStep === 'price') {
        if (/^[0-9]$/.test(key) || ['&', 'é', '"', "'", '(', '-', 'è', '_', 'ç', 'à'].includes(key)) {
          event.preventDefault();
          
          if (currentStep === 'quantity') {
            const newValue = quantity + (key === '&' ? '1' : 
                                        key === 'é' ? '2' : 
                                        key === '"' ? '3' : 
                                        key === "'" ? '4' : 
                                        key === '(' ? '5' : 
                                        key === '-' ? '6' : 
                                        key === 'è' ? '7' : 
                                        key === '_' ? '8' : 
                                        key === 'ç' ? '9' : 
                                        key === 'à' ? '0' : key);
            if (/^\d*$/.test(newValue) && parseInt(newValue || '0', 10) <= 9999) {
              setQuantity(newValue);
              validateQuantity(newValue);
            }
          } else if (currentStep === 'weight') {
            const newValue = handleAZERTYWeightKey(weight, key, event);
            setWeight(newValue);
            validateWeight(newValue);
          } else if (currentStep === 'price') {
            const newValue = price + (key === '&' ? '1' : 
                                     key === 'é' ? '2' : 
                                     key === '"' ? '3' : 
                                     key === "'" ? '4' : 
                                     key === '(' ? '5' : 
                                     key === '-' ? '6' : 
                                     key === 'è' ? '7' : 
                                     key === '_' ? '8' : 
                                     key === 'ç' ? '9' : 
                                     key === 'à' ? '0' : key);
            if (/^\d*\.?\d{0,2}$/.test(newValue) && parseFloat(newValue || '0') <= 9999.99) {
              setPrice(newValue);
              validatePrice(newValue);
            }
          }
        }
        
        // Gérer les touches spéciales
        if (key === 'Backspace' || key === 'Delete') {
          event.preventDefault();
          if (currentStep === 'quantity') {
            setQuantity(prev => prev.slice(0, -1));
          } else if (currentStep === 'weight') {
            setWeight(prev => prev.slice(0, -1));
          } else if (currentStep === 'price') {
            setPrice(prev => prev.slice(0, -1));
          }
        }
        
        if (key === '.' || key === ',') {
          event.preventDefault();
          if (currentStep === 'weight') {
            const newValue = applyDecimalPoint(weight);
            setWeight(newValue);
          } else if (currentStep === 'price') {
            const newValue = price.includes('.') ? price : price + '.';
            setPrice(newValue);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, quantity, weight, price]);


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

  const validateQuantity = (value: string): boolean => {
    if (!value) {
      setQuantityError('Quantité requise');
      return false;
    }
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0 || num > 9999 || !Number.isInteger(parseFloat(value))) {
      setQuantityError('Quantité doit être un entier positif entre 1 et 9999');
      return false;
    }
    setQuantityError('');
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

  // Handlers
  const handleNumberClick = (digit: string) => {
    if (currentStep === 'quantity') {
      const newValue = quantity + digit;
      if (/^\d*$/.test(newValue) && parseInt(newValue || '0', 10) <= 9999) {
        setQuantity(newValue);
        validateQuantity(newValue);
      }
    } else if (currentStep === 'weight') {
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
    if (currentStep === 'quantity') {
      setQuantity('');
      setQuantityError('');
    } else if (currentStep === 'weight') {
      setWeight('');
      setWeightError('');
    } else if (currentStep === 'price') {
      setPrice('');
      setPriceError('');
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);

    // Check if this category has children (subcategories)
    const hasChildren = activeCategories.some(cat => cat.parent_id === categoryId);

    if (hasChildren) {
      setCurrentStep('subcategory');
    } else {
      // No children, go directly to weight
      setCurrentStep('weight');
    }
  };

  // Navigation non-linéaire - permet de sauter à n'importe quelle étape
  const goToStep = (step: WizardStep) => {
    // Validation des prérequis pour chaque étape
    switch (step) {
      case 'category':
        setCurrentStep('category');
        break;
      case 'subcategory':
        if (selectedCategory && activeCategories.some(cat => cat.parent_id === selectedCategory)) {
          setCurrentStep('subcategory');
        }
        break;
      case 'weight':
        if (selectedCategory) {
          setCurrentStep('weight');
        }
        break;
      case 'quantity':
        if (weight) {
          setCurrentStep('quantity');
        }
        break;
      case 'price':
        if (quantity) {
          setCurrentStep('price');
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
  };

  const handleWeightConfirm = (totalWeight: number) => {
    // Store the total weight in state
    setWeight(totalWeight.toString());
    setCurrentStep('quantity');
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
    setQuantity('');
    setWeight('');
    setPrice('');
    setQuantityError('');
    setWeightError('');
    setPriceError('');
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
          <ModeContent data-step="quantity">
            <ModeTitle>Quantité</ModeTitle>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
              {/* Colonne de gauche : Affichage et pavé numérique */}
              <div style={{ flex: 1 }}>
                <DisplayValue $isValid={!quantityError} data-testid="quantity-input">
                  {quantity || '0'}
                </DisplayValue>
                <ErrorMessage>{quantityError}</ErrorMessage>

                <NumpadContainer>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, 'C'].map((item) => (
                    <NumpadButton
                      key={item}
                      onClick={() => {
                        if (item === 'C') {
                          handleClear();
                        } else if (item === '⌫') {
                          // Backspace pour supprimer le dernier caractère
                          setQuantity(prev => prev.slice(0, -1));
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
                    disabled={!isQuantityValid}
                    style={{
                      opacity: !isQuantityValid ? 0.5 : 1,
                      cursor: !isQuantityValid ? 'not-allowed' : 'pointer',
                      gridColumn: 'span 3'
                    }}
                    data-testid="validate-quantity-button"
                    data-isvalid={String(!!isQuantityValid)}
                    onClick={handleQuantityConfirm}
                  >
                    Valider
                  </NumpadButton>
                </NumpadContainer>
              </div>

              {/* Colonne de droite : Calcul en temps réel */}
              <div style={{ flex: 1, minWidth: '250px' }}>
                {category?.price && quantity && isQuantityValid && (
                  <div style={{ 
                    background: '#e8f5e8', 
                    border: '2px solid #2c5530', 
                    borderRadius: '8px', 
                    padding: '1rem', 
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                      Calcul automatique
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c5530' }}>
                      {formatLineAmount(unitPrice)} × {quantity} = {formatLineAmount(lineAmount)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ModeContent>
        );

      case 'weight':
        return (
          <ModeContent data-step="weight">
            <MultipleWeightEntry onConfirm={handleWeightConfirm} />
          </ModeContent>
        );

      case 'price':
        return (
          <ModeContent data-step="price">
            <ModeTitle>Prix unitaire (€)</ModeTitle>
            <DisplayValue $isValid={!priceError} data-testid="price-input" aria-label="Saisie du prix unitaire">
              {price || '0'}
            </DisplayValue>
            {/* Aide sur la plage autorisée si disponible */}
            {(() => {
              const cat = getCategoryById(selectedCategory);
              const hasMax = cat?.max_price != null && Number(cat.max_price) > 0;
              const hasMin = cat?.price != null;
              if (hasMin && hasMax) {
                const min = Number(cat!.price).toFixed(2);
                const max = Number(cat!.max_price).toFixed(2);
                return (
                  <HelpMessage aria-live="polite" data-testid="price-range-help">
                    Prix autorisé: {min} € – {max} €
                  </HelpMessage>
                );
              }
              return <HelpMessage aria-live="polite" />;
            })()}
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
    <div>
      <div>
        <h3>Mode de saisie</h3>
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
    </div>
  );
};

export default SaleWizard;
