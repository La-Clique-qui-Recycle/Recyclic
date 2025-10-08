import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { LogOut } from 'lucide-react';
import { useCashSessionStore } from '../../stores/cashSessionStore';
import SaleWizard from '../../components/business/SaleWizard';
import Ticket from '../../components/business/Ticket';
import FinalizationScreen, { FinalizationData } from '../../components/business/FinalizationScreen';
import type { SaleItemData } from '../../components/business/SaleWizard';
import PageLayout, { PageTitle, PageSection } from '../../components/layout/PageLayout';

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
  overflow: auto;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const LeftPanel = styled.div`
  flex: 2;
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Sale: React.FC = () => {
  const navigate = useNavigate();
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [finalizationData, setFinalizationData] = useState<FinalizationData | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
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
      subcategory: itemData.subcategory,
      quantity: itemData.quantity,
      weight: itemData.weight,
      price: itemData.price,
      total: itemData.total
    });
  };

  const handleFinalizeSale = async () => {
    if (currentSaleItems.length === 0) return;
    setIsFinalizing(true);
  };

  const handleCloseSession = () => {
    navigate('/cash-register/session/close');
  };

  if (!currentSession) {
    return null;
  }

  const ticketTotal = useMemo(() => currentSaleItems.reduce((sum, it) => sum + (it.total || 0), 0), [currentSaleItems]);

  const handleCancelFinalization = () => {
    setIsFinalizing(false);
    setFinalizationData(null);
  };

  const handleConfirmFinalization = async (data: FinalizationData) => {
    setFinalizationData(data);
    setIsFinalizing(false);
    const success = await submitSale(currentSaleItems, data);
    if (success) {
      // Afficher une popup de succès qui disparaît automatiquement après 3 secondes
      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);
    } else {
      const storeError = useCashSessionStore.getState().error;
      alert(`❌ Erreur lors de l'enregistrement de la vente: ${storeError || 'Erreur inconnue'}`);
    }
  };

  return (
    <PageLayout>
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
          <FinalizationScreen
            open={isFinalizing}
            totalAmount={ticketTotal}
            onCancel={handleCancelFinalization}
            onConfirm={handleConfirmFinalization}
          />
          {showSuccessPopup && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#4caf50',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              zIndex: 3000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              textAlign: 'center'
            }}>
              ✅ Vente enregistrée avec succès !
            </div>
          )}
          <CloseButton onClick={handleCloseSession}>
            <LogOut size={20} />
            Fermer la Session
          </CloseButton>
        </RightPanel>
      </Content>
    </PageLayout>
  );
};

export default Sale;