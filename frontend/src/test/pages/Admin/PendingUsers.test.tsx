import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import PendingUsers from '../../../pages/Admin/PendingUsers';
import { adminService } from '../../../services/adminService';
import { AdminUser, UserStatus } from '../../../services/adminService';

// Mock des notifications
jest.mock('@mantine/notifications', () => ({
  notifications: {
    show: jest.fn(),
  },
}));

// Mock du service admin
jest.mock('../../../services/adminService', () => ({
  adminService: {
    getPendingUsers: jest.fn(),
    approveUser: jest.fn(),
    rejectUser: jest.fn(),
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

const renderWithMantine = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('PendingUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (adminService.getPendingUsers as jest.Mock).mockResolvedValue(mockUsers);
  });

  it('affiche le titre et la description', () => {
    renderWithMantine(<PendingUsers />);
    
    expect(screen.getByText('Demandes d\'Inscription')).toBeInTheDocument();
    expect(screen.getByText('Gérez les demandes d\'inscription en attente d\'approbation')).toBeInTheDocument();
  });

  it('affiche les boutons d\'action', () => {
    renderWithMantine(<PendingUsers />);
    
    expect(screen.getByText('Tous les utilisateurs')).toBeInTheDocument();
    expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
  });

  it('charge les utilisateurs en attente au montage', async () => {
    renderWithMantine(<PendingUsers />);
    
    await waitFor(() => {
      expect(adminService.getPendingUsers).toHaveBeenCalled();
    });
  });

  it('affiche la liste des utilisateurs en attente', async () => {
    renderWithMantine(<PendingUsers />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Another User')).toBeInTheDocument();
    });
  });

  it('affiche un message d\'erreur en cas d\'échec du chargement', async () => {
    (adminService.getPendingUsers as jest.Mock).mockRejectedValue(new Error('Erreur de chargement'));
    
    renderWithMantine(<PendingUsers />);
    
    await waitFor(() => {
      expect(screen.getByText('Impossible de récupérer les utilisateurs en attente')).toBeInTheDocument();
    });
  });

  it('rafraîchit la liste quand on clique sur Actualiser', async () => {
    renderWithMantine(<PendingUsers />);
    
    // Attendre que la liste soit chargée
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
    
    // Cliquer sur Actualiser
    const refreshButton = screen.getByTestId('refresh-button');
    fireEvent.click(refreshButton);
    
    // Vérifier que getPendingUsers est appelé à nouveau
    await waitFor(() => {
      expect(adminService.getPendingUsers).toHaveBeenCalledTimes(2);
    });
  });

  it('approuve un utilisateur avec succès', async () => {
    (adminService.approveUser as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Utilisateur approuvé avec succès',
    });
    
    renderWithMantine(<PendingUsers />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
    
    // Cliquer sur le bouton d'approbation
    const approveButton = screen.getByTestId('approve-user-1');
    fireEvent.click(approveButton);
    
    // Remplir le message et confirmer
    const messageInput = screen.getByPlaceholderText('Message personnalisé à envoyer à l\'utilisateur...');
    fireEvent.change(messageInput, { target: { value: 'Bienvenue !' } });
    
    const confirmButton = screen.getByText('Approuver');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(adminService.approveUser).toHaveBeenCalledWith('1', 'Bienvenue !');
      expect(notifications.show).toHaveBeenCalledWith({
        title: 'Succès',
        message: 'Utilisateur approuvé avec succès',
        color: 'green',
      });
    });
  });

  it('rejette un utilisateur avec succès', async () => {
    (adminService.rejectUser as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Utilisateur rejeté avec succès',
    });
    
    renderWithMantine(<PendingUsers />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
    
    // Cliquer sur le bouton de rejet
    const rejectButton = screen.getByTestId('reject-user-1');
    fireEvent.click(rejectButton);
    
    // Remplir la raison et confirmer
    const reasonInput = screen.getByPlaceholderText('Expliquez pourquoi l\'utilisateur est rejeté...');
    fireEvent.change(reasonInput, { target: { value: 'Profil incomplet' } });
    
    const confirmButton = screen.getByText('Rejeter');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(adminService.rejectUser).toHaveBeenCalledWith('1', 'Profil incomplet');
      expect(notifications.show).toHaveBeenCalledWith({
        title: 'Succès',
        message: 'Utilisateur rejeté avec succès',
        color: 'orange',
      });
    });
  });

  it('affiche un message d\'erreur en cas d\'échec de l\'approbation', async () => {
    (adminService.approveUser as jest.Mock).mockRejectedValue(new Error('Erreur d\'approbation'));
    
    renderWithMantine(<PendingUsers />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
    
    // Cliquer sur le bouton d'approbation
    const approveButton = screen.getByTestId('approve-user-1');
    fireEvent.click(approveButton);
    
    // Confirmer sans message
    const confirmButton = screen.getByText('Approuver');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith({
        title: 'Erreur',
        message: 'Impossible d\'approuver l\'utilisateur',
        color: 'red',
      });
    });
  });

  it('affiche un message d\'erreur en cas d\'échec du rejet', async () => {
    (adminService.rejectUser as jest.Mock).mockRejectedValue(new Error('Erreur de rejet'));
    
    renderWithMantine(<PendingUsers />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
    
    // Cliquer sur le bouton de rejet
    const rejectButton = screen.getByTestId('reject-user-1');
    fireEvent.click(rejectButton);
    
    // Confirmer sans raison
    const confirmButton = screen.getByText('Rejeter');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith({
        title: 'Erreur',
        message: 'Impossible de rejeter l\'utilisateur',
        color: 'red',
      });
    });
  });

  it('affiche le compteur d\'utilisateurs en attente', async () => {
    renderWithMantine(<PendingUsers />);
    
    await waitFor(() => {
      expect(screen.getByText('2 utilisateurs en attente')).toBeInTheDocument();
    });
  });

  it('affiche le message correct pour un seul utilisateur', async () => {
    (adminService.getPendingUsers as jest.Mock).mockResolvedValue([mockUsers[0]]);
    
    renderWithMantine(<PendingUsers />);
    
    await waitFor(() => {
      expect(screen.getByText('1 utilisateur en attente')).toBeInTheDocument();
    });
  });
});
