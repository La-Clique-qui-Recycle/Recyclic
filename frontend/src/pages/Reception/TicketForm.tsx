import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Save, Trash2, Edit, Receipt, X } from 'lucide-react';
import { useReception } from '../../contexts/ReceptionContext';
import { receptionService } from '../../services/receptionService';
import NumericKeypad from '../../components/ui/NumericKeypad';
import SessionHeader from '../../components/SessionHeader';
import { useStepState } from '../../services/sessionState';
import { useCategoryStore } from '../../stores/categoryStore';
import { useReceptionShortcutStore } from '../../stores/receptionShortcutStore';
import {
  handleWeightKey,
  handleAZERTYWeightKey,
  formatWeightDisplay,
  clearWeight,
  backspaceWeight,
  applyDigit,
  applyDecimalPoint,
  parseWeight,
} from '../../utils/weightMask';

// ===== LAYOUT PREFERENCES =====
const LAYOUT_STORAGE_KEY = 'recyclique_ticket_layout';

interface LayoutPreferences {
  categoriesSize: number;
  centerSize: number;
  summarySize: number;
}

const DEFAULT_LAYOUT: LayoutPreferences = {
  categoriesSize: 25, // 25% for categories (augmenté pour boutons plus grands)
  centerSize: 50,     // 50% for center workspace
  summarySize: 25,    // 25% for summary
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

const CategoryGrid = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: ${props => {
    const cols = props.$columns || 2;
    return `repeat(${cols}, 1fr)`;
  }} !important;
  gap: 6px;
  padding: 8px;

  @media (max-width: 768px) {
    display: grid;
    grid-template-rows: repeat(2, minmax(44px, 44px));
    grid-auto-flow: column;
    grid-auto-columns: 140px;
    gap: 5px;
    padding: 6px;
    overflow-x: auto;
    overflow-y: hidden;
  }
`;

const CategoryButton = styled.button<{ $selected?: boolean }>`
  padding: 12px 10px;
  min-height: 60px;
  border: 2px solid ${props => props.$selected ? '#2e7d32' : '#e0e0e0'};
  border-radius: 8px;
  background: ${props => props.$selected ? '#e8f5e8' : 'white'};
  color: ${props => props.$selected ? '#2e7d32' : '#333'};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;

  &:hover {
    border-color: #2e7d32;
    background: #e8f5e8;
  }

  @media (max-width: 1024px) and (min-width: 769px) {
    font-size: 13px;
    padding: 10px 8px;
    min-height: 55px;
  }

  @media (max-width: 768px) {
    font-size: 13px;
    padding: 10px 8px;
    min-height: 55px;
    width: 100%;
    height: 100%;
  }
`;

const ShortcutBadge = styled.div`
  position: absolute;
  bottom: 4px;
  left: 6px;
  background: rgba(46, 125, 50, 0.9);
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 4px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  z-index: 1;

  @media (max-width: 768px) {
    font-size: 9px;
    padding: 1px 3px;
    bottom: 3px;
    left: 4px;
  }
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  font-size: 11px;
  font-weight: 500;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;

  &:hover {
    background: #f0f0f0;
    border-color: #999;
  }
`;

const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 12px;
  flex: 1;
  overflow: hidden;
  min-height: 20px;
`;

const BreadcrumbItem = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  color: #2e7d32;
  font-weight: 500;
`;

// ===== BREADCRUMB FOR CENTER COLUMN =====

const CenterBreadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
`;

const CenterBreadcrumbItem = styled.span`
  color: #2e7d32;
  font-weight: 500;
`;

const CenterBreadcrumbSeparator = styled.span`
  color: #999;
  margin: 0 4px;
`;

// ===== CENTER WORKSPACE COLUMN =====

const CenterWorkspace = styled.div`
  background: white;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  flex: 1;

  @media (max-width: 1024px) and (min-width: 769px) {
    padding: 8px;
  }

  @media (max-width: 768px) {
    padding: 8px;
    overflow: visible;
    flex: none;
  }
`;

const WorkspaceContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0; /* Permet au contenu de se compresser */
  padding: 0 4px; /* Réduire l'espacement latéral */
`;

const WeightSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0; /* Ne pas compresser cette section */
  transition: all 0.3s ease;
`;

// Layout 2 colonnes pour le bloc central (keypad + contrôles)
const CentralBlockLayout = styled.div`
  display: grid;
  grid-template-columns: 60% 40%;
  gap: 12px;
  margin: 2px 0;
  flex-shrink: 0;
  padding: 4px;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 55% 45%;
    gap: 10px;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    gap: 8px;
  }
`;

const NumericPadSection = styled.div`
  display: flex;
  justify-content: center;
  flex-shrink: 0;
  padding: 4px;
  width: 100%;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const ControlsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px; /* Espacement amélioré pour hiérarchie visuelle */
  flex-shrink: 0;
  width: 100%;

  @media (max-width: 768px) {
    margin-top: 0;
    gap: 10px;
  }
`;

// ===== RIGHT SUMMARY COLUMN =====

const SummaryColumn = styled.div`
  background: #f9f9f9;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: calc(100vh - 120px); /* Laisser de l'espace pour le header */

  @media (max-width: 768px) {
    border-left: none;
    border-top: 1px solid #e0e0e0;
    flex-shrink: 0;
    height: auto;
    max-height: none;
    overflow: visible;
  }
`;

const SummaryHeader = styled.div`
  padding: 12px 16px;
  background: #f0f0f0;
  border-bottom: 1px solid #e0e0e0;
  font-weight: 600;
  color: #333;
  font-size: 14px;
`;

const SummaryContent = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  min-height: 0; /* Permet au contenu de scroller correctement */
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 8px;
  background: white;
`;

const SummaryItemInfo = styled.div`
  flex: 1;
`;

const SummaryItemCategory = styled.div`
  font-weight: 600;
  color: #2e7d32;
  margin-bottom: 4px;
  font-size: 13px;
`;

const SummaryItemDetails = styled.div`
  font-size: 12px;
  color: #666;
  line-height: 1.4;
`;

const SummaryItemActions = styled.div`
  display: flex;
  gap: 4px;
`;

const SummaryActionButton = styled.button`
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

const SummaryEmptyState = styled.div`
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 20px;
  font-size: 13px;
`;

const SummaryStats = styled.div`
  padding: 12px;
  background: #f0f0f0;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
  color: #666;
  text-align: center;
`;

// ===== LEGACY COMPONENTS (TO BE REMOVED) =====
// Ces composants sont conservés pour compatibilité mais ne sont plus utilisés
// dans le nouveau layout à 3 colonnes

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #333;
  font-size: 13px;

  @media (max-width: 768px) {
    font-size: 11px;
  }
`;

const WeightDisplay = styled.input`
  width: 100%;
  padding: 8px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 20px;
  text-align: center;
  font-weight: bold;
  background: #f9f9f9;
  color: #333;
  height: 48px;
  min-height: 48px;

  &:focus {
    outline: none;
    border-color: #2e7d32;
  }

  @media (max-width: 1024px) and (min-width: 769px) {
    font-size: 18px;
    height: 44px;
    min-height: 44px;
  }

  @media (max-width: 768px) {
    font-size: 16px;
    height: 40px;
    min-height: 40px;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  cursor: pointer;
  min-height: 44px; /* Touch target minimum iOS */

  &:focus {
    outline: none;
    border-color: #2e7d32;
    box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.2);
  }

  @media (max-width: 768px) {
    font-size: 12px;
    padding: 10px;
    min-height: 48px; /* Touch target minimum Android */
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 12px;
  resize: vertical;
  min-height: 44px; /* Touch target minimum iOS */
  max-height: 80px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #2e7d32;
    box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.2);
  }

  @media (max-width: 768px) {
    font-size: 11px;
    min-height: 48px; /* Touch target minimum Android */
    max-height: 60px;
  }
