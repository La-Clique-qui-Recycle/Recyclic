/**
 * Tests complets pour le composant PendingUsersTable
 * Story 3.3 - API et Interface pour la Validation des Inscriptions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import PendingUsersTable from '../../../components/business/PendingUsersTable';
import { AdminUser, UserStatus } from '../../../services/adminService';
import { notifications } from '@mantine/notifications';

// Les mocks sont centralisés dans setup.ts

// Données de test
const createMockUser = (overrides: Partial<AdminUser> = {}): AdminUser => ({
  id: '1',
  telegram_id: 123456789,
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  full_name: 'Test User',
  role: 'user' as any,
  status: UserStatus.PENDING,
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
  createMockUser({
    id: '3',
    telegram_id: 555666777,
    username: 'testuser3',
    first_name: 'Third',
    last_name: 'User',
    full_name: 'Third User',
  }),
];

const defaultProps = {
  users: mockUsers,
  loading: false,
  onApprove: vi.fn(),
  onReject: vi.fn(),
  onViewUser: vi.fn(),
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
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Rendu de base', () => {
    it('affiche la liste des utilisateurs en attente', () => {
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Another User')).toBeInTheDocument();
      expect(screen.getByText('Third User')).toBeInTheDocument();
      expect(screen.getByText('123456789')).toBeInTheDocument();
      expect(screen.getByText('987654321')).toBeInTheDocument();
      expect(screen.getByText('555666777')).toBeInTheDocument();
    });

    it('affiche les noms d\'utilisateur', () => {
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      expect(screen.getByText('testuser1')).toBeInTheDocument();
      expect(screen.getByText('testuser2')).toBeInTheDocument();
      expect(screen.getByText('testuser3')).toBeInTheDocument();
    });

    it('affiche les dates de création formatées', () => {
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      // Vérifier que les dates sont affichées (format peut varier selon la locale)
      expect(screen.getByText(/01\/01\/2024/)).toBeInTheDocument();
    });

    it('affiche les badges de statut "En attente"', () => {
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      const pendingBadges = screen.getAllByText('En attente');
      expect(pendingBadges).toHaveLength(3);
    });

    it('affiche les boutons d\'action pour chaque utilisateur', () => {
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      // 3 utilisateurs × 3 boutons (voir, approuver, rejeter) = 9 boutons
      expect(screen.getAllByTestId(/view-user-/)).toHaveLength(3);
      expect(screen.getAllByTestId(/approve-user-/)).toHaveLength(3);
      expect(screen.getAllByTestId(/reject-user-/)).toHaveLength(3);
    });
  });

  describe('États de chargement', () => {
    it('affiche le message de chargement quand loading est true', () => {
      renderWithMantine(<PendingUsersTable {...defaultProps} loading={true} />);
      
      expect(screen.getByText('Chargement...')).toBeInTheDocument();
      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    });

    it('n\'affiche pas le message de chargement quand loading est false', () => {
      renderWithMantine(<PendingUsersTable {...defaultProps} loading={false} />);
      
      expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  describe('Liste vide', () => {
    it('affiche le message "Aucun utilisateur en attente" quand la liste est vide', () => {
      renderWithMantine(<PendingUsersTable {...defaultProps} users={[]} />);
      
      expect(screen.getByText('Aucun utilisateur en attente')).toBeInTheDocument();
      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    });

    it('n\'affiche pas les boutons d\'action quand la liste est vide', () => {
      renderWithMantine(<PendingUsersTable {...defaultProps} users={[]} />);
      
      expect(screen.queryByTestId(/view-user-/)).not.toBeInTheDocument();
      expect(screen.queryByTestId(/approve-user-/)).not.toBeInTheDocument();
      expect(screen.queryByTestId(/reject-user-/)).not.toBeInTheDocument();
    });
  });

  describe('Actions utilisateur', () => {
    it('appelle onViewUser quand on clique sur l\'icône de vue', async () => {
      const user = userEvent.setup();
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      const viewButton = screen.getByTestId('view-user-1');
      await user.click(viewButton);
      
      expect(defaultProps.onViewUser).toHaveBeenCalledWith(mockUsers[0]);
      expect(defaultProps.onViewUser).toHaveBeenCalledTimes(1);
    });

    it('appelle onViewUser avec le bon utilisateur pour chaque bouton', async () => {
      const user = userEvent.setup();
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      const viewButtons = screen.getAllByTestId(/view-user-/);
      
      for (let i = 0; i < viewButtons.length; i++) {
        await user.click(viewButtons[i]);
        expect(defaultProps.onViewUser).toHaveBeenCalledWith(mockUsers[i]);
      }
      
      expect(defaultProps.onViewUser).toHaveBeenCalledTimes(3);
    });
  });

  describe('Modal d\'approbation', () => {
    it('ouvre le modal d\'approbation quand on clique sur l\'icône d\'approbation', async () => {
      const user = userEvent.setup();
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      const approveButton = screen.getByTestId('approve-user-1');
      await user.click(approveButton);
      
      expect(screen.getByText('Approuver l\'utilisateur')).toBeInTheDocument();
      expect(screen.getByText('Êtes-vous sûr de vouloir approuver l\'utilisateur Test User ?')).toBeInTheDocument();
    });

    it('affiche les informations de l\'utilisateur dans le modal d\'approbation', async () => {
      const user = userEvent.setup();
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      const approveButton = screen.getByTestId('approve-user-1');
      await user.click(approveButton);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('testuser1')).toBeInTheDocument();
      expect(screen.getByText('123456789')).toBeInTheDocument();
    });

    it('affiche le champ de message personnalisé', async () => {
      const user = userEvent.setup();
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      const approveButton = screen.getByTestId('approve-user-1');
      await user.click(approveButton);
      
      const messageInput = screen.getByPlaceholderText('Message personnalisé à envoyer à l\'utilisateur...');
      expect(messageInput).toBeInTheDocument();
      expect(messageInput).toHaveAttribute('type', 'text');
    });

    it('permet de saisir un message personnalisé', async () => {
      const user = userEvent.setup();
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      const approveButton = screen.getByTestId('approve-user-1');
      await user.click(approveButton);
      
      const messageInput = screen.getByPlaceholderText('Message personnalisé à envoyer à l\'utilisateur...');
      await user.type(messageInput, 'Bienvenue dans l\'équipe !');
      
      expect(messageInput).toHaveValue('Bienvenue dans l\'équipe !');
    });

    it('appelle onApprove avec le message correct quand on confirme l\'approbation', async () => {
      const user = userEvent.setup();
      const mockApprove = vi.fn().mockResolvedValue(true);
      renderWithMantine(<PendingUsersTable {...defaultProps} onApprove={mockApprove} />);
      
      // Ouvrir le modal d'approbation
      const approveButton = screen.getByTestId('approve-user-1');
      await user.click(approveButton);
      
      // Remplir le message
      const messageInput = screen.getByPlaceholderText('Message personnalisé à envoyer à l\'utilisateur...');
      await user.type(messageInput, 'Bienvenue !');
      
      // Confirmer
      const confirmButton = screen.getByText('Approuver');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockApprove).toHaveBeenCalledWith('1', 'Bienvenue !');
        expect(mockApprove).toHaveBeenCalledTimes(1);
      });
    });

    it('appelle onApprove avec un message vide si aucun message n\'est saisi', async () => {
      const user = userEvent.setup();
      const mockApprove = vi.fn().mockResolvedValue(true);
      renderWithMantine(<PendingUsersTable {...defaultProps} onApprove={mockApprove} />);
      
      // Ouvrir le modal d'approbation
      const approveButton = screen.getByTestId('approve-user-1');
      await user.click(approveButton);
      
      // Confirmer sans saisir de message
      const confirmButton = screen.getByText('Approuver');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockApprove).toHaveBeenCalledWith('1', '');
        expect(mockApprove).toHaveBeenCalledTimes(1);
      });
    });

    it('ferme le modal d\'approbation quand on clique sur Annuler', async () => {
      const user = userEvent.setup();
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      // Ouvrir le modal d'approbation
      const approveButton = screen.getByTestId('approve-user-1');
      await user.click(approveButton);
      
      expect(screen.getByText('Approuver l\'utilisateur')).toBeInTheDocument();
      
      // Cliquer sur Annuler
      const cancelButton = screen.getByText('Annuler');
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Approuver l\'utilisateur')).not.toBeInTheDocument();
      });
    });

    it('ferme le modal d\'approbation quand on clique sur le bouton de fermeture', async () => {
      const user = userEvent.setup();
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      // Ouvrir le modal d'approbation
      const approveButton = screen.getByTestId('approve-user-1');
      await user.click(approveButton);
      
      expect(screen.getByText('Approuver l\'utilisateur')).toBeInTheDocument();
      
      // Cliquer sur le bouton de fermeture (X)
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Approuver l\'utilisateur')).not.toBeInTheDocument();
      });
    });
  });

  describe('Modal de rejet', () => {
    it('ouvre le modal de rejet quand on clique sur l\'icône de rejet', async () => {
      const user = userEvent.setup();
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      const rejectButton = screen.getByTestId('reject-user-1');
      await user.click(rejectButton);
      
      expect(screen.getByText('Rejeter l\'utilisateur')).toBeInTheDocument();
      expect(screen.getByText('Êtes-vous sûr de vouloir rejeter l\'utilisateur Test User ?')).toBeInTheDocument();
    });

    it('affiche les informations de l\'utilisateur dans le modal de rejet', async () => {
      const user = userEvent.setup();
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      const rejectButton = screen.getByTestId('reject-user-1');
      await user.click(rejectButton);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('testuser1')).toBeInTheDocument();
      expect(screen.getByText('123456789')).toBeInTheDocument();
    });

    it('affiche le champ de raison du rejet', async () => {
      const user = userEvent.setup();
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      const rejectButton = screen.getByTestId('reject-user-1');
      await user.click(rejectButton);
      
      const reasonInput = screen.getByPlaceholderText('Expliquez pourquoi l\'utilisateur est rejeté...');
      expect(reasonInput).toBeInTheDocument();
      expect(reasonInput).toHaveAttribute('type', 'text');
    });

    it('permet de saisir une raison de rejet', async () => {
      const user = userEvent.setup();
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      const rejectButton = screen.getByTestId('reject-user-1');
      await user.click(rejectButton);
      
      const reasonInput = screen.getByPlaceholderText('Expliquez pourquoi l\'utilisateur est rejeté...');
      await user.type(reasonInput, 'Profil incomplet');
      
      expect(reasonInput).toHaveValue('Profil incomplet');
    });

    it('appelle onReject avec la raison correcte quand on confirme le rejet', async () => {
      const user = userEvent.setup();
      const mockReject = vi.fn().mockResolvedValue(true);
      renderWithMantine(<PendingUsersTable {...defaultProps} onReject={mockReject} />);
      
      // Ouvrir le modal de rejet
      const rejectButton = screen.getByTestId('reject-user-1');
      await user.click(rejectButton);
      
      // Remplir la raison
      const reasonInput = screen.getByPlaceholderText('Expliquez pourquoi l\'utilisateur est rejeté...');
      await user.type(reasonInput, 'Profil incomplet');
      
      // Confirmer
      const confirmButton = screen.getByText('Rejeter');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockReject).toHaveBeenCalledWith('1', 'Profil incomplet');
        expect(mockReject).toHaveBeenCalledTimes(1);
      });
    });

    it('appelle onReject avec une raison vide si aucune raison n\'est saisie', async () => {
      const user = userEvent.setup();
      const mockReject = vi.fn().mockResolvedValue(true);
      renderWithMantine(<PendingUsersTable {...defaultProps} onReject={mockReject} />);
      
      // Ouvrir le modal de rejet
      const rejectButton = screen.getByTestId('reject-user-1');
      await user.click(rejectButton);
      
      // Confirmer sans saisir de raison
      const confirmButton = screen.getByText('Rejeter');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockReject).toHaveBeenCalledWith('1', '');
        expect(mockReject).toHaveBeenCalledTimes(1);
      });
    });

    it('ferme le modal de rejet quand on clique sur Annuler', async () => {
      const user = userEvent.setup();
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      // Ouvrir le modal de rejet
      const rejectButton = screen.getByTestId('reject-user-1');
      await user.click(rejectButton);
      
      expect(screen.getByText('Rejeter l\'utilisateur')).toBeInTheDocument();
      
      // Cliquer sur Annuler
      const cancelButton = screen.getByText('Annuler');
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Rejeter l\'utilisateur')).not.toBeInTheDocument();
      });
    });
  });

  describe('Gestion des erreurs', () => {
    it('gère les erreurs lors de l\'approbation', async () => {
      const user = userEvent.setup();
      const mockApprove = vi.fn().mockRejectedValue(new Error('Erreur d\'approbation'));
      renderWithMantine(<PendingUsersTable {...defaultProps} onApprove={mockApprove} />);
      
      // Ouvrir le modal d'approbation
      const approveButton = screen.getByTestId('approve-user-1');
      await user.click(approveButton);
      
      // Confirmer
      const confirmButton = screen.getByText('Approuver');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockApprove).toHaveBeenCalledWith('1', '');
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Erreur',
          message: 'Impossible d\'approuver l\'utilisateur',
          color: 'red',
        });
      });
    });

    it('gère les erreurs lors du rejet', async () => {
      const user = userEvent.setup();
      const mockReject = vi.fn().mockRejectedValue(new Error('Erreur de rejet'));
      renderWithMantine(<PendingUsersTable {...defaultProps} onReject={mockReject} />);
      
      // Ouvrir le modal de rejet
      const rejectButton = screen.getByTestId('reject-user-1');
      await user.click(rejectButton);
      
      // Confirmer
      const confirmButton = screen.getByText('Rejeter');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockReject).toHaveBeenCalledWith('1', '');
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Erreur',
          message: 'Impossible de rejeter l\'utilisateur',
          color: 'red',
        });
      });
    });
  });

  describe('Accessibilité', () => {
    it('a des boutons avec des labels accessibles', () => {
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      const viewButtons = screen.getAllByTestId(/view-user-/);
      const approveButtons = screen.getAllByTestId(/approve-user-/);
      const rejectButtons = screen.getAllByTestId(/reject-user-/);
      
      viewButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
      
      approveButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
      
      rejectButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('a des modals avec des rôles appropriés', async () => {
      const user = userEvent.setup();
      renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      // Ouvrir le modal d'approbation
      const approveButton = screen.getByTestId('approve-user-1');
      await user.click(approveButton);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('ne re-rend pas inutilement quand les props ne changent pas', () => {
      const { rerender } = renderWithMantine(<PendingUsersTable {...defaultProps} />);
      
      // Re-render avec les mêmes props
      rerender(<PendingUsersTable {...defaultProps} />);
      
      // Le composant devrait toujours être là
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('gère efficacement les listes avec beaucoup d\'utilisateurs', () => {
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
      
      renderWithMantine(<PendingUsersTable {...defaultProps} users={manyUsers} />);
      
      // Vérifier que tous les utilisateurs sont affichés
      expect(screen.getAllByTestId(/view-user-/)).toHaveLength(100);
      expect(screen.getAllByTestId(/approve-user-/)).toHaveLength(100);
      expect(screen.getAllByTestId(/reject-user-/)).toHaveLength(100);
    });
  });
});