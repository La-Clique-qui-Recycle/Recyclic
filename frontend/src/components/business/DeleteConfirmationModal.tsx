import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 400px;
  width: 90%;
`;

const ModalTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #d32f2f;
  font-size: 18px;
`;

const ModalMessage = styled.p`
  margin: 0 0 24px 0;
  color: #666;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button<{ variant?: 'danger' | 'secondary' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  
  ${props => props.variant === 'danger' ? `
    background: #d32f2f;
    color: white;
    
    &:hover {
      background: #b71c1c;
    }
  ` : `
    background: #f5f5f5;
    color: #666;
    border: 1px solid #ddd;
    
    &:hover {
      background: #e0e0e0;
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  itemName,
  onConfirm,
  onCancel,
  loading = false
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onCancel}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle>Confirmer la suppression</ModalTitle>
        <ModalMessage>
          Êtes-vous sûr de vouloir supprimer le poste de caisse "{itemName}" ?
          Cette action est irréversible.
        </ModalMessage>
        <ButtonGroup>
          <Button type="button" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
}
