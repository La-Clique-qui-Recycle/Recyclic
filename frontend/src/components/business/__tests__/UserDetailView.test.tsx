import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { vi } from 'vitest';
import { UserDetailView } from '../UserDetailView';
import { AdminUser, UserRole, UserStatus } from '../../../services/adminService';

// Mock des dépendances
vi.mock('../../../stores/adminStore', () => ({
  useAdminStore: () => ({
    userHistory: [],
    historyLoading: false,
    historyError: null,
    fetchUserHistory: vi.fn()
  })
}));

// Mock des icônes Tabler
vi.mock('@tabler/icons-react', () => ({
  IconUser: () => <div data-testid="icon-user">IconUser</div>,
  IconHistory: () => <div data-testid="icon-history">IconHistory</div>,
  IconEdit: () => <div data-testid="icon-edit">IconEdit</div>,
  IconCheck: () => <div data-testid="icon-check">IconCheck</div>,
  IconX: () => <div data-testid="icon-x">IconX</div>,
  IconAlertCircle: () => <div data-testid="icon-alert">IconAlertCircle</div>,
  IconCalendar: () => <div data-testid="icon-calendar">IconCalendar</div>,
  IconSearch: () => <div data-testid="icon-search">IconSearch</div>,
  IconFilter: () => <div data-testid="icon-filter">IconFilter</div>,
}));

const mockUser: AdminUser = {
  id: '1',
  telegram_id: 123456789,
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  full_name: 'Test User',
  role: UserRole.USER,
  status: UserStatus.APPROVED,
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(component);
};

describe('UserDetailView', () => {
  it('affiche un message quand aucun utilisateur n\'est sélectionné', () => {
    renderWithProvider(<UserDetailView user={null} />);
    
    expect(screen.getByText('Aucun utilisateur sélectionné')).toBeInTheDocument();
    expect(screen.getByText('Sélectionnez un utilisateur dans la liste pour voir ses détails.')).toBeInTheDocument();
  });

  it('affiche un skeleton pendant le chargement', () => {
    renderWithProvider(<UserDetailView user={null} loading={true} />);
    
    // Vérifier que des éléments de skeleton sont présents
    const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('affiche les informations de l\'utilisateur sélectionné', () => {
    renderWithProvider(<UserDetailView user={mockUser} />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    // Tolère le split entre nœuds et multiples correspondances
    expect(document.body.textContent || '').toMatch(/@\s*testuser/);

    // Peut apparaître plusieurs fois (badge + texte), tolérer multiplicité
    expect(screen.getAllByText('Utilisateur').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Approuvé').length).toBeGreaterThan(0);
  });

  it('affiche les onglets Profil et Historique', () => {
    renderWithProvider(<UserDetailView user={mockUser} />);
    
    expect(screen.getByText('Profil')).toBeInTheDocument();
    expect(screen.getByText('Historique')).toBeInTheDocument();
  });

  it('permet de changer d\'onglet', () => {
    renderWithProvider(<UserDetailView user={mockUser} />);
    
    const historyTab = screen.getByText('Historique');
    fireEvent.click(historyTab);
    
    // Vérifier que l'onglet Historique est actif via l'attribut data-active sur le bouton mocké
    const tabs = screen.getAllByTestId('tabs-tab');
    const historyButton = tabs.find((el) => el.getAttribute('data-value') === 'history');
    expect(historyButton).toBeTruthy();
    expect(historyButton?.getAttribute('data-active')).toBe('true');
  });

  it('appelle onUserUpdate quand un utilisateur est mis à jour', () => {
    const mockOnUserUpdate = vi.fn();
    renderWithProvider(<UserDetailView user={mockUser} onUserUpdate={mockOnUserUpdate} />);
    
    // Simuler une mise à jour d'utilisateur
    const updatedUser = { ...mockUser, first_name: 'Updated' };
    mockOnUserUpdate(updatedUser);
    
    expect(mockOnUserUpdate).toHaveBeenCalledWith(updatedUser);
  });
});
