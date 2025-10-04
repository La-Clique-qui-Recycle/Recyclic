import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Save, Trash2, Edit, Receipt, X } from 'lucide-react';
import { useReception } from '../../contexts/ReceptionContext';
import { receptionService } from '../../services/receptionService';
import NumericKeypad from '../../components/ui/NumericKeypad';
import SessionHeader from '../../components/SessionHeader';
import { useCategoryStore } from '../../stores/categoryStore';
import {
  handleWeightKey,
  formatWeightDisplay,
  clearWeight,
  backspaceWeight,
  applyDigit,
  applyDecimalPoint,
  parseWeight,
} from '../../utils/weightMask';

// ===== LAYOUT PREFERENCES =====
const LAYOUT_STORAGE_KEY = 'recyclic_ticket_layout';

interface LayoutPreferences {
  categoriesSize: number;
  weighPadSize: number;
}

const DEFAULT_LAYOUT: LayoutPreferences = {
  categoriesSize: 20, // 20% for categories
  weighPadSize: 60,   // 60% for weight pad, 40% for controls
};

const loadLayoutPreferences = (): LayoutPreferences => {
  try {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
};

const saveLayoutPreferences = (layout: LayoutPreferences) => {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch (error) {
    console.error('Failed to save layout preferences:', error);
  }
};

// ===== KIOSK MODE LAYOUT =====

const KioskContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
`;

const MainLayout = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  max-height: calc(100vh - 60px);

  @media (max-width: 768px) {
    flex-direction: column;
    overflow-y: auto;  /* Page scrollable sur mobile */
    overflow-x: hidden;
  }
`;

// ===== CATEGORIES COLUMN =====

const CategoriesColumn = styled.div`
  background: white;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  @media (max-width: 900px) and (min-width: 769px) {
    overflow-y: auto;  /* Scroll si nécessaire */
  }

  @media (max-width: 768px) {
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
    flex-shrink: 0;
    overflow: visible;
  }
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 12px;

  @media (max-width: 1024px) and (min-width: 769px) {
    grid-template-columns: 1fr;
    gap: 6px;
    padding: 10px;
  }

  @media (max-width: 768px) {
    display: grid;
    grid-template-rows: repeat(2, minmax(50px, 50px));  /* 2 lignes 50px */
    grid-auto-flow: column;  /* Remplir par colonnes */
    grid-auto-columns: 140px;  /* Largeur fixe */
    gap: 6px;
    padding: 8px;
    overflow-x: auto;  /* Scroll horizontal */
    overflow-y: hidden;
  }
`;

const CategoryButton = styled.button<{ $selected?: boolean }>`
  padding: 10px 8px;
  border: 2px solid ${props => props.$selected ? '#2e7d32' : '#e0e0e0'};
  border-radius: 6px;
  background: ${props => props.$selected ? '#e8f5e8' : 'white'};
  color: ${props => props.$selected ? '#2e7d32' : '#333'};
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    border-color: #2e7d32;
    background: #e8f5e8;
  }

  @media (max-width: 1024px) and (min-width: 769px) {
    font-size: 11px;
    padding: 8px 6px;
  }

  @media (max-width: 768px) {
    font-size: 10px;
    padding: 8px 6px;
    min-height: 40px;
    width: 100%;  /* Prend toute la largeur de la cellule */
    height: 100%;  /* Prend toute la hauteur */
  }
`;

// ===== CENTER COLUMN: ENTRY ZONE =====

const CenterColumn = styled.div`
  background: white;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  flex: 1;

  @media (max-width: 1024px) and (min-width: 769px) {
    padding: 12px;
  }

  @media (max-width: 768px) {
    padding: 10px;
    overflow: visible;  /* Pas de scroll interne sur mobile */
    flex: none;  /* Prend la hauteur naturelle */
  }
`;

const EntryLayout = styled.div`
  display: flex;
  gap: 16px;
  flex: 1;
  overflow: hidden;

  @media (max-width: 900px) {
    flex-direction: column;
    overflow: visible;  /* Pas de scroll interne */
    flex: none;  /* Hauteur naturelle */
  }
`;

const WeighPadColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 280px;

  @media (max-width: 768px) {
    min-width: 0;
    padding-bottom: 16px;
    margin-bottom: 16px;
    border-bottom: 2px solid #e0e0e0;  /* Trait de séparation */
  }
`;

const ControlsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: space-between;
  min-width: 250px;
  padding-left: 16px;
  border-left: 2px solid #e0e0e0;  /* Ligne grise séparation */

  @media (max-width: 768px) {
    min-width: 0;
    padding-left: 0;
    border-left: none;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #333;
  font-size: 14px;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const WeightDisplay = styled.input`
  width: 100%;
  padding: 8px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 28px;
  text-align: center;
  font-weight: bold;
  background: #f9f9f9;
  color: #333;
  height: 50px;

  &:focus {
    outline: none;
    border-color: #2e7d32;
  }

  @media (max-width: 1024px) and (min-width: 769px) {
    font-size: 24px;
    height: 45px;
  }

  @media (max-width: 768px) {
    font-size: 22px;
    height: 40px;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #2e7d32;
  }

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 10px;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  resize: vertical;
  min-height: 60px;
  max-height: 100px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #2e7d32;
  }

  @media (max-width: 768px) {
    font-size: 12px;
    min-height: 50px;
  }
