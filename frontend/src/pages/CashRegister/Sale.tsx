import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useCashSessionStore } from '../../stores/cashSessionStore';
import CategorySelector from '../../components/business/CategorySelector';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
`;

const Header = styled.div`
  background: white;
  padding: 1rem 2rem;
  border-bottom: 1px solid #ddd;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  margin: 0;
  color: #2c5530;
  font-size: 1.5rem;
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  gap: 2rem;
  padding: 2rem;
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

const SalesSummary = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const SummaryTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #2c5530;
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
    font-weight: bold;
    border-top: 2px solid #ddd;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
  }
`;

type Mode = 'category' | 'quantity' | 'price';

const Sale: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentSession,
    currentSaleItems,
    addSaleItem,
    clearCurrentSale,
    submitSale,
    loading
  } = useCashSessionStore();

  const [currentMode, setCurrentMode] = useState<Mode>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [quantityError, setQuantityError] = useState<string>('');
  const [priceError, setPriceError] = useState<string>('');

  // Validation functions
  const validateQuantity = (value: string): boolean => {
    if (!value) {
      setQuantityError('Quantité requise');
      return false;
    }
    const num = parseInt(value);
    if (isNaN(num) || num < 1 || num > 999) {
      setQuantityError('Quantité doit être entre 1 et 999');
      return false;
    }
    setQuantityError('');
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

  const isQuantityValid = useMemo(() => {
    if (!quantity) return false;
    const num = parseInt(quantity);
    return !isNaN(num) && num >= 1 && num <= 999;
  }, [quantity]);

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
    if (currentMode === 'quantity') {
      const newValue = quantity + digit;
      // Only allow digits for quantity
      if (/^\d+$/.test(newValue) && parseInt(newValue) <= 999) {
        setQuantity(newValue);
        validateQuantity(newValue);
      }
    } else if (currentMode === 'price') {
      const newValue = price + digit;
      // Allow digits and one decimal point for price
      if (/^\d*\.?\d{0,2}$/.test(newValue) && parseFloat(newValue || '0') <= 9999.99) {
        setPrice(newValue);
        validatePrice(newValue);
      }
    }
  };

  const handleClear = () => {
    if (currentMode === 'quantity') {
      setQuantity('');
      setQuantityError('');
    } else if (currentMode === 'price') {
      setPrice('');
      setPriceError('');
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentMode('quantity');
  };

  const handleQuantityConfirm = () => {
    if (isQuantityValid) {
      setCurrentMode('price');
    }
  };

  const handlePriceConfirm = () => {
    if (isPriceValid && isQuantityValid && selectedCategory) {
      const numQuantity = parseInt(quantity);
      const numPrice = parseFloat(price);
      const total = numQuantity * numPrice;

      addSaleItem({
        category: selectedCategory,
        quantity: numQuantity,
        price: numPrice,
        total: total
      });

      // Reset for next item
      setSelectedCategory('');
      setQuantity('');
      setPrice('');
      setQuantityError('');
      setPriceError('');
      setCurrentMode('category');
    }
  };

  const handleFinalizeSale = async () => {
    if (currentSaleItems.length > 0) {
      const success = await submitSale(currentSaleItems);
      if (success) {
        // Sale completed successfully
      }
    }
  };

  const totalAmount = currentSaleItems.reduce((sum, item) => sum + item.total, 0);
  const totalItems = currentSaleItems.reduce((sum, item) => sum + item.quantity, 0);

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

      case 'quantity':
        return (
          <ModeContent>
            <ModeTitle>Quantité</ModeTitle>
            <DisplayValue $isValid={!quantityError}>{quantity || '0'}</DisplayValue>
            <ErrorMessage>{quantityError}</ErrorMessage>
            <NumpadContainer>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((item) => (
                <NumpadButton
                  key={item}
                  disabled={item === 'OK' && !isQuantityValid}
                  style={{
                    opacity: item === 'OK' && !isQuantityValid ? 0.5 : 1,
                    cursor: item === 'OK' && !isQuantityValid ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => {
                    if (item === 'C') {
                      handleClear();
                    } else if (item === 'OK') {
                      handleQuantityConfirm();
                    } else {
                      handleNumberClick(item.toString());
                    }
                  }}
                >
                  {item === 'OK' ? 'Valider' : item}
                </NumpadButton>
              ))}
            </NumpadContainer>
          </ModeContent>
        );

      case 'price':
        return (
          <ModeContent>
            <ModeTitle>Prix unitaire (€)</ModeTitle>
            <DisplayValue $isValid={!priceError}>{price || '0'}</DisplayValue>
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
      <Header>
        <Title>Interface de Vente</Title>
      </Header>

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
                $active={currentMode === 'quantity'}
                disabled={!selectedCategory}
              >
                Quantité
              </ModeButton>
              <ModeButton
                $active={currentMode === 'price'}
                disabled={!quantity}
              >
                Prix
              </ModeButton>
            </ModeSelector>
          </div>

          {renderModeContent()}
        </LeftPanel>

        <RightPanel>
          <SalesSummary>
            <SummaryTitle>Résumé de la vente</SummaryTitle>
            {currentSaleItems.length === 0 ? (
              <p>Aucun article ajouté</p>
            ) : (
              <>
                {currentSaleItems.map((item) => (
                  <SummaryItem key={item.id}>
                    <span>{item.category} × {item.quantity}</span>
                    <span>{item.total.toFixed(2)} €</span>
                  </SummaryItem>
                ))}
                <SummaryItem>
                  <span>{totalItems} articles</span>
                  <span>{totalAmount.toFixed(2)} €</span>
                </SummaryItem>
              </>
            )}
          </SalesSummary>

          {currentSaleItems.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
              <ActionButton
                $variant="primary"
                onClick={handleFinalizeSale}
                disabled={loading}
              >
                Finaliser la vente
              </ActionButton>
              <ActionButton
                onClick={clearCurrentSale}
                disabled={loading}
              >
                Vider le panier
              </ActionButton>
            </div>
          )}
        </RightPanel>
      </Content>
    </Container>
  );
};

export default Sale;