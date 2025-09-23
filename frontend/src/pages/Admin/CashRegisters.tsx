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
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
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
      await deleteCashRegister(deleteModal.register.id);
      setDeleteModal({ isOpen: false, register: null });
      loadItems();
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la suppression');
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
        <Title>Postes de caisse</Title>
        <Button onClick={handleCreate}>Créer un poste de caisse</Button>
      </TitleBar>

      {loading && <div>Chargement...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {!loading && !error && (
        <Table>
          <thead>
            <tr>
              <Th>Nom</Th>
              <Th>Localisation</Th>
              <Th>Actif</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <Td>{item.name}</Td>
                <Td>{item.location || '-'}</Td>
                <Td>{item.is_active ? 'Oui' : 'Non'}</Td>
                <Td>
                  <ActionButton variant="edit" onClick={() => handleEdit(item)}>
                    Modifier
                  </ActionButton>
                  <ActionButton variant="delete" onClick={() => handleDelete(item)}>
                    Supprimer
                  </ActionButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {showForm && (
        <ModalOverlay onClick={handleFormCancel}>
          <div onClick={(e) => e.stopPropagation()}>
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


