import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import Users from '../Users';
import { AdminUser, UserRole, UserStatus } from '../../../services/adminService';

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

  it('affiche le titre de la page', () => {
    renderWithProviders(<Users />);
    
    expect(screen.getByText('Gestion des Utilisateurs')).toBeInTheDocument();
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

  it('permet de sélectionner un utilisateur', () => {
    renderWithProviders(<Users />);
    
    const viewButton = screen.getAllByTestId('view-user-button')[0];
    fireEvent.click(viewButton);
    
    expect(mockSetSelectedUser).toHaveBeenCalled();
  });

  it('permet de rechercher des utilisateurs', () => {
    renderWithProviders(<Users />);
    
    const searchInput = screen.getByPlaceholderText('Rechercher un utilisateur...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    const searchButton = screen.getByTestId('search-button');
    fireEvent.click(searchButton);
    
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
});
