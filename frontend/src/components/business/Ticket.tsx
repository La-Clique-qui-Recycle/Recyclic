import React, { useState } from 'react';
import styled from 'styled-components';
import { SaleItem } from '../../stores/cashSessionStore';

const TicketContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  max-height: 70vh;
  overflow-y: auto;
`;

const TicketTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #2c5530;
  text-align: center;
  border-bottom: 2px solid #2c5530;
  padding-bottom: 0.5rem;
`;

const TicketItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
  gap: 1rem;

  &:last-child {
    border-bottom: none;
  }
`;

const ItemInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ItemCategory = styled.span`
  font-weight: 500;
  color: #333;
`;

const ItemDetails = styled.span`
  font-size: 0.875rem;
  color: #666;
`;

const ItemTotal = styled.span`
  font-weight: bold;
  color: #2c5530;
  min-width: 60px;
  text-align: right;
`;

const ItemActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant?: 'edit' | 'delete' }>`
  padding: 0.25rem 0.5rem;
  border: 1px solid ${props => props.$variant === 'delete' ? '#dc3545' : '#2c5530'};
  background: ${props => props.$variant === 'delete' ? 'white' : '#2c5530'};
  color: ${props => props.$variant === 'delete' ? '#dc3545' : 'white'};
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$variant === 'delete' ? '#dc3545' : '#234426'};
    color: white;
  }
`;

const TotalSection = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #ddd;
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  font-size: 1.1rem;
  color: #2c5530;
`;

const FinalizeButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: #2c5530;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
  transition: background 0.2s;

  &:hover {
    background: #234426;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const EditModal = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const EditModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  min-width: 400px;
  max-width: 90vw;
`;

const EditForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #2c5530;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border: 2px solid ${props => props.$variant === 'primary' ? '#2c5530' : '#ddd'};
  background: ${props => props.$variant === 'primary' ? '#2c5530' : 'white'};
  color: ${props => props.$variant === 'primary' ? 'white' : '#333'};
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background: ${props => props.$variant === 'primary' ? '#234426' : '#f0f8f0'};
  }
`;

interface TicketProps {
  items: SaleItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, newQty: number, newPrice: number) => void;
  onFinalizeSale: () => void;
  loading?: boolean;
}

const Ticket: React.FC<TicketProps> = ({
  items,
  onRemoveItem,
  onUpdateItem,
  onFinalizeSale,
  loading = false
}) => {
  const [editingItem, setEditingItem] = useState<SaleItem | null>(null);
  const [editWeight, setEditWeight] = useState<string>('');
  const [editPrice, setEditPrice] = useState<string>('');

  const totalAmount = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalItems = items.length; // Nombre d'articles (lignes), pas de quantités

  const handleEditClick = (item: SaleItem) => {
    setEditingItem(item);
    setEditWeight((item.weight || 0).toString());
    setEditPrice(item.price.toString());
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      const newWeight = parseFloat(editWeight);
      const newPrice = parseFloat(editPrice);

      if (!isNaN(newWeight) && !isNaN(newPrice) && newWeight > 0 && newPrice > 0) {
        // Note: onUpdateItem signature devra être adapté pour accepter le poids
        onUpdateItem(editingItem.id, newWeight, newPrice);
        setEditingItem(null);
        setEditWeight('');
        setEditPrice('');
      }
    }
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditWeight('');
    setEditPrice('');
  };

  return (
    <>
      <TicketContainer>
        <TicketTitle>Ticket de Caisse</TicketTitle>
        
        {items.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', margin: '2rem 0' }}>
            Aucun article ajouté
          </p>
        ) : (
          <>
            {items.map((item) => (
              <TicketItem key={item.id}>
                <ItemInfo>
                  <ItemCategory>{item.category}</ItemCategory>
                <ItemDetails>
                  {`${(item.weight || 0).toFixed(2)} kg`}
                </ItemDetails>
                </ItemInfo>
              <ItemTotal>{`${(item.total || 0).toFixed(2)} €`}</ItemTotal>
                <ItemActions>
                  <ActionButton
                    $variant="edit"
                    onClick={() => handleEditClick(item)}
                  >
                    Modifier
                  </ActionButton>
                  <ActionButton
                    $variant="delete"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    Supprimer
                  </ActionButton>
                </ItemActions>
              </TicketItem>
            ))}
            
            <TotalSection>
              <TotalRow>
                <span>{totalItems} articles</span>
                <span data-testid="sale-total">{`${totalAmount.toFixed(2)} €`}</span>
              </TotalRow>
            </TotalSection>
            
            <FinalizeButton
              onClick={onFinalizeSale}
              disabled={loading || items.length === 0}
            >
              {loading ? 'Finalisation...' : 'Finaliser la vente'}
            </FinalizeButton>
          </>
        )}
      </TicketContainer>

      <EditModal $isOpen={!!editingItem} role="dialog" aria-modal="true" aria-label="Modifier l'article">
        <EditModalContent>
          <h3 style={{ display: editingItem ? undefined as any : 'none' }}>Modifier l'article</h3>
          <EditForm onSubmit={handleEditSubmit}>
            <FormGroup>
              <Label>Catégorie</Label>
              <Input
                type="text"
                value={editingItem?.category || ''}
                disabled
              />
            </FormGroup>
            <FormGroup>
              <Label>Poids (kg)</Label>
              <Input
                type="number"
                step="0.01"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                min="0.01"
                max="9999.99"
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>Prix unitaire (édition)</Label>
              <Input
                type="number"
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                min="0.01"
                max="9999.99"
                required
              />
            </FormGroup>
            <ButtonGroup>
              <Button type="button" onClick={handleEditCancel}>
                Annuler
              </Button>
              <Button type="submit" $variant="primary">
                Valider
              </Button>
            </ButtonGroup>
          </EditForm>
        </EditModalContent>
      </EditModal>
    </>
  );
};

export default Ticket;
