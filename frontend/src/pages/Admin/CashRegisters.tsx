import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getCashRegisters, deleteCashRegister } from '../../services/api';
import CashRegisterForm from '../../components/business/CashRegisterForm';
import DeleteConfirmationModal from '../../components/business/DeleteConfirmationModal';

const Container = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
`;

const TitleBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const Title = styled.h2`
  margin: 0;
`;

const Button = styled.button`
  background: #2e7d32;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 10px;
  border-bottom: 1px solid #eee;
`;

const Td = styled.td`
  padding: 10px;
  border-bottom: 1px solid #f5f5f5;
`;

const ActionButton = styled.button<{ variant?: 'edit' | 'delete' }>`
  padding: 4px 8px;
  margin: 0 2px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  
  ${props => props.variant === 'edit' ? `
    background: #2196f3;
    color: white;
    
    &:hover {
      background: #1976d2;
    }
  ` : `
    background: #f44336;
    color: white;
    
    &:hover {
      background: #d32f2f;
    }
  `}
`;

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

interface CashRegister {
  id: string;
  name: string;
  location?: string;
  site_id?: string;
  is_active: boolean;
}

export default function CashRegisters() {
  const [items, setItems] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingRegister, setEditingRegister] = useState<CashRegister | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; register: CashRegister | null }>({
    isOpen: false,
    register: null
  });
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCashRegisters();
      // Fallback: ensure data is an array to prevent .map() crashes
      const normalizedItems = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.data)
          ? (data as any).data
          : Array.isArray((data as any)?.results)
            ? (data as any).results
            : [];
      setItems(normalizedItems as CashRegister[]);
    } catch (e: any) {
      console.error('Erreur lors du chargement des postes de caisse:', e);
      let errorMessage = 'Erreur de chargement des postes de caisse';

      if (e?.response?.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (e?.response?.status === 403) {
        errorMessage = 'Vous n\'avez pas les permissions nécessaires pour accéder aux postes de caisse.';
      } else if (e?.response?.status === 404) {
        errorMessage = 'Service de gestion des postes de caisse temporairement indisponible.';
      } else if (e?.response?.status >= 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer dans quelques instants.';
      } else if (e?.code === 'ERR_NETWORK' || e?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        errorMessage = 'Problème de connexion réseau. Vérifiez votre connexion internet.';
      } else if (e?.message) {
        errorMessage = e.message;
      }

      setError(errorMessage);
      setItems([]); // Prevent crash by ensuring items is always an array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleCreate = () => {
    setEditingRegister(null);
    setShowForm(true);
  };

  const handleEdit = (register: CashRegister) => {
    setEditingRegister(register);
    setShowForm(true);
  };

  const handleDelete = (register: CashRegister) => {
    setDeleteModal({ isOpen: true, register });
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingRegister(null);
    loadItems();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingRegister(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.register) return;

    try {
      setActionLoading(true);
      setError(null); // Clear any previous errors
      await deleteCashRegister(deleteModal.register.id);
      setDeleteModal({ isOpen: false, register: null });
      loadItems();
    } catch (e: any) {
      console.error('Erreur lors de la suppression du poste de caisse:', e);
      let errorMessage = 'Erreur lors de la suppression du poste de caisse';

      // Check for API detail message first (most specific)
      if (e?.response?.data?.detail) {
        errorMessage = e.response.data.detail;
      } else if (e?.response?.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (e?.response?.status === 403) {
        errorMessage = 'Vous n\'avez pas les permissions nécessaires pour supprimer ce poste de caisse.';
      } else if (e?.response?.status === 404) {
        errorMessage = 'Ce poste de caisse n\'existe plus ou a déjà été supprimé.';
      } else if (e?.response?.status === 409) {
        errorMessage = 'Ce poste de caisse ne peut pas être supprimé car il est utilisé par d\'autres éléments du système.';
      } else if (e?.response?.status >= 500) {
        errorMessage = 'Erreur serveur lors de la suppression. Veuillez réessayer.';
      } else if (e?.code === 'ERR_NETWORK' || e?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        errorMessage = 'Problème de connexion réseau. Veuillez vérifier votre connexion internet.';
      } else if (e?.message) {
        errorMessage = e.message;
      }

      setError(errorMessage);
      // Keep the modal open to show the error and allow retry
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, register: null });
  };

  return (
    <Container>
      <TitleBar>
        <Title id="cash-registers-title">Postes de caisse</Title>
        <Button
          onClick={handleCreate}
          aria-label="Créer un nouveau poste de caisse"
          data-testid="create-cash-register-button"
        >
          Créer un poste de caisse
        </Button>
      </TitleBar>

      {loading && (
        <div
          role="status"
          aria-live="polite"
          aria-label="Chargement des postes de caisse en cours"
          data-testid="loading-indicator"
        >
          Chargement...
        </div>
      )}

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            color: '#d32f2f',
            backgroundColor: '#ffebee',
            border: '1px solid #ffcdd2',
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          data-testid="error-message"
        >
          <span>{error}</span>
          <Button
            onClick={loadItems}
            style={{
              marginLeft: '16px',
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: '#1976d2',
              color: 'white',
            }}
            aria-label="Réessayer le chargement des postes de caisse"
            data-testid="retry-button"
          >
            Réessayer
          </Button>
        </div>
      )}

      {!loading && !error && (
        <Table
          role="table"
          aria-labelledby="cash-registers-title"
          data-testid="cash-registers-table"
        >
          <thead>
            <tr role="row">
              <Th role="columnheader" scope="col">Nom</Th>
              <Th role="columnheader" scope="col">Localisation</Th>
              <Th role="columnheader" scope="col">Actif</Th>
              <Th role="columnheader" scope="col">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr role="row">
                <Td role="cell" colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>
                  <div
                    style={{
                      color: '#666',
                      fontSize: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                    data-testid="empty-state"
                  >
                    <div style={{ fontSize: '48px', opacity: 0.3 }}>🖥️</div>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                        Aucun poste de caisse configuré
                      </div>
                      <div style={{ fontSize: '14px', marginBottom: '16px' }}>
                        Commencez par créer votre premier poste de caisse.
                      </div>
                      <Button
                        onClick={handleCreate}
                        style={{
                          backgroundColor: '#2e7d32',
                          color: 'white',
                          padding: '8px 16px',
                        }}
                        aria-label="Créer le premier poste de caisse"
                        data-testid="create-first-cash-register-button"
                      >
                        Créer un poste de caisse
                      </Button>
                    </div>
                  </div>
                </Td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} role="row">
                  <Td role="cell">{item.name}</Td>
                  <Td role="cell">{item.location || '-'}</Td>
                  <Td role="cell">
                    <span
                      aria-label={item.is_active ? 'Poste de caisse actif' : 'Poste de caisse inactif'}
                      data-testid={`cash-register-status-${item.id}`}
                    >
                      {item.is_active ? 'Oui' : 'Non'}
                    </span>
                  </Td>
                  <Td role="cell">
                    <ActionButton
                      variant="edit"
                      onClick={() => handleEdit(item)}
                      aria-label={`Modifier le poste de caisse ${item.name}`}
                      data-testid={`edit-cash-register-${item.id}`}
                      title={`Modifier le poste de caisse ${item.name}`}
                    >
                      Modifier
                    </ActionButton>
                    <ActionButton
                      variant="delete"
                      onClick={() => handleDelete(item)}
                      aria-label={`Supprimer le poste de caisse ${item.name}`}
                      data-testid={`delete-cash-register-${item.id}`}
                      title={`Supprimer le poste de caisse ${item.name}`}
                    >
                      Supprimer
                    </ActionButton>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      {showForm && (
        <ModalOverlay
          onClick={handleFormCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby={editingRegister ? "edit-cash-register-modal-title" : "create-cash-register-modal-title"}
          data-testid="cash-register-form-modal"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <CashRegisterForm
              register={editingRegister}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        </ModalOverlay>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        itemName={deleteModal.register?.name || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={actionLoading}
      />
    </Container>
  );
}
