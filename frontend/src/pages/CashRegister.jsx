import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Calculator, Package, Loader2 } from 'lucide-react';
import { useCashSessionStore } from '../stores/cashSessionStore';

const CashRegisterContainer = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #666;
`;

const LoadingSpinner = styled(Loader2)`
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ComingSoon = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
`;

function CashRegister() {
  const navigate = useNavigate();
  const { currentSession, fetchCurrentSession, loading } = useCashSessionStore();

  useEffect(() => {
    // Vérifier l'état de la session au chargement
    const checkSessionStatus = async () => {
      await fetchCurrentSession();
    };

    checkSessionStatus();
  }, [fetchCurrentSession]);

  useEffect(() => {
    // Redirection conditionnelle basée sur l'état de la session
    if (!loading) {
      if (!currentSession) {
        // Pas de session active, rediriger vers l'ouverture de session
        navigate('/cash-register/session/open');
      } else if (currentSession.status === 'open') {
        // Session active, rediriger vers l'interface de vente
        navigate('/cash-register/sale');
      } else {
        // Session fermée, rediriger vers l'ouverture de session
        navigate('/cash-register/session/open');
      }
    }
  }, [currentSession, loading, navigate]);

  // Afficher un loader pendant la vérification de la session
  if (loading) {
    return (
      <div data-testid="cashregister-container" style={{ background: 'white', padding: '2rem', borderRadius: '8px' }}>
        <Title>
          <Calculator size={24} data-testid="calculator-icon" />
          Interface Caisse
        </Title>
        <LoadingContainer>
          <LoadingSpinner size={48} data-testid="loading-spinner" />
          <h2>Vérification de la session...</h2>
          <p>Chargement en cours...</p>
        </LoadingContainer>
      </div>
    );
  }

  // Fallback en cas d'erreur (ne devrait normalement pas s'afficher)
  return (
    <div data-testid="cashregister-container" style={{ background: 'white', padding: '2rem', borderRadius: '8px' }}>
      <Title>
        <Calculator size={24} data-testid="calculator-icon" />
        Interface Caisse
      </Title>
      <div data-testid="coming-soon" style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
        <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} data-testid="package-icon" />
        <h2>En cours de développement</h2>
        <p>L'interface de caisse sera bientôt disponible.</p>
      </div>
    </div>
  );
}

export default CashRegister;
