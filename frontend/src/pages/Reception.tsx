import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Receipt, Plus, X } from 'lucide-react';
import { useReception } from '../contexts/ReceptionContext';
import { useAuthStore } from '../stores/authStore';

const ReceptionContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: #2e7d32;
  font-size: 2rem;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const UserName = styled.span`
  font-weight: 500;
  color: #333;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;

  &:hover {
    background: #d32f2f;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 40px;
`;

const NewTicketButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 40px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 500;
  transition: all 0.2s;
  min-width: 300px;

  &:hover {
    background: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ButtonIcon = styled.div`
  font-size: 48px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #666;
  font-size: 18px;
`;

const ErrorMessage = styled.div`
  background: #ffebee;
  color: #c62828;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  text-align: center;
`;

const Reception: React.FC = () => {
  const navigate = useNavigate();
  const { poste, isLoading, error, openPoste, closePoste, createTicket } = useReception();
  const user = useAuthStore((s) => s.user);

  // Ouvrir automatiquement le poste au premier accès
  useEffect(() => {
    if (!poste && !isLoading) {
      openPoste().catch(console.error);
    }
  }, [poste, isLoading, openPoste]);

  const handleNewTicket = async () => {
    try {
      await createTicket();
      // Rediriger vers la page de saisie du ticket
      navigate('/reception/ticket');
    } catch (err) {
      console.error('Erreur lors de la création du ticket:', err);
    }
  };

  const handleClosePoste = async () => {
    try {
      await closePoste();
      navigate('/');
    } catch (err) {
      console.error('Erreur lors de la fermeture du poste:', err);
    }
  };

  if (isLoading && !poste) {
    return (
      <ReceptionContainer>
        <MainContent>
          <LoadingMessage>Ouverture du poste de réception...</LoadingMessage>
        </MainContent>
      </ReceptionContainer>
    );
  }

  return (
    <ReceptionContainer>
      <Header>
        <Title>
          <Receipt size={32} />
          Module de Réception
        </Title>
        <UserInfo>
          <UserName>Bonjour, {user?.username || 'Utilisateur'}</UserName>
          <CloseButton onClick={handleClosePoste} disabled={isLoading}>
            <X size={20} />
            Terminer ma session
          </CloseButton>
        </UserInfo>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <MainContent>
        <NewTicketButton onClick={handleNewTicket} disabled={isLoading}>
          <ButtonIcon>
            <Plus size={48} />
          </ButtonIcon>
          Créer un nouveau ticket de dépôt
        </NewTicketButton>
      </MainContent>
    </ReceptionContainer>
  );
};

export default Reception;
