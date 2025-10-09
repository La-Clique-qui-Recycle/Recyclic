import React from 'react';
import styled from 'styled-components';
import { LogOut, User } from 'lucide-react';

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: #2e7d32;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  min-height: 50px;

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    min-height: 45px;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CashierInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
`;

const SessionInfo = styled.span`
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.85rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #d32f2f;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background: #b71c1c;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
    gap: 0.35rem;

    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

export interface CashSessionHeaderProps {
  cashierName: string;
  sessionId?: string;
  onCloseSession: () => void;
  isLoading?: boolean;
}

/**
 * CashSessionHeader Component
 * 
 * Displays a minimal header for the cash register kiosk mode.
 * Shows cashier information and provides a close session button.
 * 
 * @param cashierName - Name of the current cashier
 * @param sessionId - Optional session ID to display
 * @param onCloseSession - Handler for close session button
 * @param isLoading - Whether the session is being closed
 */
export const CashSessionHeader: React.FC<CashSessionHeaderProps> = ({
  cashierName,
  sessionId,
  onCloseSession,
  isLoading = false
}) => {
  const shortSessionId = sessionId ? sessionId.slice(-8) : '';

  return (
    <HeaderContainer data-testid="cash-session-header">
      <LeftSection>
        <CashierInfo>
          <User size={18} />
          <span>{cashierName}</span>
        </CashierInfo>
        {shortSessionId && (
          <SessionInfo>Session #{shortSessionId}</SessionInfo>
        )}
      </LeftSection>
      <CloseButton 
        onClick={onCloseSession} 
        disabled={isLoading}
        data-testid="close-session-button"
      >
        <LogOut size={18} />
        Fermer la Caisse
      </CloseButton>
    </HeaderContainer>
  );
};

export default CashSessionHeader;

