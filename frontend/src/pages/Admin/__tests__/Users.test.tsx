import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Users from '../Users';
import { UserRole, UserStatus } from '../../../services/adminService';

import { vi } from 'vitest';

// Mock du store
const mockSetSelectedUser = vi.fn();
const mockFetchUsers = vi.fn();
const mockUpdateUserRole = vi.fn();
const mockFilterUsers = vi.fn();
const mockSetFilters = vi.fn();

vi.mock('../../../stores/adminStore', () => ({
  useAdminStore: () => ({
    users: [
      {
        id: '1',
        telegram_id: 123456789,
        username: 'testuser1',
        first_name: 'Test',
        last_name: 'User1',
        full_name: 'Test User1',
        role: UserRole.USER,
        status: UserStatus.APPROVED,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: '2',
        telegram_id: 987654321,
        username: 'testuser2',
        first_name: 'Test',
        last_name: 'User2',
        full_name: 'Test User2',
        role: UserRole.ADMIN,
        status: UserStatus.APPROVED,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ],
    loading: false,
    error: null,
    filters: { skip: 0, limit: 20 },
    selectedUser: null,
    fetchUsers: mockFetchUsers,
    updateUserRole: mockUpdateUserRole,
    filterUsers: mockFilterUsers,
    setFilters: mockSetFilters,
    setSelectedUser: mockSetSelectedUser
  })
}));

// Mock des notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn()
  }
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Users Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should display page title', () => {
    renderWithProviders(<Users />);

    expect(screen.getByRole('heading', { name: /gestion des utilisateurs/i })).toBeInTheDocument();
    expect(screen.getByText('Gérez les utilisateurs et leurs rôles dans le système')).toBeInTheDocument();
  });

  it('affiche la liste des utilisateurs', () => {
    renderWithProviders(<Users />);
    
    expect(screen.getByText('Test User1')).toBeInTheDocument();
    expect(screen.getByText('Test User2')).toBeInTheDocument();
  });

  it('affiche les filtres de recherche', () => {
    renderWithProviders(<Users />);
    
    expect(screen.getByPlaceholderText('Rechercher un utilisateur...')).toBeInTheDocument();
    expect(screen.getByText('Filtrer par rôle')).toBeInTheDocument();
    expect(screen.getByText('Filtrer par statut')).toBeInTheDocument();
  });

  it('affiche la structure Master-Detail', () => {
    renderWithProviders(<Users />);
    
    expect(screen.getByText('Liste des utilisateurs')).toBeInTheDocument();
    expect(screen.getByText('Aucun utilisateur sélectionné')).toBeInTheDocument();
  });

  it('should select user when clicking on row', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Users />);

    const userRow = screen.getAllByTestId('user-row')[0];

    await act(async () => {
      await user.click(userRow);
    });

    expect(mockSetSelectedUser).toHaveBeenCalled();
  });

  it('should search users', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Users />);

    const searchInput = screen.getByRole('textbox', { name: /rechercher/i });
    await act(async () => {
      await user.type(searchInput, 'test');
    });

    const searchButton = screen.getByTestId('search-button');
    await act(async () => {
      await user.click(searchButton);
    });

    expect(mockSetFilters).toHaveBeenCalled();
    expect(mockFilterUsers).toHaveBeenCalled();
  });

  it('permet de filtrer par rôle', () => {
    renderWithProviders(<Users />);
    
    const roleFilter = screen.getByTestId('role-filter') as HTMLSelectElement;
    fireEvent.change(roleFilter, { target: { value: 'user' } });
    
    expect(mockSetFilters).toHaveBeenCalled();
    expect(mockFilterUsers).toHaveBeenCalled();
  });

  it('permet de filtrer par statut', () => {
    renderWithProviders(<Users />);
    
    const statusFilter = screen.getByTestId('status-filter') as HTMLSelectElement;
    fireEvent.change(statusFilter, { target: { value: 'approved' } });
    
    expect(mockSetFilters).toHaveBeenCalled();
    expect(mockFilterUsers).toHaveBeenCalled();
  });

  it('affiche le bouton d\'actualisation', () => {
    renderWithProviders(<Users />);
    
    expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
  });

  it('permet d\'actualiser la liste', () => {
    renderWithProviders(<Users />);
    
    const refreshButton = screen.getByTestId('refresh-button');
    fireEvent.click(refreshButton);
    
    expect(mockFetchUsers).toHaveBeenCalled();
  });

  it('affiche la pagination', () => {
    renderWithProviders(<Users />);
    
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  it('affiche les informations de pagination', () => {
    renderWithProviders(<Users />);

    expect(screen.getByTestId('page-info')).toBeInTheDocument();
  });

  it('should display user activity status', () => {
    renderWithProviders(<Users />);

    // Vérifier que les statuts "Actif" sont affichés
    expect(screen.getAllByText('Actif')).toHaveLength(2);
  });

  it('should not display Actions column anymore', () => {
    renderWithProviders(<Users />);

    // Vérifier que la colonne Actions n'existe plus
    expect(screen.queryByText('Actions')).not.toBeInTheDocument();
    expect(screen.queryByTestId('view-user-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('edit-user-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-user-button')).not.toBeInTheDocument();
  });

  it('should display new status columns', () => {
    renderWithProviders(<Users />);

    // Vérifier que les nouvelles colonnes sont présentes
    expect(screen.getByText('Statut d\'approbation')).toBeInTheDocument();
    expect(screen.getByText('Statut d\'activité')).toBeInTheDocument();
  });

  it('should display role badges as non-interactive', () => {
    renderWithProviders(<Users />);

    // Vérifier que les rôles sont affichés comme badges non-interactifs
    expect(screen.getByText('Utilisateur')).toBeInTheDocument();
    expect(screen.getByText('Administrateur')).toBeInTheDocument();

    // Vérifier qu'il n'y a plus de boutons interactifs pour les rôles
    expect(screen.queryByTestId('role-selector-button')).not.toBeInTheDocument();
  });
});
