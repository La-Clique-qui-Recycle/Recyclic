import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, Calculator, AlertTriangle, CheckCircle } from 'lucide-react';
import { useCashSessionStore } from '../../stores/cashSessionStore';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e0e0e0;
  }
`;

const Title = styled.h1`
  color: #2e7d32;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  color: #333;
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const SummaryItem = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #2e7d32;
`;

const SummaryLabel = styled.div`
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
`;

const SummaryValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #2e7d32;
  }

  &:invalid {
    border-color: #d32f2f;
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #2e7d32;
  }

  &:invalid {
    border-color: #d32f2f;
  }
`;

const VarianceDisplay = styled.div<{ hasVariance: boolean }>`
  padding: 1rem;
  border-radius: 8px;
  background: ${props => props.hasVariance ? '#fff3e0' : '#e8f5e8'};
  border: 1px solid ${props => props.hasVariance ? '#ff9800' : '#4caf50'};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 0;
`;

const VarianceIcon = styled.div<{ hasVariance: boolean }>`
  color: ${props => props.hasVariance ? '#f57c00' : '#2e7d32'};
`;

const VarianceText = styled.div`
  font-weight: 500;
  color: #333;
`;

const VarianceAmount = styled.div<{ hasVariance: boolean }>`
  font-size: 1.25rem;
  font-weight: bold;
  color: ${props => props.hasVariance ? '#f57c00' : '#2e7d32'};
  margin-left: auto;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  ${props => props.variant === 'primary' ? `
    background: #2e7d32;
    color: white;
    
    &:hover:not(:disabled) {
      background: #1b5e20;
    }
  ` : `
    background: #f5f5f5;
    color: #333;
    border: 1px solid #ddd;
    
    &:hover:not(:disabled) {
      background: #e0e0e0;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: #ffebee;
  color: #d32f2f;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #ffcdd2;
  margin-bottom: 1rem;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default function CloseSession() {
  const navigate = useNavigate();
  const { currentSession, closeSession, loading, error } = useCashSessionStore();
  
  const [actualAmount, setActualAmount] = useState<string>('');
  const [varianceComment, setVarianceComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculer les montants
  const theoreticalAmount = currentSession ? 
    (currentSession.initial_amount || 0) + (currentSession.total_sales || 0) : 0;
  
  const actualAmountNum = parseFloat(actualAmount) || 0;
  const variance = actualAmountNum - theoreticalAmount;
  const hasVariance = Math.abs(variance) > 0.01; // Tolérance de 1 centime

  useEffect(() => {
    // Rediriger si pas de session active
    if (!currentSession || currentSession.status !== 'open') {
      navigate('/cash-register/session/open');
    }
  }, [currentSession, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentSession) return;

    // Valider que le commentaire est fourni si il y a un écart
    if (hasVariance && !varianceComment.trim()) {
      alert('Un commentaire est obligatoire en cas d\'écart entre le montant théorique et le montant physique');
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await closeSession(currentSession.id, {
        actual_amount: actualAmountNum,
        variance_comment: varianceComment.trim() || undefined
      });

      if (success) {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Erreur lors de la fermeture de session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/cash-register/sale');
  };

  if (!currentSession || currentSession.status !== 'open') {
    return null; // Redirection en cours
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/cash-register/sale')}>
          <ArrowLeft size={20} />
          Retour à la vente
        </BackButton>
        <Title>
          <Calculator size={24} />
          Fermeture de Caisse
        </Title>
      </Header>

      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}

      <Card>
        <SectionTitle>Résumé de la Session</SectionTitle>
        <SummaryGrid>
          <SummaryItem>
            <SummaryLabel>Fond de Caisse Initial</SummaryLabel>
            <SummaryValue>{currentSession.initial_amount?.toFixed(2)} €</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Total des Ventes</SummaryLabel>
            <SummaryValue>{currentSession.total_sales?.toFixed(2) || '0.00'} €</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Montant Théorique</SummaryLabel>
            <SummaryValue>{theoreticalAmount.toFixed(2)} €</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Articles Vendus</SummaryLabel>
            <SummaryValue>{currentSession.total_items || 0}</SummaryValue>
          </SummaryItem>
        </SummaryGrid>
      </Card>

      <Card>
        <SectionTitle>Contrôle des Montants</SectionTitle>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="actual-amount">
              Montant Physique Compté *
            </Label>
            <Input
              id="actual-amount"
              type="number"
              step="0.01"
              min="0"
              value={actualAmount}
              onChange={(e) => setActualAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </FormGroup>

          {actualAmount && (
            <VarianceDisplay hasVariance={hasVariance}>
              <VarianceIcon hasVariance={hasVariance}>
                {hasVariance ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
              </VarianceIcon>
              <VarianceText>
                {hasVariance ? 'Écart détecté' : 'Aucun écart'}
              </VarianceText>
              <VarianceAmount hasVariance={hasVariance}>
                {variance > 0 ? '+' : ''}{variance.toFixed(2)} €
              </VarianceAmount>
            </VarianceDisplay>
          )}

          {hasVariance && (
            <FormGroup>
              <Label htmlFor="variance-comment">
                Commentaire sur l'écart *
              </Label>
              <TextArea
                id="variance-comment"
                value={varianceComment}
                onChange={(e) => setVarianceComment(e.target.value)}
                placeholder="Expliquez la raison de l'écart..."
                required
              />
            </FormGroup>
          )}

          <ButtonGroup>
            <Button type="button" onClick={handleCancel}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={isSubmitting || !actualAmount}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner />
                  Fermeture en cours...
                </>
              ) : (
                'Fermer la Session'
              )}
            </Button>
          </ButtonGroup>
        </Form>
      </Card>
    </Container>
  );
}
