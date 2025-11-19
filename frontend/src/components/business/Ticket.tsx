import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Edit, Trash2 } from 'lucide-react';
import { SaleItem } from '../../stores/cashSessionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { usePresetStore } from '../../stores/presetStore';
import PresetButtonGrid from '../presets/PresetButtonGrid';
import { Textarea } from '@mantine/core';
import TicketScroller from '../tickets/TicketScroller';
import TicketHighlighter from '../tickets/TicketHighlighter';
import { ScrollPositionManager } from '../../utils/scrollManager';

const TicketContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  max-height: 600px; /* Limit max height for better UX */
`;

const ScrollableTicketArea = styled.div`
  flex: 1;
  min-height: 0; /* Allow flex shrinking */
  display: flex;
  flex-direction: column;
  position: relative;
`;

const ScrollerWrapper = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

const FixedFooter = styled.div`
  flex-shrink: 0;
  padding: 1.5rem;
  border-top: 2px solid #eee;
  background: #f8f9fa;
  border-radius: 0 0 8px 8px;
  margin-top: auto;
`;

const TicketHeader = styled.div`
  padding: 1.5rem 1.5rem 0 1.5rem;
`;

const TicketContent = styled.div`
  padding: 0 1.5rem;
  min-height: 0; /* Allow proper scrolling */
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

