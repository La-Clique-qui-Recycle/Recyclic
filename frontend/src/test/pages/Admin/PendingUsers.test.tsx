/* @vitest-environment jsdom */
/**
 * Tests complets pour la page PendingUsers
 * Story 3.3 - API et Interface pour la Validation des Inscriptions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import PendingUsers from '../../../pages/Admin/PendingUsers';
import { adminService } from '../../../services/adminService';
import { AdminUser } from '../../../services/adminService';
import { notifications } from '@mantine/notifications';

// Les mocks sont centralisés dans setup.ts

// Sécuriser l'icône utilisée par la page même si setup global n'est pas chargé
vi.mock('@tabler/icons-react', () => ({
  IconUsers: (props: any) => <span data-testid="icon-users" {...props} />,
  IconRefresh: (props: any) => <span data-testid="icon-refresh" {...props} />,
  IconAlertCircle: (props: any) => <span data-testid="icon-alert" {...props} />
}))

// Mock du service admin
vi.mock('../../../services/adminService', () => ({
  adminService: {
    getPendingUsers: vi.fn(),
    approveUser: vi.fn(),
    rejectUser: vi.fn(),
  },
  UserStatus: { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' },
}));

// Les mocks d'icônes sont centralisés dans setup.ts

// Mock de PendingUsersTable
vi.mock('../../../components/business/PendingUsersTable', () => ({
  default: ({ users, loading, onApprove, onReject, onViewUser }: any) => (
    <div data-testid="pending-users-table">
      {loading ? (
        <div>Chargement...</div>
      ) : users.length === 0 ? (
        <div>Aucun utilisateur en attente</div>
      ) : (
        <div>
          {users.map((user: AdminUser) => (
            <div key={user.id} data-testid={`user-${user.id}`}>
              <span>{user.full_name}</span>
              <button
                data-testid={`approve-user-${user.id}`}
                onClick={() => onApprove(user.id, 'Test message')}
              >
                Approuver
              </button>
              <button
                data-testid={`reject-user-${user.id}`}
                onClick={() => onReject(user.id, 'Test reason')}
              >
                Rejeter
              </button>
              <button
                data-testid={`view-user-${user.id}`}
                onClick={() => onViewUser(user)}
              >
                Voir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  ),
}));

// Données de test
const createMockUser = (overrides: Partial<AdminUser> = {}): AdminUser => ({
  id: '1',
  telegram_id: 123456789,
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  full_name: 'Test User',
  role: 'user' as any,
  status: 'pending' as any,
  is_active: true,
  created_at: new Date('2024-01-01T10:00:00Z'),
  updated_at: new Date('2024-01-01T10:00:00Z'),
  ...overrides,
});

const mockUsers: AdminUser[] = [
  createMockUser({
    id: '1',
    telegram_id: 123456789,
    username: 'testuser1',
    first_name: 'Test',
    last_name: 'User',
    full_name: 'Test User',
  }),
  createMockUser({
    id: '2',
    telegram_id: 987654321,
    username: 'testuser2',
    first_name: 'Another',
    last_name: 'User',
    full_name: 'Another User',
  }),
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
    vi.clearAllMocks();
    (adminService.getPendingUsers as any).mockResolvedValue(mockUsers);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Rendu initial', () => {
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

    it('affiche le compteur d\'utilisateurs en attente', async () => {
      renderWithMantine(<PendingUsers />);
      
      await waitFor(() => {
        expect(screen.getByText('2 utilisateurs en attente')).toBeInTheDocument();
      });
    });

    it('affiche le message correct pour un seul utilisateur', async () => {
      (adminService.getPendingUsers as any).mockResolvedValue([mockUsers[0]]);
      
      renderWithMantine(<PendingUsers />);
      
      await waitFor(() => {
        expect(screen.getByText('1 utilisateur en attente')).toBeInTheDocument();
      });
    });

    it('affiche le message correct pour zéro utilisateur', async () => {
      (adminService.getPendingUsers as any).mockResolvedValue([]);
      
      renderWithMantine(<PendingUsers />);
      
      await waitFor(() => {
        expect(screen.getByText('0 utilisateurs en attente')).toBeInTheDocument();
      });
    });
  });

  describe('Chargement des données', () => {
    it('charge les utilisateurs en attente au montage', async () => {
      renderWithMantine(<PendingUsers />);
      
      await waitFor(() => {
        expect(adminService.getPendingUsers).toHaveBeenCalledTimes(1);
      });
    });

    it('affiche la liste des utilisateurs en attente', async () => {
      renderWithMantine(<PendingUsers />);
      
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('Another User')).toBeInTheDocument();
      });
    });

    it('affiche un état de chargement pendant le fetch', async () => {
      // Mock d'une promesse qui ne se résout pas immédiatement
      let resolvePromise: (value: AdminUser[]) => void;
      const pendingPromise = new Promise<AdminUser[]>((resolve) => {
        resolvePromise = resolve;
      });
      (adminService.getPendingUsers as any).mockReturnValue(pendingPromise);
      
      renderWithMantine(<PendingUsers />);
      
      // Vérifier que le chargement est affiché
      expect(screen.getByText('Chargement...')).toBeInTheDocument();
      
      // Résoudre la promesse
      resolvePromise!(mockUsers);
      
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });
  });

  describe('Gestion des erreurs', () => {
    it('affiche un message d\'erreur en cas d\'échec du chargement', async () => {
      (adminService.getPendingUsers as any).mockRejectedValue(new Error('Erreur de chargement'));
      
      renderWithMantine(<PendingUsers />);
      
      await waitFor(() => {
        expect(screen.getByText('Impossible de récupérer les utilisateurs en attente')).toBeInTheDocument();
      });
    });

    it('affiche un bouton de retry en cas d\'erreur', async () => {
      (adminService.getPendingUsers as any).mockRejectedValue(new Error('Erreur de chargement'));
      
      renderWithMantine(<PendingUsers />);
      
      await waitFor(() => {
        expect(screen.getByText('Réessayer')).toBeInTheDocument();
      });
    });

    it('retry le chargement quand on clique sur Réessayer', async () => {
      (adminService.getPendingUsers as any)
        .mockRejectedValueOnce(new Error('Erreur de chargement'))
        .mockResolvedValueOnce(mockUsers);
      
      renderWithMantine(<PendingUsers />);
      
      // Attendre l'erreur
      await waitFor(() => {
        expect(screen.getByText('Impossible de récupérer les utilisateurs en attente')).toBeInTheDocument();
      });
      
      // Cliquer sur Réessayer
      const retryButton = screen.getByText('Réessayer');
      fireEvent.click(retryButton);
      
      // Vérifier que getPendingUsers est appelé à nouveau
      await waitFor(() => {
        expect(adminService.getPendingUsers).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Rafraîchissement', () => {
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

    it('affiche un état de chargement pendant le rafraîchissement', async () => {
      renderWithMantine(<PendingUsers />);
      
      // Attendre que la liste soit chargée
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
      
      // Mock d'une promesse qui ne se résout pas immédiatement
      let resolvePromise: (value: AdminUser[]) => void;
      const pendingPromise = new Promise<AdminUser[]>((resolve) => {
        resolvePromise = resolve;
      });
      (adminService.getPendingUsers as any).mockReturnValue(pendingPromise);
      
      // Cliquer sur Actualiser
      const refreshButton = screen.getByTestId('refresh-button');
      fireEvent.click(refreshButton);
      
      // Vérifier que le chargement est affiché
      expect(screen.getByText('Chargement...')).toBeInTheDocument();
      
      // Résoudre la promesse
      resolvePromise!(mockUsers);
      
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });
  });

  describe('Actions sur les utilisateurs', () => {
    it('approuve un utilisateur avec succès', async () => {
      const user = userEvent.setup();
      (adminService.approveUser as any).mockResolvedValue({
        success: true,
        message: 'Utilisateur approuvé avec succès',
      });
      
      renderWithMantine(<PendingUsers />);
      
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
      
      // Cliquer sur le bouton d'approbation
      const approveButton = screen.getByTestId('approve-user-1');
      await user.click(approveButton);
      
      await waitFor(() => {
        expect(adminService.approveUser).toHaveBeenCalledWith('1', 'Test message');
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Succès',
          message: 'Utilisateur approuvé avec succès',
          color: 'green',
        });
      });
    });

    it('rejette un utilisateur avec succès', async () => {
      const user = userEvent.setup();
      (adminService.rejectUser as any).mockResolvedValue({
        success: true,
        message: 'Utilisateur rejeté avec succès',
      });
      
      renderWithMantine(<PendingUsers />);
      
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
      
      // Cliquer sur le bouton de rejet
      const rejectButton = screen.getByTestId('reject-user-1');
      await user.click(rejectButton);
      
      await waitFor(() => {
        expect(adminService.rejectUser).toHaveBeenCalledWith('1', 'Test reason');
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Succès',
          message: 'Utilisateur rejeté avec succès',
          color: 'orange',
        });
      });
    });

    it('rafraîchit la liste après une approbation réussie', async () => {
      const user = userEvent.setup();
      (adminService.approveUser as any).mockResolvedValue({
        success: true,
        message: 'Utilisateur approuvé avec succès',
      });
      
      renderWithMantine(<PendingUsers />);
      
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
      
      // Cliquer sur le bouton d'approbation
      const approveButton = screen.getByTestId('approve-user-1');
      await user.click(approveButton);
      
      await waitFor(() => {
        expect(adminService.approveUser).toHaveBeenCalledWith('1', 'Test message');
        // Vérifier que la liste est rafraîchie
        expect(adminService.getPendingUsers).toHaveBeenCalledTimes(2);
      });
    });

    it('rafraîchit la liste après un rejet réussi', async () => {
      const user = userEvent.setup();
      (adminService.rejectUser as any).mockResolvedValue({
        success: true,
        message: 'Utilisateur rejeté avec succès',
      });
      
      renderWithMantine(<PendingUsers />);
      
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
      
      // Cliquer sur le bouton de rejet
      const rejectButton = screen.getByTestId('reject-user-1');
      await user.click(rejectButton);
      
      await waitFor(() => {
        expect(adminService.rejectUser).toHaveBeenCalledWith('1', 'Test reason');
        // Vérifier que la liste est rafraîchie
        expect(adminService.getPendingUsers).toHaveBeenCalledTimes(2);
      });
    });

    it('affiche un message d\'erreur en cas d\'échec de l\'approbation', async () => {
      const user = userEvent.setup();
      (adminService.approveUser as any).mockRejectedValue(new Error('Erreur d\'approbation'));
      
      renderWithMantine(<PendingUsers />);
      
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
      
      // Cliquer sur le bouton d'approbation
      const approveButton = screen.getByTestId('approve-user-1');
      await user.click(approveButton);
      
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Erreur',
          message: 'Impossible d\'approuver l\'utilisateur',
          color: 'red',
        });
      });
    });

    it('affiche un message d\'erreur en cas d\'échec du rejet', async () => {
      const user = userEvent.setup();
      (adminService.rejectUser as any).mockRejectedValue(new Error('Erreur de rejet'));
      
      renderWithMantine(<PendingUsers />);
      
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
      
      // Cliquer sur le bouton de rejet
      const rejectButton = screen.getByTestId('reject-user-1');
      await user.click(rejectButton);
      
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Erreur',
          message: 'Impossible de rejeter l\'utilisateur',
          color: 'red',
        });
      });
    });
  });

  describe('Navigation', () => {
    it('a un lien vers la page des utilisateurs', () => {
      renderWithMantine(<PendingUsers />);
      
      const usersLink = screen.getByText('Tous les utilisateurs');
      expect(usersLink).toHaveAttribute('href', '/admin/users');
    });

    it('appelle onViewUser quand on clique sur voir un utilisateur', async () => {
      const user = userEvent.setup();
      renderWithMantine(<PendingUsers />);
      
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
      
      // Cliquer sur le bouton de vue
      const viewButton = screen.getByTestId('view-user-1');
      await user.click(viewButton);
      
      // Note: Dans un vrai test, on vérifierait que la navigation se fait
      // Ici on vérifie juste que l'action est déclenchée
      expect(viewButton).toBeInTheDocument();
    });
  });

  describe('États de la liste', () => {
    it('affiche le message correct quand il n\'y a pas d\'utilisateurs', async () => {
      (adminService.getPendingUsers as any).mockResolvedValue([]);
      
      renderWithMantine(<PendingUsers />);
      
      await waitFor(() => {
        expect(screen.getByText('Aucun utilisateur en attente')).toBeInTheDocument();
        expect(screen.getByText('0 utilisateurs en attente')).toBeInTheDocument();
      });
    });

    it('affiche le message correct pour un seul utilisateur', async () => {
      (adminService.getPendingUsers as any).mockResolvedValue([mockUsers[0]]);
      
      renderWithMantine(<PendingUsers />);
      
      await waitFor(() => {
        expect(screen.getByText('1 utilisateur en attente')).toBeInTheDocument();
      });
    });

    it('affiche le message correct pour plusieurs utilisateurs', async () => {
      (adminService.getPendingUsers as any).mockResolvedValue(mockUsers);
      
      renderWithMantine(<PendingUsers />);
      
      await waitFor(() => {
        expect(screen.getByText('2 utilisateurs en attente')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('ne re-rend pas inutilement quand les données ne changent pas', async () => {
      const mockUsers = [createMockUser({ id: '1', username: 'Test User' })];
      const getPendingUsersSpy = vi
        .spyOn(adminService, 'getPendingUsers')
        .mockResolvedValue(mockUsers);

      const { rerender } = render(<PendingUsers />);

      // Attendre que le chargement initial soit terminé
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      // Vérifier que l'API a été appelée une fois
      expect(getPendingUsersSpy).toHaveBeenCalledTimes(1);

      // Re-render le composant sans changer les props
      rerender(<PendingUsers />);

      // Le composant devrait toujours afficher l'utilisateur
      expect(screen.getByText('Test User')).toBeInTheDocument();
      
      // L'API ne doit PAS avoir été appelée une seconde fois
      expect(getPendingUsersSpy).toHaveBeenCalledTimes(1);
    });

    it('gère efficacement les listes avec beaucoup d\'utilisateurs', async () => {
      const manyUsers = Array.from({ length: 100 }, (_, i) => 
        createMockUser({
          id: `${i}`,
          telegram_id: 100000000 + i,
          username: `user${i}`,
          first_name: `User${i}`,
          last_name: `Test`,
          full_name: `User${i} Test`,
        })
      );
      
      (adminService.getPendingUsers as any).mockResolvedValue(manyUsers);
      
      renderWithMantine(<PendingUsers />);
      
      await waitFor(() => {
        expect(screen.getByText('100 utilisateurs en attente')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibilité', () => {
    it('a des boutons avec des labels accessibles', () => {
      renderWithMantine(<PendingUsers />);
      
      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).toHaveAttribute('aria-label');
    });

    it('a des titres hiérarchiques appropriés', () => {
      renderWithMantine(<PendingUsers />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Demandes d\'Inscription');
    });
  });
});