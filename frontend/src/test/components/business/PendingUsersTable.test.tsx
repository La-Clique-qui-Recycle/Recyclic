import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import PendingUsersTable from '../../../components/business/PendingUsersTable';
import { AdminUser, UserStatus } from '../../../services/adminService';

// Mock des notifications
jest.mock('@mantine/notifications', () => ({
  notifications: {
    show: jest.fn(),
  },
}));

const mockUsers: AdminUser[] = [
  {
    id: '1',
    telegram_id: 123456789,
    username: 'testuser1',
    first_name: 'Test',
    last_name: 'User',
    full_name: 'Test User',
    role: 'user' as any,
    status: UserStatus.PENDING,
    is_active: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  },
  {
    id: '2',
    telegram_id: 987654321,
    username: 'testuser2',
    first_name: 'Another',
    last_name: 'User',
    full_name: 'Another User',
    role: 'user' as any,
    status: UserStatus.PENDING,
    is_active: true,
    created_at: new Date('2024-01-02'),
    updated_at: new Date('2024-01-02'),
  },
];

const defaultProps = {
  users: mockUsers,
  loading: false,
  onApprove: jest.fn(),
  onReject: jest.fn(),
  onViewUser: jest.fn(),
};

const renderWithMantine = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('PendingUsersTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche la liste des utilisateurs en attente', () => {
    renderWithMantine(<PendingUsersTable {...defaultProps} />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Another User')).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
    expect(screen.getByText('987654321')).toBeInTheDocument();
  });

  it('affiche le message de chargement quand loading est true', () => {
    renderWithMantine(<PendingUsersTable {...defaultProps} loading={true} />);
    
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('affiche le message "Aucun utilisateur en attente" quand la liste est vide', () => {
    renderWithMantine(<PendingUsersTable {...defaultProps} users={[]} />);
    
    expect(screen.getByText('Aucun utilisateur en attente')).toBeInTheDocument();
  });

  it('affiche les badges de statut corrects', () => {
    renderWithMantine(<PendingUsersTable {...defaultProps} />);
    
    const pendingBadges = screen.getAllByText('En attente');
    expect(pendingBadges).toHaveLength(2);
  });

  it('appelle onViewUser quand on clique sur l\'icône de vue', () => {
    renderWithMantine(<PendingUsersTable {...defaultProps} />);
    
    const viewButtons = screen.getAllByTestId(/view-user-/);
    fireEvent.click(viewButtons[0]);
    
    expect(defaultProps.onViewUser).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('ouvre le modal d\'approbation quand on clique sur l\'icône d\'approbation', () => {
    renderWithMantine(<PendingUsersTable {...defaultProps} />);
    
    const approveButtons = screen.getAllByTestId(/approve-user-/);
    fireEvent.click(approveButtons[0]);
    
    expect(screen.getByText('Approuver l\'utilisateur')).toBeInTheDocument();
    expect(screen.getByText('Êtes-vous sûr de vouloir approuver l\'utilisateur')).toBeInTheDocument();
  });

  it('ouvre le modal de rejet quand on clique sur l\'icône de rejet', () => {
    renderWithMantine(<PendingUsersTable {...defaultProps} />);
    
    const rejectButtons = screen.getAllByTestId(/reject-user-/);
    fireEvent.click(rejectButtons[0]);
    
    expect(screen.getByText('Rejeter l\'utilisateur')).toBeInTheDocument();
    expect(screen.getByText('Êtes-vous sûr de vouloir rejeter l\'utilisateur')).toBeInTheDocument();
  });

  it('appelle onApprove avec le message correct quand on confirme l\'approbation', async () => {
    const mockApprove = jest.fn().mockResolvedValue(true);
    renderWithMantine(<PendingUsersTable {...defaultProps} onApprove={mockApprove} />);
    
    // Ouvrir le modal d'approbation
    const approveButtons = screen.getAllByTestId(/approve-user-/);
    fireEvent.click(approveButtons[0]);
    
    // Remplir le message
    const messageInput = screen.getByPlaceholderText('Message personnalisé à envoyer à l\'utilisateur...');
    fireEvent.change(messageInput, { target: { value: 'Bienvenue !' } });
    
    // Confirmer
    const confirmButton = screen.getByText('Approuver');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockApprove).toHaveBeenCalledWith('1', 'Bienvenue !');
    });
  });

  it('appelle onReject avec la raison correcte quand on confirme le rejet', async () => {
    const mockReject = jest.fn().mockResolvedValue(true);
    renderWithMantine(<PendingUsersTable {...defaultProps} onReject={mockReject} />);
    
    // Ouvrir le modal de rejet
    const rejectButtons = screen.getAllByTestId(/reject-user-/);
    fireEvent.click(rejectButtons[0]);
    
    // Remplir la raison
    const reasonInput = screen.getByPlaceholderText('Expliquez pourquoi l\'utilisateur est rejeté...');
    fireEvent.change(reasonInput, { target: { value: 'Profil incomplet' } });
    
    // Confirmer
    const confirmButton = screen.getByText('Rejeter');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockReject).toHaveBeenCalledWith('1', 'Profil incomplet');
    });
  });

  it('ferme le modal d\'approbation quand on clique sur Annuler', () => {
    renderWithMantine(<PendingUsersTable {...defaultProps} />);
    
    // Ouvrir le modal d'approbation
    const approveButtons = screen.getAllByTestId(/approve-user-/);
    fireEvent.click(approveButtons[0]);
    
    // Cliquer sur Annuler
    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText('Approuver l\'utilisateur')).not.toBeInTheDocument();
  });

  it('ferme le modal de rejet quand on clique sur Annuler', () => {
    renderWithMantine(<PendingUsersTable {...defaultProps} />);
    
    // Ouvrir le modal de rejet
    const rejectButtons = screen.getAllByTestId(/reject-user-/);
    fireEvent.click(rejectButtons[0]);
    
    // Cliquer sur Annuler
    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText('Rejeter l\'utilisateur')).not.toBeInTheDocument();
  });
});