`;

const AddButton = styled.button`
  width: 100%;
  padding: 12px;
  min-height: 44px; /* Touch target minimum iOS */
  background: #2e7d32;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  &:focus {
    outline: 2px solid #2e7d32;
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    min-height: 48px; /* Touch target minimum Android */
    padding: 14px;
  }

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
    font-size: 12px;
    padding: 6px;
    min-height: 36px;
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
  category_id?: string;
  category_label?: string;
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

// ===== CUSTOM HOOK FOR RESPONSIVE COLUMNS =====

/**
 * Hook pour détecter la largeur d'un conteneur et déterminer le nombre optimal de colonnes
 * Breakpoints basés sur la largeur du conteneur (pas de l'écran) :
 * - < 200px : 1 colonne
 * - 200-350px : 2 colonnes
 * - 350-500px : 3 colonnes
 * - 500-650px : 4 colonnes
 * - >= 650px : 5 colonnes
 */
const useColumnCount = (containerRef: React.RefObject<HTMLElement>): number => {
  const [columnCount, setColumnCount] = useState(2); // Par défaut 2 colonnes

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      // Réessayer après un court délai
      const timeoutId = setTimeout(() => {
        const retryContainer = containerRef.current;
        if (retryContainer) {
          const width = retryContainer.offsetWidth || retryContainer.clientWidth;
          let newCount = 2;
          if (width < 200) {
            newCount = 1;
          } else if (width < 350) {
            newCount = 2;
          } else if (width < 500) {
            newCount = 3;
          } else if (width < 650) {
            newCount = 4;
          } else {
            newCount = 5;
          }
          setColumnCount(newCount);
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }

    const updateColumnCount = () => {
      const width = container.offsetWidth || container.clientWidth;
      let newCount = 2;
      if (width < 200) {
        newCount = 1;
      } else if (width < 350) {
        newCount = 2;
      } else if (width < 500) {
        newCount = 3;
      } else if (width < 650) {
        newCount = 4;
      } else {
        newCount = 5;
      }
      setColumnCount(prev => {
        if (prev !== newCount) {
          return newCount;
        }
        return prev;
      });
    };

    // Initial update
    updateColumnCount();

    // Observer pour détecter les changements de taille
    const resizeObserver = new ResizeObserver(() => {
      updateColumnCount();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []); // S'exécute une seule fois au montage

  // Réexécuter périodiquement pour capturer les changements de taille
  useEffect(() => {
    const intervalId = setInterval(() => {
      const container = containerRef.current;
      if (container) {
        const width = container.offsetWidth || container.clientWidth;
        let newCount = 2;
        if (width < 200) {
          newCount = 1;
        } else if (width < 350) {
          newCount = 2;
        } else if (width < 500) {
          newCount = 3;
        } else if (width < 650) {
          newCount = 4;
        } else {
          newCount = 5;
        }
        setColumnCount(prev => prev !== newCount ? newCount : prev);
      }
    }, 300); // Vérifier toutes les 300ms

    return () => clearInterval(intervalId);
  }, []);

  return columnCount;
};

// ===== COMPONENT =====

const TicketForm: React.FC = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams<{ ticketId: string }>();
  const { currentTicket, isLoading, addLineToTicket, updateTicketLine, deleteTicketLine, closeTicket } = useReception();
  const { visibleCategories, activeCategories, fetchVisibleCategories, fetchCategories, loading: categoriesLoading, error: categoriesError } = useCategoryStore();
  const {
    initializeShortcuts,
    activateShortcuts,
    deactivateShortcuts,
    getKeyForPosition,
    isActive: shortcutsActive
  } = useReceptionShortcutStore();

  // Step state management
  const { stepState, handleCategorySelected, handleWeightInputStarted, handleWeightInputCompleted, handleItemValidated, handleTicketClosed } = useStepState();

  // Refs to store stable references to store functions
  const initializeShortcutsRef = useRef(initializeShortcuts);
  const activateShortcutsRef = useRef(activateShortcuts);
  const deactivateShortcutsRef = useRef(deactivateShortcuts);

  // Update refs when functions change
  useEffect(() => {
    initializeShortcutsRef.current = initializeShortcuts;
    activateShortcutsRef.current = activateShortcuts;
    deactivateShortcutsRef.current = deactivateShortcuts;
  }, [initializeShortcuts, activateShortcuts, deactivateShortcuts]);

  const [loadedTicket, setLoadedTicket] = useState<Ticket | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [weightInput, setWeightInput] = useState<string>('');
  const [destination, setDestination] = useState<'MAGASIN' | 'RECYCLAGE' | 'DECHETERIE'>('MAGASIN');
  const [notes, setNotes] = useState<string>('');
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [weightInputFocused, setWeightInputFocused] = useState<boolean>(false);
  const weightInputRef = useRef<HTMLInputElement>(null);
  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  const summaryContentRef = useRef<HTMLDivElement>(null);
  
  // Hook pour déterminer le nombre de colonnes basé sur la largeur du conteneur
  const columnCount = useColumnCount(categoriesContainerRef);

  // Navigation hiérarchique des catégories
  // Source de vérité : currentParentId gère le niveau hiérarchique actuel
  // - null = niveau racine (catégories avec parent_id === null)
  // - string = ID de la catégorie parent dont on affiche les enfants
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [categoryBreadcrumb, setCategoryBreadcrumb] = useState<string[]>([]);

  const formattedWeight = formatWeightDisplay(weightInput);

  // Ref to store the category select callback to avoid useEffect dependency issues
  const categorySelectCallbackRef = useRef<((categoryId: string) => void) | null>(null);

  // Define handleCategorySelect with useCallback before the useEffect that uses it
  const handleCategorySelect = useCallback((categoryId: string) => {
    const categoriesToUse = visibleCategories.length > 0 ? visibleCategories : activeCategories;
    const category = categoriesToUse.find(cat => cat.id === categoryId);
    if (!category) return;

    // Vérifier si la catégorie a des enfants visibles
    // AC 1.2.2: Si aucune sous-catégorie visible, la catégorie parent est sélectionnable
    const visibleChildren = categoriesToUse.filter(child => child.parent_id === categoryId);
    const hasChildren = visibleChildren.length > 0;

    if (hasChildren) {
      // Navigation vers les sous-catégories
      setCurrentParentId(categoryId);
      setCategoryBreadcrumb(prev => [...prev, category.name]);
      // Reset selection when navigating
      setSelectedCategory('');
    } else {
      // Sélection finale de la catégorie
      setSelectedCategory(categoryId);
      setCurrentParentId(null);
      setCategoryBreadcrumb([]);

      // Notify step state manager
      handleCategorySelected();

      // Focus automatique vers le champ poids après sélection de catégorie
      // Délai court pour permettre au DOM de se mettre à jour
      setTimeout(() => {
        if (weightInputRef.current) {
          weightInputRef.current.focus();
          weightInputRef.current.select(); // Sélectionner tout le texte existant
        }
      }, 100);
    }
  }, [visibleCategories, activeCategories, handleCategorySelected]);

  // Update the ref with the current callback function
  useEffect(() => {
    categorySelectCallbackRef.current = handleCategorySelect;
  }, [handleCategorySelect]);

  const parseToInput = (val: number | string): string => {
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
    if (!Number.isFinite(num)) return '';
    return num.toString();
  };

  // Map categories from store to the format expected by the component
  // Filtrer les catégories selon le niveau hiérarchique actuel
  // Filtrer les catégories selon le niveau hiérarchique
  // Politique de filtrage basée sur currentParentId :
  // - Si currentParentId === null : afficher les catégories racines (parent_id === null)
  // - Si currentParentId === string : afficher les enfants de cette catégorie
  // Filtrer les catégories visibles selon le niveau hiérarchique actuel
  // AC 1.2.1, 1.2.2: Utiliser visibleCategories pour les tickets de réception (ENTRY)
  // Fallback: si visibleCategories est vide, utiliser activeCategories (pour compatibilité avant migration)
  const categoriesToUse = visibleCategories.length > 0 ? visibleCategories : activeCategories;
  const categories = categoriesToUse
    .filter(cat => {
      // Si currentParentId est null, afficher les catégories racines (parent_id === null)
      if (currentParentId === null) {
        return cat.parent_id === null;
      }
      // Sinon, afficher les enfants visibles de currentParentId
      return cat.parent_id === currentParentId;
    })
    .sort((a, b) => {
      // Trier par display_order puis par nom
      if (a.display_order !== b.display_order) {
        return a.display_order - b.display_order;
      }
      return a.name.localeCompare(b.name);
    })
    .map(cat => {
      // AC 1.2.2: Si aucune sous-catégorie visible, la catégorie parent est sélectionnable
      const visibleChildren = categoriesToUse.filter(child => child.parent_id === cat.id);
      return {
        id: cat.id,
        label: cat.name,
        slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
        hasChildren: visibleChildren.length > 0
      };
    });

  useEffect(() => {
    // AC 1.2.1: Charger les catégories visibles pour les tickets de réception (ENTRY)
    // Le store gère automatiquement le fallback si l'endpoint échoue
    fetchVisibleCategories();
  }, [fetchVisibleCategories]);

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

  // Keyboard shortcuts for category selection (positional mapping)
  useEffect(() => {
    if (categories.length > 0 && !isTicketClosed && categorySelectCallbackRef.current) {
      // Initialize shortcuts with the number of categories currently displayed
      initializeShortcutsRef.current(categories.length, (position: number) => {
        // Position is 1-based, array is 0-based
        const categoryIndex = position - 1;
        if (categoryIndex >= 0 && categoryIndex < categories.length) {
          const category = categories[categoryIndex];
          categorySelectCallbackRef.current?.(category.id);
        }
      });

      // Activate shortcuts only when categories are displayed AND weight input is not focused
      if (!weightInputFocused) {
        activateShortcutsRef.current();
      }

      return () => {
        deactivateShortcutsRef.current();
      };
    }
  }, [categories.length, isTicketClosed, weightInputFocused]); // Add weightInputFocused dependency

  const lines: TicketLine[] = (ticket as Ticket)?.lignes || (ticket as Ticket)?.lines || [];

  // Auto-scroll vers le bas quand une nouvelle ligne est ajoutée
  useEffect(() => {
    if (summaryContentRef.current && lines.length > 0) {
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est mis à jour
      requestAnimationFrame(() => {
        if (summaryContentRef.current) {
          summaryContentRef.current.scrollTop = summaryContentRef.current.scrollHeight;
        }
      });
    }
  }, [lines.length]); // Se déclenche quand le nombre de lignes change

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
          category_id: selectedCategory,
          weight: parseWeight(formattedWeight),
          destination,
          notes: notes || undefined
        });
        const updatedTicket = await receptionService.getTicket(ticketId);
        setLoadedTicket(updatedTicket);
      } else {
        await addLineToTicket(currentTicket!.id, {
          category: selectedCategory,
          weight: parseWeight(formattedWeight),
          destination,
          notes: notes || undefined
        });
      }

      setSelectedCategory('');
      setWeightInput('');
      setDestination('MAGASIN');
      setNotes('');

      // Notify step state manager
      handleWeightInputCompleted();
      handleItemValidated();

      // Focus automatique vers les boutons de catégories pour permettre la saisie rapide du prochain objet
      setTimeout(() => {
        if (categoriesContainerRef.current) {
          // Focus sur le premier bouton de catégorie disponible
          const firstCategoryButton = categoriesContainerRef.current.querySelector('[role="button"][tabindex="0"]') as HTMLElement;
          if (firstCategoryButton) {
            firstCategoryButton.focus();
          }
        }
      }, 100);
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
          category_id: selectedCategory,
          weight: parseWeight(formattedWeight),
          destination,
          notes: notes || undefined
        });
        const updatedTicket = await receptionService.getTicket(ticketId);
        setLoadedTicket(updatedTicket);
      } else {
        await updateTicketLine(currentTicket!.id, lineId, {
          category: selectedCategory,
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

      // Notify step state manager
      handleWeightInputCompleted();
      handleItemValidated();
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
          await deleteTicketLine(currentTicket!.id, lineId);
        }
      } catch (err) {
        console.error('Erreur lors de la suppression de la ligne:', err);
      }
    }
  };

  const handleEditLine = (line: TicketLine) => {
    setEditingLineId(line.id);
    setSelectedCategory(line.category_id || line.category || '');
    const initial = (line.poids_kg || line.weight || 0);
    setWeightInput(parseToInput(initial));
    setDestination(line.destination);
    setNotes(line.notes || '');
  };


  const handleCategoryBack = () => {
    if (categoryBreadcrumb.length > 0) {
      // Retirer le dernier élément du breadcrumb
      const newBreadcrumb = categoryBreadcrumb.slice(0, -1);
      setCategoryBreadcrumb(newBreadcrumb);
      
      if (newBreadcrumb.length === 0) {
        // Retour à la racine
        setCurrentParentId(null);
      } else {
        // Retour au parent précédent
        const categoriesToUse = visibleCategories.length > 0 ? visibleCategories : activeCategories;
        const parentCategory = categoriesToUse.find(cat => cat.name === newBreadcrumb[newBreadcrumb.length - 1]);
        setCurrentParentId(parentCategory?.id || null);
      }
      // Reset selection when navigating back
      setSelectedCategory('');
    }
  };

  // Gestion de la navigation clavier
  const handleKeyDown = (event: React.KeyboardEvent, categoryId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCategorySelect(categoryId);
    }
  };

  const handleBackKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCategoryBack();
    }
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
          await closeTicket(currentTicket!.id);
          navigate('/reception');
        }

        // Notify step state manager
        handleTicketClosed();
      } catch (err) {
        console.error('Erreur lors de la clôture du ticket:', err);
      }
    }
  };

  const isEditing = editingLineId !== null;

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    // Utiliser handleAZERTYWeightKey pour supporter les touches AZERTY
    const newWeight = handleAZERTYWeightKey(weightInput, key, e.nativeEvent);
    if (newWeight !== weightInput) {
      e.preventDefault();
      setWeightInput(newWeight);
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

  // Gestionnaire pour le focus du champ poids
  const handleWeightFocus = useCallback(() => {
    setWeightInputFocused(true);
    handleWeightInputStarted();
  }, [handleWeightInputStarted]);

  // Gestionnaire pour la perte de focus du champ poids
  const handleWeightBlur = useCallback(() => {
    setWeightInputFocused(false);
  }, []);

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

  // Visual feedback for focus indicators
  useEffect(() => {
    if (!ticket) return;

    const updateFocusBorder = () => {
      const centerWorkspace = document.querySelector('[data-testid="center-workspace"]') as HTMLElement;
      const categoriesColumn = document.querySelector('[data-testid="categories-column"]') as HTMLElement;

      // Remove all previous feedback
      [centerWorkspace, categoriesColumn].forEach(element => {
        if (element) {
          element.style.borderColor = '';
          element.style.boxShadow = '';
          element.style.borderWidth = '';
          element.style.borderStyle = '';
        }
      });

      const activeElement = document.activeElement;

      // Check where the focus is and apply border accordingly
      const isInCategories = categoriesColumn?.contains(activeElement as Node);
      const isInCenter = centerWorkspace?.contains(activeElement as Node);

      if (isInCategories && categoriesColumn) {
        // Green border around categories column when focus is there
        categoriesColumn.style.borderColor = '#2e7d32';
        categoriesColumn.style.borderWidth = '3px';
        categoriesColumn.style.borderStyle = 'solid';
        categoriesColumn.style.borderRadius = '8px';
        categoriesColumn.style.transition = 'border-color 0.3s ease';
      } else if (isInCenter && centerWorkspace) {
        // Green border around center workspace when focus is there
        centerWorkspace.style.borderColor = '#2e7d32';
        centerWorkspace.style.borderWidth = '3px';
        centerWorkspace.style.borderStyle = 'solid';
        centerWorkspace.style.borderRadius = '8px';
        centerWorkspace.style.transition = 'border-color 0.3s ease';
      }
    };

    // Initial update
    const timeoutId = setTimeout(updateFocusBorder, 100);

    // Listen for focus changes
    const handleFocusChange = () => updateFocusBorder();
    document.addEventListener('focusin', handleFocusChange);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('focusin', handleFocusChange);
    };
  }, [ticket]);

  // Tab navigation management - limit Tab to categories -> weight only
  useEffect(() => {
    if (!ticket || isTicketClosed) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault(); // Always prevent default Tab behavior

        const activeElement = document.activeElement;

        // Check if we're currently in categories area
        const isInCategories = categoriesContainerRef.current?.contains(activeElement as Node);

        // Check if we're currently in weight input
        const isInWeight = weightInputRef.current === activeElement;

        if (isInCategories) {
          // From categories, Tab goes to weight input
          if (weightInputRef.current) {
            weightInputRef.current.focus();
            weightInputRef.current.select();
          }
        } else if (isInWeight) {
          // From weight, Tab goes back to categories
          if (categoriesContainerRef.current) {
            const firstCategoryButton = categoriesContainerRef.current.querySelector('[role="button"][tabindex="0"]') as HTMLElement;
            if (firstCategoryButton) {
              firstCategoryButton.focus();
            }
          }
        } else {
          // If we're elsewhere, Tab goes to categories first
          if (categoriesContainerRef.current) {
            const firstCategoryButton = categoriesContainerRef.current.querySelector('[role="button"][tabindex="0"]') as HTMLElement;
            if (firstCategoryButton) {
              firstCategoryButton.focus();
            }
          }
        }
      }
    };

    // Add global keydown listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ticket, isTicketClosed]);


  const handleLayoutChange = (sizes: number[]) => {
    const [categoriesSize, centerSize, summarySize] = sizes;
    if (categoriesSize && centerSize && summarySize) {
      const newPrefs: LayoutPreferences = {
        categoriesSize: Math.round(categoriesSize),
        centerSize: Math.round(centerSize),
        summarySize: Math.round(summarySize),
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
            <CategoriesColumn ref={categoriesContainerRef} data-testid="categories-column">
              {currentParentId && (
                <CategoryHeader>
                 <BackButton 
                   onClick={handleCategoryBack}
                   onKeyDown={handleBackKeyDown}
                   tabIndex={0}
                   role="button"
                   aria-label="Retour au niveau précédent"
                 >
                   ← Retour
                 </BackButton>
                 <Breadcrumb>
                   {categoryBreadcrumb.map((item, index) => (
                     <React.Fragment key={index}>
                       {index > 0 && <span style={{ color: '#999', margin: '0 4px' }}>›</span>}
                       <BreadcrumbItem title={item}>{item}</BreadcrumbItem>
                     </React.Fragment>
                   ))}
                 </Breadcrumb>
                </CategoryHeader>
              )}
              <CategoryGrid $columns={columnCount} style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}>
                {categories.map((category, index) => {
                  // Calculate position (1-based) for shortcut mapping
                  const position = index + 1;
                  const shortcutKey = getKeyForPosition(position);

                  return (
                    <CategoryButton
                      key={category.id}
                      $selected={selectedCategory === category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      onKeyDown={(e) => handleKeyDown(e, category.id)}
                      tabIndex={0}
                      role="button"
                      aria-label={
                        shortcutKey
                          ? `${category.hasChildren ? 'Naviguer vers' : 'Sélectionner'} ${category.label}. Raccourci clavier: ${shortcutKey} (position ${position})`
                          : `${category.hasChildren ? 'Naviguer vers' : 'Sélectionner'} ${category.label}`
                      }
                      aria-pressed={selectedCategory === category.id}
                    >
                      {category.label}
                      {shortcutKey && (
                        <ShortcutBadge aria-hidden="true">
                          {shortcutKey}
                        </ShortcutBadge>
                      )}
                    </CategoryButton>
                  );
                })}
              </CategoryGrid>
            </CategoriesColumn>

            <CenterWorkspace data-testid="center-workspace">
              {/* Fil d'Ariane pour la colonne du milieu */}
              {selectedCategory && (
                <CenterBreadcrumb>
                  <span>Catégorie sélectionnée:</span>
                  <CenterBreadcrumbItem>
                    {(visibleCategories.length > 0 ? visibleCategories : activeCategories).find(cat => cat.id === selectedCategory)?.name || 'Inconnue'}
                  </CenterBreadcrumbItem>
                </CenterBreadcrumb>
              )}

              {!isTicketClosed && (
                <WorkspaceContent>
                  <WeightSection>
                    <FormGroup>
                      <Label>Poids (kg) *</Label>
                      <WeightDisplay
                        ref={weightInputRef}
                        type="text"
                        value={formattedWeight}
                        onChange={() => {}}
                        onKeyDown={onKeyDown}
                        onFocus={handleWeightFocus}
                        onBlur={handleWeightBlur}
                        placeholder="0.00"
                        readOnly
                      />
                    </FormGroup>
                  </WeightSection>

                  <CentralBlockLayout>
                    <NumericPadSection>
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
                    </NumericPadSection>

                    <ControlsSection data-testid="controls-section">
                    <FormGroup>
                      <Label>Destination</Label>
                      <Select
                        value={destination}
                        onChange={(e) => setDestination(e.target.value as 'MAGASIN' | 'RECYCLAGE' | 'DECHETERIE')}
                        tabIndex={-1} // Prevent Tab navigation
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
                        tabIndex={-1} // Prevent Tab navigation
                      />
                    </FormGroup>

                    <AddButton
                      onClick={isEditing ? () => handleUpdateLine(editingLineId!) : handleAddLine}
                      disabled={isLoading || !selectedCategory || !weightInput}
                    >
                      <Save size={18} />
                      {isEditing ? 'Mettre à jour' : 'Ajouter l\'objet'}
                    </AddButton>
                  </ControlsSection>
                  </CentralBlockLayout>
                </WorkspaceContent>
              )}
            </CenterWorkspace>

            <SummaryColumn>
              <SummaryHeader>
                Résumé du Ticket
              </SummaryHeader>
              <SummaryContent ref={summaryContentRef}>
                {lines.length === 0 ? (
                  <SummaryEmptyState>Aucune ligne ajoutée</SummaryEmptyState>
                ) : (
                  lines.map((line: TicketLine) => (
                    <SummaryItem key={line.id}>
                      <SummaryItemInfo>
                        <SummaryItemCategory>
                          {line.category_label ||
                           categories.find(cat => cat.id === line.category_id)?.label ||
                           line.category_id ||
                           line.category || 'N/A'}
                        </SummaryItemCategory>
                        <SummaryItemDetails>
                          {line.poids_kg || line.weight}kg - {DESTINATIONS.find(d => d.value === line.destination)?.label}
                          {line.notes && <><br />{line.notes}</>}
                        </SummaryItemDetails>
                      </SummaryItemInfo>
                      {!isTicketClosed && (
                        <SummaryItemActions>
                          <SummaryActionButton
                            className="edit"
                            onClick={() => handleEditLine(line)}
                            disabled={isLoading}
                            tabIndex={-1} // Prevent Tab navigation
                          >
                            <Edit size={12} />
                          </SummaryActionButton>
                          <SummaryActionButton
                            className="delete"
                            onClick={() => handleDeleteLine(line.id)}
                            disabled={isLoading}
                            tabIndex={-1} // Prevent Tab navigation
                          >
                            <Trash2 size={12} />
                          </SummaryActionButton>
                        </SummaryItemActions>
                      )}
                    </SummaryItem>
                  ))
                )}
              </SummaryContent>
              <SummaryStats>
                {lines.length} ligne{lines.length > 1 ? 's' : ''} • Total: {lines.reduce((sum, line) => {
                  const weight = line.poids_kg || line.weight || 0;
                  return sum + (typeof weight === 'number' ? weight : 0);
                }, 0).toFixed(2)}kg
              </SummaryStats>
            </SummaryColumn>
          </>
        ) : (
          /* DESKTOP LAYOUT - 3 colonnes avec resize panels */
          <PanelGroup direction="horizontal" onLayout={handleLayoutChange}>
            {/* COLONNE GAUCHE: Catégories */}
            <Panel defaultSize={layoutPrefs.categoriesSize} minSize={15} maxSize={70}>
              <CategoriesColumn ref={categoriesContainerRef} data-testid="categories-column">
                {currentParentId && (
                  <CategoryHeader>
                 <BackButton 
                   onClick={handleCategoryBack}
                   onKeyDown={handleBackKeyDown}
                   tabIndex={0}
                   role="button"
                   aria-label="Retour au niveau précédent"
                 >
                   ← Retour
                 </BackButton>
                 <Breadcrumb>
                   {categoryBreadcrumb.map((item, index) => (
                     <React.Fragment key={index}>
                       {index > 0 && <span style={{ color: '#999', margin: '0 4px' }}>›</span>}
                       <BreadcrumbItem title={item}>{item}</BreadcrumbItem>
                     </React.Fragment>
                   ))}
                 </Breadcrumb>
                  </CategoryHeader>
                )}
                <CategoryGrid $columns={columnCount} style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}>
                  {categories.map((category, index) => {
                    // Calculate position (1-based) for shortcut mapping
                    const position = index + 1;
                    const shortcutKey = getKeyForPosition(position);

                    return (
                      <CategoryButton
                        key={category.id}
                        $selected={selectedCategory === category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        onKeyDown={(e) => handleKeyDown(e, category.id)}
                        tabIndex={0}
                        role="button"
                        aria-label={
                          shortcutKey
                            ? `${category.hasChildren ? 'Naviguer vers' : 'Sélectionner'} ${category.label}. Raccourci clavier: ${shortcutKey} (position ${position})`
                            : `${category.hasChildren ? 'Naviguer vers' : 'Sélectionner'} ${category.label}`
                        }
                        aria-pressed={selectedCategory === category.id}
                      >
                        {category.label}
                        {shortcutKey && (
                          <ShortcutBadge aria-hidden="true">
                            {shortcutKey}
                          </ShortcutBadge>
                        )}
                      </CategoryButton>
                    );
                  })}
                </CategoryGrid>
              </CategoriesColumn>
            </Panel>

            <PanelResizeHandle>
              <ResizeHandleStyled />
            </PanelResizeHandle>

            {/* COLONNE DU MILIEU: Poste de travail */}
            <Panel defaultSize={layoutPrefs.centerSize} minSize={30} maxSize={70}>
              <CenterWorkspace data-testid="center-workspace">
                {/* Fil d'Ariane */}
                {selectedCategory && (
                  <CenterBreadcrumb>
                    <span>Catégorie sélectionnée:</span>
                    <CenterBreadcrumbItem>
                      {(visibleCategories.length > 0 ? visibleCategories : activeCategories).find(cat => cat.id === selectedCategory)?.name || 'Inconnue'}
                    </CenterBreadcrumbItem>
                  </CenterBreadcrumb>
                )}

                {!isTicketClosed && (
                  <WorkspaceContent>
                    <WeightSection data-testid="weight-section">
                      <FormGroup>
                        <Label>Poids (kg) *</Label>
                        <WeightDisplay
                          ref={weightInputRef}
                          type="text"
                          value={formattedWeight}
                          onChange={() => {}}
                          onKeyDown={onKeyDown}
                          onFocus={handleWeightFocus}
                          onBlur={handleWeightBlur}
                          placeholder="0.00"
                          readOnly
                        />
                      </FormGroup>
                    </WeightSection>

                    <CentralBlockLayout>
                      <NumericPadSection>
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
                      </NumericPadSection>

                      <ControlsSection data-testid="controls-section">
                      <FormGroup>
                        <Label>Destination</Label>
                      <Select
                        value={destination}
                        onChange={(e) => setDestination(e.target.value as 'MAGASIN' | 'RECYCLAGE' | 'DECHETERIE')}
                        tabIndex={-1} // Prevent Tab navigation
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
                        tabIndex={-1} // Prevent Tab navigation
                      />
                      </FormGroup>

                      <AddButton
                        onClick={isEditing ? () => handleUpdateLine(editingLineId!) : handleAddLine}
                        disabled={isLoading || !selectedCategory || !weightInput}
                        tabIndex={-1} // Prevent Tab navigation to this button
                      >
                        <Save size={18} />
                        {isEditing ? 'Mettre à jour' : 'Ajouter l\'objet'}
                      </AddButton>
                    </ControlsSection>
                    </CentralBlockLayout>
                  </WorkspaceContent>
                )}
              </CenterWorkspace>
            </Panel>

            <PanelResizeHandle>
              <ResizeHandleStyled />
            </PanelResizeHandle>

            {/* COLONNE DE DROITE: Résumé du ticket */}
            <Panel defaultSize={layoutPrefs.summarySize} minSize={15} maxSize={70}>
              <SummaryColumn>
                <SummaryHeader>
                  Résumé du Ticket
                </SummaryHeader>
                <SummaryContent ref={summaryContentRef}>
                  {lines.length === 0 ? (
                    <SummaryEmptyState>Aucune ligne ajoutée</SummaryEmptyState>
                  ) : (
                    lines.map((line: TicketLine) => (
                      <SummaryItem key={line.id}>
                        <SummaryItemInfo>
                          <SummaryItemCategory>
                            {line.category_label ||
                             categories.find(cat => cat.id === line.category_id)?.label ||
                             line.category_id ||
                             line.category || 'N/A'}
                          </SummaryItemCategory>
                          <SummaryItemDetails>
                            {line.poids_kg || line.weight}kg - {DESTINATIONS.find(d => d.value === line.destination)?.label}
                            {line.notes && <><br />{line.notes}</>}
                          </SummaryItemDetails>
                        </SummaryItemInfo>
                        {!isTicketClosed && (
                          <SummaryItemActions>
                            <SummaryActionButton
                              className="edit"
                              onClick={() => handleEditLine(line)}
                              disabled={isLoading}
                              tabIndex={-1} // Prevent Tab navigation
                            >
                              <Edit size={12} />
                            </SummaryActionButton>
                            <SummaryActionButton
                              className="delete"
                              onClick={() => handleDeleteLine(line.id)}
                              disabled={isLoading}
                              tabIndex={-1} // Prevent Tab navigation
                            >
                              <Trash2 size={12} />
                            </SummaryActionButton>
                          </SummaryItemActions>
                        )}
                      </SummaryItem>
                    ))
                  )}
                </SummaryContent>
                <SummaryStats>
                  {lines.length} ligne{lines.length > 1 ? 's' : ''} • Total: {lines.reduce((sum, line) => {
                    const weight = line.poids_kg || line.weight || 0;
                    return sum + (typeof weight === 'number' ? weight : 0);
                  }, 0).toFixed(2)}kg
                </SummaryStats>
              </SummaryColumn>
            </Panel>
          </PanelGroup>
        )}
      </MainLayout>

      {/* L'ancien drawer a été remplacé par la colonne de résumé intégrée */}
    </KioskContainer>
  );
};

export default TicketForm;
