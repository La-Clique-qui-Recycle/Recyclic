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
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3<{ variant?: 'danger' | 'warning' }>`
  margin: 0 0 16px 0;
  color: ${props => props.variant === 'warning' ? '#ff9800' : '#d32f2f'};
  font-size: 18px;
`;

const ModalMessage = styled.p`
  margin: 0 0 16px 0;
  color: #666;
  line-height: 1.5;
`;

const DependenciesList = styled.div`
  background: #fff3e0;
  border: 1px solid #ffcc02;
  border-radius: 4px;
  padding: 16px;
  margin: 16px 0;
`;

const DependencySection = styled.div`
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DependencyTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #e65100;
`;

const DependencyItem = styled.div`
  padding: 4px 0;
  font-size: 14px;
  color: #666;
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 4px;
  margin: 16px 0;
`;

const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid #e0e0e0;
  border-top: 2px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  padding: 12px;
  margin: 16px 0;
  color: #c62828;
  font-size: 14px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
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

    &:hover:not(:disabled) {
      background: #b71c1c;
    }
  ` : `
    background: #f5f5f5;
    color: #666;
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

interface SiteDependencies {
  cashRegisters: any[];
  cashSessions: any[];
  hasBlockingDependencies: boolean;
  error?: string;
}

interface SiteDeleteConfirmationModalProps {
  isOpen: boolean;
  siteName: string;
  dependencies?: SiteDependencies | null;
  checkingDependencies?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function SiteDeleteConfirmationModal({
  isOpen,
  siteName,
  dependencies,
  checkingDependencies = false,
  onConfirm,
  onCancel,
  loading = false
}: SiteDeleteConfirmationModalProps) {
  if (!isOpen) return null;

  const renderDependenciesContent = () => {
    if (checkingDependencies) {
      return (
        <LoadingIndicator>
          <Spinner />
          <span>Vérification des dépendances en cours...</span>
        </LoadingIndicator>
      );
    }

    if (dependencies?.error) {
      return (
        <ErrorMessage>
          <strong>Attention :</strong> {dependencies.error}
        </ErrorMessage>
      );
    }

    if (dependencies?.hasBlockingDependencies) {
      return (
        <DependenciesList>
          <ModalMessage style={{ margin: '0 0 16px 0', color: '#e65100' }}>
            <strong>Ce site ne peut pas être supprimé car il est utilisé par :</strong>
          </ModalMessage>

          {dependencies.cashRegisters?.length > 0 && (
            <DependencySection>
              <DependencyTitle>
                Postes de caisse ({dependencies.cashRegisters.length})
              </DependencyTitle>
              {dependencies.cashRegisters.slice(0, 5).map((register: any, index: number) => (
                <DependencyItem key={index}>
                  • {register.name || `Poste de caisse ${register.id}`}
                </DependencyItem>
              ))}
              {dependencies.cashRegisters.length > 5 && (
                <DependencyItem>
                  • ... et {dependencies.cashRegisters.length - 5} autres postes de caisse
                </DependencyItem>
              )}
            </DependencySection>
          )}

          {dependencies.cashSessions?.length > 0 && (
            <DependencySection>
              <DependencyTitle>
                Sessions de caisse ({dependencies.cashSessions.length})
              </DependencyTitle>
              {dependencies.cashSessions.slice(0, 5).map((session: any, index: number) => (
                <DependencyItem key={index}>
                  • Session du {new Date(session.created_at).toLocaleDateString()}
                </DependencyItem>
              ))}
              {dependencies.cashSessions.length > 5 && (
                <DependencyItem>
                  • ... et {dependencies.cashSessions.length - 5} autres sessions
                </DependencyItem>
              )}
            </DependencySection>
          )}

          <ModalMessage style={{ margin: '16px 0 0 0', color: '#e65100', fontSize: '14px' }}>
            Pour supprimer ce site, vous devez d'abord supprimer ou réassigner
            tous les éléments qui l'utilisent.
          </ModalMessage>
        </DependenciesList>
      );
    }

    return null;
  };

  const canDelete = !checkingDependencies &&
                   (!dependencies || !dependencies.hasBlockingDependencies);

  const getTitle = () => {
    if (checkingDependencies) {
      return 'Vérification en cours...';
    }
    if (dependencies?.hasBlockingDependencies) {
      return 'Suppression impossible';
    }
    return 'Confirmer la suppression';
  };

  const getTitleVariant = () => {
    if (dependencies?.hasBlockingDependencies) {
      return 'warning';
    }
    return 'danger';
  };

  return (
    <ModalOverlay
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      data-testid="site-delete-modal"
    >
      <ModalContent onClick={(e) => e.stopPropagation()} role="document">
        <ModalTitle
          id="delete-modal-title"
          variant={getTitleVariant()}
        >
          {getTitle()}
        </ModalTitle>

        <ModalMessage>
          {dependencies?.hasBlockingDependencies ? (
            <>Le site "<strong>{siteName}</strong>" ne peut pas être supprimé.</>
          ) : (
            <>
              Êtes-vous sûr de vouloir supprimer le site "<strong>{siteName}</strong>" ?
              <br />
              Cette action est irréversible.
            </>
          )}
        </ModalMessage>

        {renderDependenciesContent()}

        <ButtonGroup>
          <Button
            type="button"
            onClick={onCancel}
            disabled={loading}
            data-testid="cancel-delete-button"
          >
            {dependencies?.hasBlockingDependencies ? 'Fermer' : 'Annuler'}
          </Button>

          {canDelete && (
            <Button
              type="button"
              variant="danger"
              onClick={onConfirm}
              disabled={loading || checkingDependencies}
              data-testid="confirm-delete-button"
            >
              {loading ? 'Suppression...' : 'Supprimer'}
            </Button>
          )}
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
}