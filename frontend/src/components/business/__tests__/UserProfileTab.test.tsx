import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { UserProfileTab } from '../UserProfileTab';
import { AdminUser, UserRole, UserStatus } from '../../../services/adminService';

import { vi } from 'vitest';

// Mock du service admin
vi.mock('../../../services/adminService', () => ({
  adminService: {
    updateUser: vi.fn(),
    updateUserRole: vi.fn(),
    updateUserStatus: vi.fn()
  }
}));

// Mock des notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn()
  }
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

describe('UserProfileTab', () => {
  it('affiche les informations de l\'utilisateur', () => {
    renderWithProvider(<UserProfileTab user={mockUser} />);
    
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
    expect(screen.getByText('Utilisateur')).toBeInTheDocument();
    expect(screen.getByText('Approuvé')).toBeInTheDocument();
    expect(screen.getByText('Oui')).toBeInTheDocument();
  });

  it('affiche le bouton de modification', () => {
    renderWithProvider(<UserProfileTab user={mockUser} />);
    
    expect(screen.getByText('Modifier le profil')).toBeInTheDocument();
  });

  it('ouvre la modale d\'édition quand on clique sur le bouton', () => {
    renderWithProvider(<UserProfileTab user={mockUser} />);
    
    const editButton = screen.getByText('Modifier le profil');
    fireEvent.click(editButton);
    
    expect(screen.getByText('Modifier le profil utilisateur')).toBeInTheDocument();
  });

  it('pré-remplit le formulaire avec les données de l\'utilisateur', () => {
    renderWithProvider(<UserProfileTab user={mockUser} />);
    
    const editButton = screen.getByText('Modifier le profil');
    fireEvent.click(editButton);
    
    expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('User')).toBeInTheDocument();
  });

  it('permet de fermer la modale', () => {
    renderWithProvider(<UserProfileTab user={mockUser} />);
    
    const editButton = screen.getByText('Modifier le profil');
    fireEvent.click(editButton);
    
    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText('Modifier le profil utilisateur')).not.toBeInTheDocument();
  });

  it('valide les champs requis', async () => {
    renderWithProvider(<UserProfileTab user={mockUser} />);
    
    const editButton = screen.getByText('Modifier le profil');
    fireEvent.click(editButton);
    
    // Vider le champ prénom
    const firstNameInput = screen.getByDisplayValue('Test');
    fireEvent.change(firstNameInput, { target: { value: 'A' } });
    
    const saveButton = screen.getByText('Sauvegarder');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Le prénom doit contenir au moins 2 caractères')).toBeInTheDocument();
    });
  });
});
