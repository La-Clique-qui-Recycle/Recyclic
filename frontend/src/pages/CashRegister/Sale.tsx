import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { LogOut } from 'lucide-react';
import { useCashSessionStore } from '../../stores/cashSessionStore';
import SaleWizard from '../../components/business/SaleWizard';
import Ticket from '../../components/business/Ticket';
import type { SaleItemData } from '../../components/business/SaleWizard';

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

const Sale: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentSession,
    currentSaleItems,
    addSaleItem,
    removeSaleItem,
    updateSaleItem,
    submitSale,
    loading
  } = useCashSessionStore();

  useEffect(() => {
    if (!currentSession) {
      navigate('/cash-register');
    }
  }, [currentSession, navigate]);

  const handleItemComplete = (itemData: SaleItemData) => {
    addSaleItem({
      category: itemData.category,
      quantity: 1,
      weight: itemData.weight,
      price: itemData.price,
      total: itemData.total
    });
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

  if (!currentSession) {
    return null;
  }

  return (
    <Container>
      <Content>
        <LeftPanel>
          <SaleWizard onItemComplete={handleItemComplete} />
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