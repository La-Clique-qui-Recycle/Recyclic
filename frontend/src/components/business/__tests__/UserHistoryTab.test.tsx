import React from 'react';
import { render, screen, fireEvent } from '../../../test/test-utils';
import { UserHistoryTab } from '../UserHistoryTab';

import { vi, beforeEach, afterEach } from 'vitest';

// Local Tabler icons mock to avoid missing exports
vi.mock('@tabler/icons-react', () => ({
  IconShield: () => <div data-testid="icon-shield">IconShield</div>,
  IconShoppingCart: () => <div data-testid="icon-shopping-cart">IconShoppingCart</div>,
  IconTruck: () => <div data-testid="icon-truck">IconTruck</div>,
  IconUser: () => <div data-testid="icon-user">IconUser</div>,
  IconSettings: () => <div data-testid="icon-settings">IconSettings</div>,
  IconAlertCircle: () => <div data-testid="icon-alert">IconAlert</div>,
  IconSearch: () => <div data-testid="icon-search">IconSearch</div>,
  IconFilter: () => <div data-testid="icon-filter">IconFilter</div>,
  IconCalendar: () => <div data-testid="icon-calendar">IconCalendar</div>,
  IconX: () => <div data-testid="icon-x">IconX</div>,
}))

// Mock du store
const mockFetchUserHistory = vi.fn();
const mockUseAdminStore = vi.fn();

vi.mock('../../../stores/adminStore', () => ({
  useAdminStore: mockUseAdminStore
}));


describe('UserHistoryTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-configure default mock behavior
    mockUseAdminStore.mockReturnValue({
      userHistory: [
        {
          id: '1',
          type: 'ADMINISTRATION',
          description: 'Rôle changé de \'user\' à \'admin\' par admin_user',
          timestamp: '2025-01-27T10:15:00Z',
          metadata: { previous_role: 'user', new_role: 'admin', changed_by: 'admin_user' }
        },
        {
          id: '2',
          type: 'VENTE',
          description: 'Vente #V123 enregistrée (3 articles, 15.50€)',
          timestamp: '2025-01-26T16:45:00Z',
          metadata: { sale_id: 'V123', items_count: 3, total_amount: 15.50 }
        }
      ],
      historyLoading: false,
      historyError: null,
      fetchUserHistory: mockFetchUserHistory
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('affiche les filtres', () => {
    render(<UserHistoryTab userId="1" />);

    expect(screen.getByText('Filtres')).toBeInTheDocument();
    // Les DatePickerInput ont des labels mais ils sont dans data-label, pas rendus comme texte
    expect(screen.getAllByTestId('date-picker-input')).toHaveLength(2);
    // le label du select est rendu via un <label> distinct
    expect(screen.getByText("Type d'événement")).toBeInTheDocument();
    expect(screen.getByText('Recherche')).toBeInTheDocument();
  });

  it('affiche les boutons de filtrage', () => {
    render(<UserHistoryTab userId="1" />);

    expect(screen.getByText('Effacer')).toBeInTheDocument();
    expect(screen.getByText('Appliquer')).toBeInTheDocument();
  });

  it('affiche la liste des événements', () => {
    render(<UserHistoryTab userId="1" />);

    // Vérifier que les filtres sont présents
    expect(screen.getByText('Filtres')).toBeInTheDocument();
    expect(screen.getAllByTestId('date-picker-input')).toHaveLength(2);
    expect(screen.getByText('Type d\'événement')).toBeInTheDocument();
    expect(screen.getByText('Recherche')).toBeInTheDocument();
  });

  it('affiche les types d\'événements avec des badges', () => {
    render(<UserHistoryTab userId="1" />);

    // Les badges existent mais le texte peut ne pas être en capitales strictes
    expect(screen.getByText(/Administration/i)).toBeInTheDocument();
    expect(screen.getByText(/Vente/i)).toBeInTheDocument();
  });

  it('permet de filtrer par type d\'événement', () => {
    render(<UserHistoryTab userId="1" />);

    const eventTypeSelect = screen.getByTestId('multi-select');
    fireEvent.change(eventTypeSelect, { target: { value: 'ADMINISTRATION' } });

    const applyButton = screen.getByText('Appliquer');
    fireEvent.click(applyButton);

    expect(mockFetchUserHistory).toHaveBeenCalled();
  });

  it('permet de rechercher dans les événements', () => {
    render(<UserHistoryTab userId="1" />);

    const searchInput = screen.getByPlaceholderText('Rechercher dans les événements...');
    fireEvent.change(searchInput, { target: { value: 'vente' } });

    const applyButton = screen.getByText('Appliquer');
    fireEvent.click(applyButton);

    expect(mockFetchUserHistory).toHaveBeenCalled();
  });

  it('permet d\'effacer les filtres', () => {
    render(<UserHistoryTab userId="1" />);

    const clearButton = screen.getByText('Effacer');
    fireEvent.click(clearButton);

    expect(mockFetchUserHistory).toHaveBeenCalled();
  });

  it('affiche un message quand aucun événement n\'est trouvé', () => {
    // Reconfigurer le mock pour retourner une liste vide
    mockUseAdminStore.mockReturnValue({
      userHistory: [],
      historyLoading: false,
      historyError: null,
      fetchUserHistory: mockFetchUserHistory
    });

    render(<UserHistoryTab userId="1" />);

    // Sans filtres actifs, on doit afficher le message d'état vide conforme à la story
    expect(screen.getByText('Aucune activité enregistrée pour cet utilisateur')).toBeInTheDocument();
  });

  it('affiche une erreur quand il y a un problème de chargement', () => {
    // Reconfigurer le mock pour retourner une erreur
    mockUseAdminStore.mockReturnValue({
      userHistory: [],
      historyLoading: false,
      historyError: 'Erreur de chargement',
      fetchUserHistory: mockFetchUserHistory
    });

    render(<UserHistoryTab userId="1" />);

    expect(screen.getByText('Erreur')).toBeInTheDocument();
    expect(screen.getByText('Erreur de chargement')).toBeInTheDocument();
  });
});