`;

const AddButton = styled.button`
  width: 100%;
  padding: 12px;
  background: #2e7d32;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: #1b5e20;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 10px;
  }
`;

// ===== RESIZE HANDLE =====

const ResizeHandleStyled = styled.div`
  position: relative;
  width: 6px;
  background: #d0d0d0;  /* Gris visible */
  cursor: col-resize;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  /* Indicateur visuel (3 points) */
  &::after {
    content: '⋮';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #999;
    font-size: 18px;
    line-height: 6px;
    opacity: 0.7;
  }

  &:hover {
    background: #2e7d32;
    width: 8px;

    &::after {
      color: white;
      opacity: 1;
    }
  }

  &:active {
    background: #1b5e20;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

// ===== RIGHT OVERLAY: TICKET DRAWER =====

const DrawerOverlay = styled.div<{ $isOpen?: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: opacity 0.3s, visibility 0.3s;
`;

const DrawerContainer = styled.div<{ $isOpen?: boolean }>`
  position: fixed;
  top: 0;
  right: ${props => props.$isOpen ? '0' : '-400px'};
  width: 400px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 12px rgba(0,0,0,0.2);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transition: right 0.3s;

  @media (max-width: 600px) {
    width: 100%;
    right: ${props => props.$isOpen ? '0' : '-100%'};
  }
`;

const DrawerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f9f9f9;
`;

const DrawerTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DrawerCloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #666;
  transition: color 0.2s;

  &:hover {
    color: #333;
  }
`;

const DrawerContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const TicketTrigger = styled.button<{ $isOpen?: boolean }>`
  position: fixed;
  right: ${props => props.$isOpen ? '400px' : '0'};
  top: 50%;
  transform: translateY(-50%);
  background: #2e7d32;
  color: white;
  border: none;
  border-radius: 8px 0 0 8px;
  padding: 20px 12px;
  cursor: pointer;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 14px;
  font-weight: 600;
  z-index: 998;
  box-shadow: -2px 2px 8px rgba(0,0,0,0.2);
  transition: right 0.3s, background-color 0.2s;

  &:hover {
    background: #1b5e20;
  }

  @media (max-width: 600px) {
    right: ${props => props.$isOpen ? '100%' : '0'};
  }
`;

const LineItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 10px;
  background: #f9f9f9;
`;

const LineInfo = styled.div`
  flex: 1;
`;

const LineCategory = styled.div`
  font-weight: 600;
  color: #2e7d32;
  margin-bottom: 5px;
  font-size: 15px;
`;

const LineDetails = styled.div`
  font-size: 13px;
  color: #666;
  line-height: 1.5;
`;

const LineActions = styled.div`
  display: flex;
  gap: 6px;
`;

const ActionButton = styled.button`
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;

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

const EmptyState = styled.div`
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 40px 20px;
`;

const TicketInfo = styled.div`
  text-align: center;
  color: #666;
  font-size: 13px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 18px;
  color: #666;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 20px;
`;

const ErrorMessage = styled.div`
  color: #c62828;
  font-size: 18px;
  text-align: center;
  max-width: 600px;
`;

// ===== TYPES =====

interface Ticket {
  id: string;
  status: string;
  created_at: string;
  lignes?: TicketLine[];
  lines?: TicketLine[];
}

interface TicketLine {
  id: string;
  poids_kg?: number;
  weight?: number;
  destination: 'MAGASIN' | 'RECYCLAGE' | 'DECHETERIE';
  created_at?: string;
  updated_at?: string;
  dom_category_id?: string;
  dom_category_label?: string;
  category?: string;
  notes?: string;
  timestamp?: string;
}

// ===== CONSTANTS =====

const DESTINATIONS = [
  { value: 'MAGASIN', label: 'Magasin' },
  { value: 'RECYCLAGE', label: 'Recyclage' },
  { value: 'DECHETERIE', label: 'Déchetterie' }
];

// ===== COMPONENT =====

const TicketForm: React.FC = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams<{ ticketId: string }>();
  const { currentTicket, isLoading, addLineToTicket, updateTicketLine, deleteTicketLine, closeTicket } = useReception();
  const { activeCategories, fetchCategories } = useCategoryStore();

  const [loadedTicket, setLoadedTicket] = useState<Ticket | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [weightInput, setWeightInput] = useState<string>('');
  const [destination, setDestination] = useState<'MAGASIN' | 'RECYCLAGE' | 'DECHETERIE'>('MAGASIN');
  const [notes, setNotes] = useState<string>('');
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const weightInputRef = useRef<HTMLInputElement>(null);

  const formattedWeight = formatWeightDisplay(weightInput);

  const parseToInput = (val: number | string): string => {
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
    if (!Number.isFinite(num)) return '';
    return num.toString();
  };

  // Map categories from store to the format expected by the component
  const categories = activeCategories.map(cat => ({
    id: cat.id,
    label: cat.name,
    slug: cat.name.toLowerCase().replace(/\s+/g, '-')
  }));

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const loadTicket = async () => {
      if (!ticketId) return;

      setLoadingTicket(true);
      setTicketError(null);
      try {
        const ticketData = await receptionService.getTicket(ticketId);
        setLoadedTicket(ticketData);

        if (ticketData.status === 'closed') {
          setTicketError('Ce ticket est fermé et ne peut pas être modifié');
        }
      } catch (err) {
        console.error('Erreur lors du chargement du ticket:', err);
        setTicketError('Impossible de charger les détails du ticket');
      } finally {
        setLoadingTicket(false);
      }
    };

    loadTicket();
  }, [ticketId]);

  const ticket = ticketId ? loadedTicket : currentTicket;
  const isTicketClosed = ticket?.status === 'closed';
  const lines: TicketLine[] = (ticket as Ticket)?.lignes || (ticket as Ticket)?.lines || [];

  const handleAddLine = async () => {
    if (isTicketClosed) {
      alert('Ce ticket est fermé et ne peut pas être modifié');
      return;
    }

    if (!selectedCategory || !weightInput) {
      alert('Veuillez sélectionner une catégorie et saisir un poids');
      return;
    }

    try {
      if (ticketId) {
        await receptionService.addLineToTicket(ticketId, {
          dom_category_id: selectedCategory,
          weight: parseWeight(formattedWeight),
          destination,
          notes: notes || undefined
        });
        const updatedTicket = await receptionService.getTicket(ticketId);
        setLoadedTicket(updatedTicket);
      } else {
        await addLineToTicket(currentTicket.id, {
          dom_category_id: selectedCategory,
          weight: parseWeight(formattedWeight),
          destination,
          notes: notes || undefined
        });
      }

      setSelectedCategory('');
      setWeightInput('');
      setDestination('MAGASIN');
      setNotes('');
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la ligne:', err);
    }
  };

  const handleUpdateLine = async (lineId: string) => {
    if (isTicketClosed) {
      alert('Ce ticket est fermé et ne peut pas être modifié');
      return;
    }

    if (!selectedCategory || !weightInput) {
      alert('Veuillez sélectionner une catégorie et saisir un poids');
      return;
    }

    try {
      if (ticketId) {
        await receptionService.updateTicketLine(ticketId, lineId, {
          dom_category_id: selectedCategory,
          weight: parseWeight(formattedWeight),
          destination,
          notes: notes || undefined
        });
        const updatedTicket = await receptionService.getTicket(ticketId);
        setLoadedTicket(updatedTicket);
      } else {
        await updateTicketLine(currentTicket.id, lineId, {
          dom_category_id: selectedCategory,
          weight: parseWeight(formattedWeight),
          destination,
          notes: notes || undefined
        });
      }

      setEditingLineId(null);
      setSelectedCategory('');
      setWeightInput('');
      setDestination('MAGASIN');
      setNotes('');
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la ligne:', err);
    }
  };

  const handleDeleteLine = async (lineId: string) => {
    if (isTicketClosed) {
      alert('Ce ticket est fermé et ne peut pas être modifié');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette ligne ?')) {
      try {
        if (ticketId) {
          await receptionService.deleteTicketLine(ticketId, lineId);
          const updatedTicket = await receptionService.getTicket(ticketId);
          setLoadedTicket(updatedTicket);
        } else {
          await deleteTicketLine(currentTicket.id, lineId);
        }
      } catch (err) {
        console.error('Erreur lors de la suppression de la ligne:', err);
      }
    }
  };

  const handleEditLine = (line: TicketLine) => {
    setEditingLineId(line.id);
    setSelectedCategory(line.dom_category_id || line.category || '');
    const initial = (line.poids_kg || line.weight || 0);
    setWeightInput(parseToInput(initial));
    setDestination(line.destination);
    setNotes(line.notes || '');
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setTimeout(() => {
      if (weightInputRef.current) {
        weightInputRef.current.focus();
      }
    }, 100);
  };

  const handleCloseTicket = async () => {
    if (isTicketClosed) {
      alert('Ce ticket est déjà fermé');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir clôturer ce ticket ?')) {
      try {
        if (ticketId) {
          await receptionService.closeTicket(ticketId);
          navigate('/reception');
        } else {
          await closeTicket(currentTicket.id);
          navigate('/reception');
        }
      } catch (err) {
        console.error('Erreur lors de la clôture du ticket:', err);
      }
    }
  };

  const isEditing = editingLineId !== null;

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    if (/^[0-9]$/.test(key) || key === 'Backspace' || key === 'Delete' || key === '.' || key === ',') {
      e.preventDefault();
      setWeightInput((prev) => handleWeightKey(prev, key));
    } else if (key === 'Enter') {
      e.preventDefault();
      if (selectedCategory && weightInput) {
        if (isEditing) {
          handleUpdateLine(editingLineId!);
        } else {
          handleAddLine();
        }
      }
    }
  }, [selectedCategory, weightInput, isEditing, editingLineId]);

  // Layout preferences
  const [layoutPrefs] = useState<LayoutPreferences>(loadLayoutPreferences());

  // Detect mobile/desktop
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLayoutChange = (sizes: number[]) => {
    const [categoriesSize, weighPadSize] = sizes;
    if (categoriesSize && weighPadSize) {
      const newPrefs: LayoutPreferences = {
        categoriesSize: Math.round(categoriesSize),
        weighPadSize: Math.round(weighPadSize),
      };
      saveLayoutPreferences(newPrefs);
    }
  };

  if (loadingTicket) {
    return <LoadingMessage>Chargement du ticket...</LoadingMessage>;
  }

  if (ticketError && !ticket) {
    return (
      <ErrorContainer>
        <ErrorMessage>{ticketError}</ErrorMessage>
      </ErrorContainer>
    );
  }

  if (!ticket) {
    if (ticketId) {
      return <LoadingMessage>Chargement du ticket...</LoadingMessage>;
    }
    return (
      <ErrorContainer>
        <ErrorMessage>Erreur: Aucun ticket en cours</ErrorMessage>
      </ErrorContainer>
    );
  }

  return (
    <KioskContainer>
      <SessionHeader
        ticketId={ticket.id}
        onBack={() => navigate('/reception')}
        onCloseTicket={handleCloseTicket}
        isLoading={isLoading}
      />

      <MainLayout>
        {isMobile ? (
          /* MOBILE LAYOUT - Vertical stacking, no resize panels */
          <>
            <CategoriesColumn>
              <CategoryGrid>
                {categories.map((category) => (
                  <CategoryButton
                    key={category.id}
                    $selected={selectedCategory === category.id}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    {category.label}
                  </CategoryButton>
                ))}
              </CategoryGrid>
            </CategoriesColumn>

            <CenterColumn>
              {!isTicketClosed && (
                <EntryLayout>
                  <WeighPadColumn>
                    <FormGroup>
                      <Label>Poids (kg) *</Label>
                      <WeightDisplay
                        ref={weightInputRef}
                        type="text"
                        value={formattedWeight}
                        onChange={() => {}}
                        onKeyDown={onKeyDown}
                        placeholder="0.00"
                        readOnly
                      />
                    </FormGroup>

                    <NumericKeypad
                      onKeyPress={(key) => {
                        if (key === 'C') return;
                        if (key === '.') {
                          setWeightInput((prev) => applyDecimalPoint(prev));
                        } else if (/^[0-9]$/.test(key)) {
                          setWeightInput((prev) => applyDigit(prev, key));
                        }
                      }}
                      onClear={() => setWeightInput(clearWeight())}
                      onBackspace={() => setWeightInput((prev) => backspaceWeight(prev))}
                    />
                  </WeighPadColumn>

                  <ControlsColumn>
                    <FormGroup>
                      <Label>Destination</Label>
                      <Select
                        value={destination}
                        onChange={(e) => setDestination(e.target.value as 'MAGASIN' | 'RECYCLAGE' | 'DECHETERIE')}
                      >
                        {DESTINATIONS.map((dest) => (
                          <option key={dest.value} value={dest.value}>
                            {dest.label}
                          </option>
                        ))}
                      </Select>
                    </FormGroup>

                    <FormGroup>
                      <Label>Notes (optionnel)</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notes sur l'objet..."
                      />
                    </FormGroup>

                    <AddButton
                      onClick={isEditing ? () => handleUpdateLine(editingLineId!) : handleAddLine}
                      disabled={isLoading || !selectedCategory || !weightInput}
                    >
                      <Save size={18} />
                      {isEditing ? 'Mettre à jour' : 'Ajouter l\'objet'}
                    </AddButton>
                  </ControlsColumn>
                </EntryLayout>
              )}
            </CenterColumn>
          </>
        ) : (
          /* DESKTOP LAYOUT - Horizontal with resize panels */
          <PanelGroup direction="horizontal" onLayout={handleLayoutChange}>
            {/* LEFT PANEL: Categories */}
            <Panel defaultSize={layoutPrefs.categoriesSize} minSize={15} maxSize={30}>
              <CategoriesColumn>
                <CategoryGrid>
                  {categories.map((category) => (
                    <CategoryButton
                      key={category.id}
                      $selected={selectedCategory === category.id}
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      {category.label}
                    </CategoryButton>
                  ))}
                </CategoryGrid>
              </CategoriesColumn>
            </Panel>

            <PanelResizeHandle>
              <ResizeHandleStyled />
            </PanelResizeHandle>

            {/* CENTER PANEL: Entry Zone */}
            <Panel minSize={50}>
              <CenterColumn>
                {!isTicketClosed && (
                  <EntryLayout>
                    <PanelGroup direction="horizontal">
                      {/* Weight Pad Panel (LEFT - 60%) */}
                      <Panel defaultSize={layoutPrefs.weighPadSize} minSize={40} maxSize={70}>
                        <WeighPadColumn>
                          <FormGroup>
                            <Label>Poids (kg) *</Label>
                            <WeightDisplay
                              ref={weightInputRef}
                              type="text"
                              value={formattedWeight}
                              onChange={() => {}}
                              onKeyDown={onKeyDown}
                              placeholder="0.00"
                              readOnly
                            />
                          </FormGroup>

                          <NumericKeypad
                            onKeyPress={(key) => {
                              if (key === 'C') return;
                              if (key === '.') {
                                setWeightInput((prev) => applyDecimalPoint(prev));
                              } else if (/^[0-9]$/.test(key)) {
                                setWeightInput((prev) => applyDigit(prev, key));
                              }
                            }}
                            onClear={() => setWeightInput(clearWeight())}
                            onBackspace={() => setWeightInput((prev) => backspaceWeight(prev))}
                          />
                        </WeighPadColumn>
                      </Panel>

                      <PanelResizeHandle>
                        <ResizeHandleStyled />
                      </PanelResizeHandle>

                      {/* Controls Panel (RIGHT - 40%) */}
                      <Panel minSize={30}>
                        <ControlsColumn>
                          <FormGroup>
                            <Label>Destination</Label>
                            <Select
                              value={destination}
                              onChange={(e) => setDestination(e.target.value as 'MAGASIN' | 'RECYCLAGE' | 'DECHETERIE')}
                            >
                              {DESTINATIONS.map((dest) => (
                                <option key={dest.value} value={dest.value}>
                                  {dest.label}
                                </option>
                              ))}
                            </Select>
                          </FormGroup>

                          <FormGroup>
                            <Label>Notes (optionnel)</Label>
                            <Textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Notes sur l'objet..."
                            />
                          </FormGroup>

                          <AddButton
                            onClick={isEditing ? () => handleUpdateLine(editingLineId!) : handleAddLine}
                            disabled={isLoading || !selectedCategory || !weightInput}
                          >
                            <Save size={18} />
                            {isEditing ? 'Mettre à jour' : 'Ajouter l\'objet'}
                          </AddButton>
                        </ControlsColumn>
                      </Panel>
                    </PanelGroup>
                  </EntryLayout>
                )}
              </CenterColumn>
            </Panel>
          </PanelGroup>
        )}
      </MainLayout>

      {/* TICKET DRAWER (Overlay) */}
      <DrawerOverlay $isOpen={isDrawerOpen} onClick={() => setIsDrawerOpen(false)} />

      <DrawerContainer $isOpen={isDrawerOpen}>
        <DrawerHeader>
          <DrawerTitle>
            <Receipt size={20} />
            Ticket #{ticket.id.slice(-8)}
          </DrawerTitle>
          <DrawerCloseButton onClick={() => setIsDrawerOpen(false)}>
            <X size={24} />
          </DrawerCloseButton>
        </DrawerHeader>

        <DrawerContent>
          <TicketInfo>
            {new Date(ticket.created_at || Date.now()).toLocaleString('fr-FR')}
          </TicketInfo>

          <h4 style={{ marginTop: 0, marginBottom: '12px', color: '#333' }}>
            Lignes du ticket ({lines.length})
          </h4>

          {lines.length === 0 ? (
            <EmptyState>Aucune ligne ajoutée</EmptyState>
          ) : (
            lines.map((line: TicketLine) => (
              <LineItem key={line.id}>
                <LineInfo>
                  <LineCategory>
                    {line.dom_category_label ||
                     categories.find(cat => cat.id === line.dom_category_id)?.label ||
                     line.dom_category_id ||
                     line.category || 'N/A'}
                  </LineCategory>
                  <LineDetails>
                    {line.poids_kg || line.weight}kg - {DESTINATIONS.find(d => d.value === line.destination)?.label}
                    {line.notes && <><br />{line.notes}</>}
                  </LineDetails>
                </LineInfo>
                {!isTicketClosed && (
                  <LineActions>
                    <ActionButton
                      className="edit"
                      onClick={() => {
                        handleEditLine(line);
                        setIsDrawerOpen(false);
                      }}
                      disabled={isLoading}
                    >
                      <Edit size={14} />
                    </ActionButton>
                    <ActionButton
                      className="delete"
                      onClick={() => handleDeleteLine(line.id)}
                      disabled={isLoading}
                    >
                      <Trash2 size={14} />
                    </ActionButton>
                  </LineActions>
                )}
              </LineItem>
            ))
          )}
        </DrawerContent>
      </DrawerContainer>

      <TicketTrigger $isOpen={isDrawerOpen} onClick={() => setIsDrawerOpen(!isDrawerOpen)}>
        Voir le Ticket ({lines.length})
      </TicketTrigger>
    </KioskContainer>
  );
};

export default TicketForm;
