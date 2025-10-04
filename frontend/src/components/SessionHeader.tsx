import React from 'react';
import styled from 'styled-components';
import { ArrowLeft, Check } from 'lucide-react';

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #2e7d32;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;

  @media (max-width: 480px) {
    padding: 8px 12px;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 480px) {
    gap: 8px;
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  @media (max-width: 480px) {
    padding: 6px 10px;
    font-size: 11px;
    gap: 4px;

    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const TicketTitle = styled.h1`
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;

  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

const CloseTicketButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #ffc107;
  color: #212529;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);

  &:hover {
    background: #ffca28;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 480px) {
    padding: 6px 10px;
    font-size: 10px;
    gap: 4px;
    white-space: nowrap;

    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

interface SessionHeaderProps {
  ticketId: string;
  onBack: () => void;
  onCloseTicket: () => void;
  isLoading?: boolean;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({
  ticketId,
  onBack,
  onCloseTicket,
  isLoading = false
}) => {
  // Afficher les 8 derniers caractères de l'ID du ticket
  const shortTicketId = ticketId.slice(-8);

  return (
    <HeaderContainer>
      <LeftSection>
        <BackButton onClick={onBack}>
          <ArrowLeft size={20} />
          Retour
        </BackButton>
        <TicketTitle>Ticket #{shortTicketId}</TicketTitle>
      </LeftSection>
      <CloseTicketButton onClick={onCloseTicket} disabled={isLoading}>
        <Check size={20} />
        Clôturer le ticket
      </CloseTicketButton>
    </HeaderContainer>
  );
};

export default SessionHeader;
