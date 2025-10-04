import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { LogOut } from 'lucide-react';
import { useCashSessionStore } from '../../stores/cashSessionStore';
import CategorySelector from '../../components/business/CategorySelector';
import Ticket from '../../components/business/Ticket';
import {
  applyDigit,
  applyDecimalPoint,
  clearWeight,
  formatWeightDisplay,
  parseWeight
} from '../../utils/weightMask';

const formatEu = (n: number) => `${n.toFixed(2)} €`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #d32f2f;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;

  &:hover {
    background: #b71c1c;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  gap: 2rem;
  padding: 2rem;
  overflow: auto;
`;

const LeftPanel = styled.div`
  flex: 2;
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

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

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border: 2px solid ${props => props.$variant === 'primary' ? '#2c5530' : '#ddd'};
  background: ${props => props.$variant === 'primary' ? '#2c5530' : 'white'};
  color: ${props => props.$variant === 'primary' ? 'white' : '#333'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;

  &:hover {
    background: ${props => props.$variant === 'primary' ? '#234426' : '#f0f8f0'};
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


type Mode = 'category' | 'weight' | 'price';

const Sale: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentSession,
    currentSaleItems,
    addSaleItem,
    removeSaleItem,
    updateSaleItem,
    clearCurrentSale,
    submitSale,
    loading
  } = useCashSessionStore();

  const [currentMode, setCurrentMode] = useState<Mode>('category');
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

  useEffect(() => {
    if (!currentSession) {
      navigate('/cash-register');
    }
  }, [currentSession, navigate]);

  const handleNumberClick = (digit: string) => {
    if (currentMode === 'weight') {
      const newValue = applyDigit(weight, digit);
      setWeight(newValue);
      validateWeight(newValue);
    } else if (currentMode === 'price') {
      const newValue = price + digit;
      // Allow digits and one decimal point for price
      if (/^\d*\.?\d{0,2}$/.test(newValue) && parseFloat(newValue || '0') <= 9999.99) {
        setPrice(newValue);
        validatePrice(newValue);
      }
    }
  };

  const handleDecimalClick = () => {
    if (currentMode === 'weight') {
      const newValue = applyDecimalPoint(weight);
      setWeight(newValue);
    } else if (currentMode === 'price') {
      const newValue = price.includes('.') ? price : price + '.';
      setPrice(newValue);
    }
  };

  const handleClear = () => {
    if (currentMode === 'weight') {
      setWeight('');
      setWeightError('');
    } else if (currentMode === 'price') {
      setPrice('');
      setPriceError('');
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentMode('weight');
  };

  const handleWeightConfirm = () => {
    if (isWeightValid) {
      setCurrentMode('price');
    }
  };

  const handlePriceConfirm = () => {
    if (isPriceValid && isWeightValid && selectedCategory) {
      const numWeight = parseFloat(weight);
      const numPrice = parseFloat(price);
      // IMPORTANT: total_price = unit_price (pas de multiplication avec le poids)
      const total = numPrice;

      addSaleItem({
        category: selectedCategory,
        quantity: 1,  // Valeur par défaut pour compatibilité
        weight: numWeight,
        price: numPrice,
        total: total
      });

      // Reset for next item
      setSelectedCategory('');
      setWeight('');
      setPrice('');
      setWeightError('');
      setPriceError('');
      setCurrentMode('category');
    }
  };

  const handleFinalizeSale = async () => {
    if (currentSaleItems.length > 0) {
      const success = await submitSale(currentSaleItems);
      if (success) {
        // Sale completed successfully - show confirmation
        alert('✅ Vente enregistrée avec succès !');
      } else {
        // Show error from store
        const storeError = useCashSessionStore.getState().error;
        alert(`❌ Erreur lors de l'enregistrement de la vente: ${storeError || 'Erreur inconnue'}`);
      }
    }
  };

  const handleCloseSession = () => {
    navigate('/cash-register/session/close');
  };


  const renderModeContent = () => {
    switch (currentMode) {
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

  if (!currentSession) {
    return null;
  }

  return (
    <Container>
      <Content>
        <LeftPanel>
          <div>
            <h3>Mode de saisie</h3>
            <ModeSelector>
              <ModeButton
                $active={currentMode === 'category'}
                onClick={() => setCurrentMode('category')}
              >
                Catégorie
              </ModeButton>
              <ModeButton
                $active={currentMode === 'weight'}
                disabled={!selectedCategory}
              >
                Poids
              </ModeButton>
              <ModeButton
                $active={currentMode === 'price'}
                disabled={!weight}
              >
                Prix
              </ModeButton>
            </ModeSelector>
          </div>

          {renderModeContent()}
        </LeftPanel>

        <RightPanel>
          <Ticket
            items={currentSaleItems.map(it => ({ ...it, total: it.total }))}
            onRemoveItem={removeSaleItem}
            onUpdateItem={updateSaleItem}
            onFinalizeSale={handleFinalizeSale}
            loading={loading}
          />
          <CloseButton onClick={handleCloseSession}>
            <LogOut size={20} />
            Fermer la Session
          </CloseButton>
        </RightPanel>
      </Content>
    </Container>
  );
};

export default Sale;