const ActionButton = styled.button`
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 2px;

  &.edit {
    background: #ffc107;
    color: #212529;

    &:hover {
      background: #e0a800;
    }
  }

  &.delete {
    background: #dc3545;
    color: white;

    &:hover {
      background: #c82333;
    }
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
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
  onUpdateItem: (itemId: string, newQuantity: number, newWeight: number, newPrice: number, presetId?: string, notes?: string) => void;
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
  const { getCategoryById, fetchCategories } = useCategoryStore();
  const { selectedPreset, notes, setNotes, presets } = usePresetStore();
  const [editingItem, setEditingItem] = useState<SaleItem | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [editWeight, setEditWeight] = useState<string>('');
  const [editPrice, setEditPrice] = useState<string>('');
  const [editPresetId, setEditPresetId] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const scrollManagerRef = useRef<ScrollPositionManager | null>(null);

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const totalAmount = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalItems = items.length; // Nombre d'articles (lignes), pas de quantités

  // Auto-scroll to bottom when new items are added
  useEffect(() => {
    if (scrollManagerRef.current && items.length > 0) {
      // Small delay to ensure DOM is updated with new item
      const timeoutId = setTimeout(() => {
        if (scrollManagerRef.current) {
          scrollManagerRef.current.scrollToBottom();
        }
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [items.length]);

  const handleEditClick = (item: SaleItem) => {
    setEditingItem(item);
    setEditQuantity((item.quantity || 1).toString());
    setEditWeight((item.weight || 0).toString());
    setEditPrice(item.price.toString());
    setEditPresetId(item.presetId || '');
    setEditNotes(item.notes || '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      const newQuantity = parseInt(editQuantity, 10);
      const newWeight = parseFloat(editWeight);
      const newPrice = parseFloat(editPrice);

      if (!isNaN(newQuantity) && !isNaN(newWeight) && !isNaN(newPrice) &&
          newQuantity > 0 && newWeight > 0 && newPrice >= 0) {
        onUpdateItem(editingItem.id, newQuantity, newWeight, newPrice, editPresetId || undefined, editNotes || undefined);
        setEditingItem(null);
        setEditQuantity('');
        setEditWeight('');
        setEditPrice('');
        setEditPresetId('');
        setEditNotes('');
      }
    }
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditQuantity('');
    setEditWeight('');
    setEditPrice('');
    setEditPresetId('');
    setEditNotes('');
  };

  return (
    <>
      <TicketContainer>
        <TicketHeader>
          <TicketTitle>Ticket de Caisse</TicketTitle>
        </TicketHeader>

        <ScrollableTicketArea>
          <ScrollerWrapper>
            <TicketScroller
              maxHeight="400px"
              onScrollManagerReady={(manager) => {
                scrollManagerRef.current = manager;
              }}
            >
            <TicketHighlighter
              scrollManager={scrollManagerRef.current}
              highlightDuration={800}
            >
                <TicketContent>
                  {items.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', margin: '2rem 0' }}>
                      Aucun article ajouté
                    </p>
                  ) : (
                    items.map((item) => {
                      // Get category and subcategory names - prioritize stored names, then lookup
                      const displayName = item.subcategoryName || item.categoryName ||
                                         (item.subcategory ? getCategoryById(item.subcategory)?.name : null) ||
                                         getCategoryById(item.category)?.name ||
                                         item.category;

                      return (
                        <TicketItem key={item.id}>
                          <ItemInfo>
                            <ItemCategory>{displayName}</ItemCategory>
                            <ItemDetails>
                              {`Qté: ${item.quantity || 1} • ${(item.weight || 0).toFixed(2)} kg • ${(item.price || 0).toFixed(2)} €/unité`}
                              {item.presetId && (
                                <div style={{ marginTop: '2px', fontSize: '0.8rem', color: '#2c5530', fontWeight: 'bold' }}>
                                  Type: {(() => {
                                    const preset = presets.find(p => p.id === item.presetId);
                                    return preset ? preset.name : item.presetId;
                                  })()}
                                </div>
                              )}
                              {item.notes && (
                                <div style={{ marginTop: '2px', fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>
                                  Notes: {item.notes}
                                </div>
                              )}
                            </ItemDetails>
                          </ItemInfo>
                          <ItemTotal>{`${(item.total || 0).toFixed(2)} €`}</ItemTotal>
                          <ItemActions>
                            <ActionButton
                              className="edit"
                              onClick={() => handleEditClick(item)}
                            >
                              <Edit size={12} />
                            </ActionButton>
                            <ActionButton
                              className="delete"
                              onClick={() => onRemoveItem(item.id)}
                            >
                              <Trash2 size={12} />
                            </ActionButton>
                          </ItemActions>
                        </TicketItem>
                      );
                    })
                  )}
                </TicketContent>
              </TicketHighlighter>
            </TicketScroller>
          </ScrollerWrapper>

          <FixedFooter>
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
          </FixedFooter>
        </ScrollableTicketArea>
      </TicketContainer>

      <EditModal $isOpen={!!editingItem} role="dialog" aria-modal="true" aria-label="Modifier l'article">
        <EditModalContent>
          <h3 style={{ display: editingItem ? undefined as any : 'none' }}>Modifier l'article</h3>
          <EditForm onSubmit={handleEditSubmit}>
            <FormGroup>
              <Label>Catégorie</Label>
              <Input
                type="text"
                value={
                  editingItem ? (
                    editingItem.subcategoryName || editingItem.categoryName ||
                    (editingItem.subcategory ? getCategoryById(editingItem.subcategory)?.name : null) ||
                    getCategoryById(editingItem.category)?.name ||
                    editingItem.category
                  ) : ''
                }
                disabled
              />
            </FormGroup>
            <FormGroup>
              <Label>Quantité</Label>
              <Input
                type="number"
                step="1"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                min="1"
                max="9999"
                required
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
              <Label>Prix unitaire</Label>
              <Input
                type="number"
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                min="0"
                max="9999.99"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Type de transaction (optionnel)</Label>
              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {presets.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    style={{
                      padding: '6px 12px',
                      border: editPresetId === preset.id ? '2px solid #2c5530' : '2px solid #ddd',
                      background: editPresetId === preset.id ? '#e8f5e8' : 'white',
                      color: editPresetId === preset.id ? '#2c5530' : '#333',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      minWidth: 'auto'
                    }}
                    onClick={() => setEditPresetId(editPresetId === preset.id ? '' : preset.id)}
                  >
                    {preset.name}
                  </Button>
                ))}
                {editPresetId && (
                  <Button
                    type="button"
                    style={{
                      padding: '6px 12px',
                      background: '#f0f0f0',
                      border: '2px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                    onClick={() => setEditPresetId('')}
                  >
                    ✕ Aucun
                  </Button>
                )}
              </div>
            </FormGroup>

            <FormGroup>
              <Label>Notes (optionnel)</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Ajouter des notes pour cette transaction..."
                minRows={2}
                maxRows={4}
                style={{ marginTop: '8px' }}
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
