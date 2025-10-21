import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { UserProfileTab } from '../../../components/business/UserProfileTab';
import { AdminUser } from '../../../types/admin';

// Mock des services
jest.mock('../../../services/adminService', () => ({
  updateUser: jest.fn(),
}));

const mockAdminUser: AdminUser = {
  id: '1',
  username: 'test@example.com',
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone_number: '+33123456789',
  address: '123 Rue de la Paix, 75001 Paris',
  notes: 'Notes admin sur l\'utilisateur',
  skills: 'Gestion d\'événements, Communication',
  availability: 'Weekends et vacances',
  role: 'USER',
  status: 'ACTIVE',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
};

const mockOnUserUpdated = jest.fn();

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('UserProfileTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Affichage des nouveaux champs de profil', () => {
    it('affiche tous les nouveaux champs de profil dans la vue détail', () => {
      renderWithProvider(
        <UserProfileTab 
          user={mockAdminUser} 
          onUserUpdated={mockOnUserUpdated}
          isEditing={false}
        />
      );

      // Vérifier l'affichage des nouveaux champs
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+33123456789')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123 Rue de la Paix, 75001 Paris')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Notes admin sur l\'utilisateur')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Gestion d\'événements, Communication')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Weekends et vacances')).toBeInTheDocument();
    });

    it('affiche les champs vides quand les données sont manquantes', () => {
      const userWithoutProfile = {
        ...mockAdminUser,
        phone_number: null,
        address: null,
        notes: null,
        skills: null,
        availability: null,
        email: null
      };

      renderWithProvider(
        <UserProfileTab 
          user={userWithoutProfile} 
          onUserUpdated={mockOnUserUpdated}
          isEditing={false}
        />
      );

      // Vérifier que les champs sont vides
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });
  });

  describe('Mode édition des nouveaux champs', () => {
    it('permet la modification de tous les nouveaux champs en mode édition', async () => {
      renderWithProvider(
        <UserProfileTab 
          user={mockAdminUser} 
          onUserUpdated={mockOnUserUpdated}
          isEditing={true}
        />
      );

      // Vérifier que tous les champs sont éditables
      const emailInput = screen.getByDisplayValue('test@example.com');
      const phoneInput = screen.getByDisplayValue('+33123456789');
      const addressInput = screen.getByDisplayValue('123 Rue de la Paix, 75001 Paris');
      const notesInput = screen.getByDisplayValue('Notes admin sur l\'utilisateur');
      const skillsInput = screen.getByDisplayValue('Gestion d\'événements, Communication');
      const availabilityInput = screen.getByDisplayValue('Weekends et vacances');

      expect(emailInput).not.toBeDisabled();
      expect(phoneInput).not.toBeDisabled();
      expect(addressInput).not.toBeDisabled();
      expect(notesInput).not.toBeDisabled();
      expect(skillsInput).not.toBeDisabled();
      expect(availabilityInput).not.toBeDisabled();
    });

    it('sauvegarde les modifications des nouveaux champs', async () => {
      const { updateUser } = require('../../../services/adminService');
      updateUser.mockResolvedValue({ success: true });

      renderWithProvider(
        <UserProfileTab 
          user={mockAdminUser} 
          onUserUpdated={mockOnUserUpdated}
          isEditing={true}
        />
      );

      // Modifier les champs
      const phoneInput = screen.getByDisplayValue('+33123456789');
      const addressInput = screen.getByDisplayValue('123 Rue de la Paix, 75001 Paris');
      const notesInput = screen.getByDisplayValue('Notes admin sur l\'utilisateur');

      fireEvent.change(phoneInput, { target: { value: '+33987654321' } });
      fireEvent.change(addressInput, { target: { value: '456 Avenue des Champs, 75008 Paris' } });
      fireEvent.change(notesInput, { target: { value: 'Notes modifiées' } });

      // Cliquer sur sauvegarder
      const saveButton = screen.getByText('Sauvegarder');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateUser).toHaveBeenCalledWith('1', {
          phone_number: '+33987654321',
          address: '456 Avenue des Champs, 75008 Paris',
          notes: 'Notes modifiées',
          skills: 'Gestion d\'événements, Communication',
          availability: 'Weekends et vacances',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe'
        });
      });
    });
  });

  describe('Création d\'utilisateur avec nouveaux champs', () => {
    it('affiche les champs de profil dans le formulaire de création', () => {
      renderWithProvider(
        <UserProfileTab 
          user={null} 
          onUserUpdated={mockOnUserUpdated}
          isEditing={true}
        />
      );

      // Vérifier que les champs de création sont présents
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/téléphone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/adresse/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/compétences/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/disponibilités/i)).toBeInTheDocument();
    });

    it('permet la création d\'un utilisateur avec les nouveaux champs', async () => {
      const { updateUser } = require('../../../services/adminService');
      updateUser.mockResolvedValue({ success: true });

      renderWithProvider(
        <UserProfileTab 
          user={null} 
          onUserUpdated={mockOnUserUpdated}
          isEditing={true}
        />

        // Remplir le formulaire de création
        fireEvent.change(screen.getByLabelText(/email/i), { 
          target: { value: 'newuser@example.com' } 
        });
        fireEvent.change(screen.getByLabelText(/téléphone/i), { 
          target: { value: '+33111111111' } 
        });
        fireEvent.change(screen.getByLabelText(/adresse/i), { 
          target: { value: '789 Rue Nouvelle, 75001 Paris' } 
        });
        fireEvent.change(screen.getByLabelText(/notes/i), { 
          target: { value: 'Notes du nouvel utilisateur' } 
        });

        // Cliquer sur créer
        const createButton = screen.getByText('Créer');
        fireEvent.click(createButton);

        await waitFor(() => {
          expect(updateUser).toHaveBeenCalledWith(expect.any(String), {
            email: 'newuser@example.com',
            phone_number: '+33111111111',
            address: '789 Rue Nouvelle, 75001 Paris',
            notes: 'Notes du nouvel utilisateur',
            skills: '',
            availability: ''
          });
        });
      });
    });
  });

  describe('Validation des champs', () => {
    it('valide le format de l\'email', () => {
      renderWithProvider(
        <UserProfileTab 
          user={mockAdminUser} 
          onUserUpdated={mockOnUserUpdated}
          isEditing={true}
        />
      );

      const emailInput = screen.getByDisplayValue('test@example.com');
      fireEvent.change(emailInput, { target: { value: 'email-invalide' } });
      fireEvent.blur(emailInput);

      // Vérifier que l'erreur de validation est affichée
      expect(screen.getByText(/email invalide/i)).toBeInTheDocument();
    });

    it('accepte les champs optionnels vides', () => {
      renderWithProvider(
        <UserProfileTab 
          user={mockAdminUser} 
          onUserUpdated={mockOnUserUpdated}
          isEditing={true}
        />
      );

      // Vider les champs optionnels
      const phoneInput = screen.getByDisplayValue('+33123456789');
      const addressInput = screen.getByDisplayValue('123 Rue de la Paix, 75001 Paris');
      
      fireEvent.change(phoneInput, { target: { value: '' } });
      fireEvent.change(addressInput, { target: { value: '' } });

      // Vérifier qu'aucune erreur n'est affichée
      expect(screen.queryByText(/requis/i)).not.toBeInTheDocument();
    });
  });
});


