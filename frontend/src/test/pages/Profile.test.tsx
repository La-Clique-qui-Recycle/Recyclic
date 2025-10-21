import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Profile } from '../../../pages/Profile';
import { User } from '../../../types/user';

// Mock des services
jest.mock('../../../services/userService', () => ({
  updateUserProfile: jest.fn(),
}));

const mockUser: User = {
  id: '1',
  username: 'test@example.com',
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone_number: '+33123456789',
  address: '123 Rue de la Paix, 75001 Paris',
  role: 'USER',
  status: 'ACTIVE',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('Profile Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Affichage des champs utilisateur autorisés', () => {
    it('affiche seulement phone_number et address pour l\'utilisateur', () => {
      renderWithProvider(<Profile />);

      // Vérifier que les champs utilisateur sont présents
      expect(screen.getByLabelText(/téléphone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/adresse/i)).toBeInTheDocument();

      // Vérifier que les champs admin ne sont PAS présents
      expect(screen.queryByLabelText(/notes/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/compétences/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/disponibilités/i)).not.toBeInTheDocument();
    });

    it('affiche les valeurs actuelles des champs utilisateur', () => {
      // Mock du contexte utilisateur
      jest.doMock('../../../contexts/UserContext', () => ({
        useUser: () => ({
          user: mockUser,
          setUser: jest.fn()
        })
      }));

      renderWithProvider(<Profile />);

      // Vérifier l'affichage des valeurs
      expect(screen.getByDisplayValue('+33123456789')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123 Rue de la Paix, 75001 Paris')).toBeInTheDocument();
    });

    it('affiche des champs vides quand les données sont manquantes', () => {
      const userWithoutProfile = {
        ...mockUser,
        phone_number: null,
        address: null
      };

      jest.doMock('../../../contexts/UserContext', () => ({
        useUser: () => ({
          user: userWithoutProfile,
          setUser: jest.fn()
        })
      }));

      renderWithProvider(<Profile />);

      // Vérifier que les champs sont vides
      const phoneInput = screen.getByLabelText(/téléphone/i);
      const addressInput = screen.getByLabelText(/adresse/i);
      
      expect(phoneInput).toHaveValue('');
      expect(addressInput).toHaveValue('');
    });
  });

  describe('Modification des champs utilisateur', () => {
    it('permet la modification de phone_number et address', () => {
      renderWithProvider(<Profile />);

      const phoneInput = screen.getByLabelText(/téléphone/i);
      const addressInput = screen.getByLabelText(/adresse/i);

      // Vérifier que les champs sont éditables
      expect(phoneInput).not.toBeDisabled();
      expect(addressInput).not.toBeDisabled();

      // Modifier les valeurs
      fireEvent.change(phoneInput, { target: { value: '+33987654321' } });
      fireEvent.change(addressInput, { target: { value: '456 Avenue des Champs, 75008 Paris' } });

      // Vérifier que les valeurs ont changé
      expect(phoneInput).toHaveValue('+33987654321');
      expect(addressInput).toHaveValue('456 Avenue des Champs, 75008 Paris');
    });

    it('sauvegarde les modifications des champs utilisateur', async () => {
      const { updateUserProfile } = require('../../../services/userService');
      updateUserProfile.mockResolvedValue({ success: true });

      renderWithProvider(<Profile />);

      // Modifier les champs
      const phoneInput = screen.getByLabelText(/téléphone/i);
      const addressInput = screen.getByLabelText(/adresse/i);

      fireEvent.change(phoneInput, { target: { value: '+33987654321' } });
      fireEvent.change(addressInput, { target: { value: '456 Avenue des Champs, 75008 Paris' } });

      // Cliquer sur sauvegarder
      const saveButton = screen.getByText(/sauvegarder/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateUserProfile).toHaveBeenCalledWith({
          phone_number: '+33987654321',
          address: '456 Avenue des Champs, 75008 Paris'
        });
      });
    });

    it('affiche un message de succès après sauvegarde', async () => {
      const { updateUserProfile } = require('../../../services/userService');
      updateUserProfile.mockResolvedValue({ success: true });

      renderWithProvider(<Profile />);

      // Modifier et sauvegarder
      const phoneInput = screen.getByLabelText(/téléphone/i);
      fireEvent.change(phoneInput, { target: { value: '+33987654321' } });

      const saveButton = screen.getByText(/sauvegarder/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/profil mis à jour/i)).toBeInTheDocument();
      });
    });

    it('affiche un message d\'erreur en cas d\'échec', async () => {
      const { updateUserProfile } = require('../../../services/userService');
      updateUserProfile.mockRejectedValue(new Error('Erreur de sauvegarde'));

      renderWithProvider(<Profile />);

      // Modifier et sauvegarder
      const phoneInput = screen.getByLabelText(/téléphone/i);
      fireEvent.change(phoneInput, { target: { value: '+33987654321' } });

      const saveButton = screen.getByText(/sauvegarder/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/erreur de sauvegarde/i)).toBeInTheDocument();
      });
    });
  });

  describe('Validation des champs utilisateur', () => {
    it('accepte les champs optionnels vides', () => {
      renderWithProvider(<Profile />);

      const phoneInput = screen.getByLabelText(/téléphone/i);
      const addressInput = screen.getByLabelText(/adresse/i);

      // Vider les champs
      fireEvent.change(phoneInput, { target: { value: '' } });
      fireEvent.change(addressInput, { target: { value: '' } });

      // Vérifier qu'aucune erreur n'est affichée
      expect(screen.queryByText(/requis/i)).not.toBeInTheDocument();
    });

    it('valide le format du numéro de téléphone', () => {
      renderWithProvider(<Profile />);

      const phoneInput = screen.getByLabelText(/téléphone/i);
      
      // Tester avec un format invalide
      fireEvent.change(phoneInput, { target: { value: '123' } });
      fireEvent.blur(phoneInput);

      // Vérifier que l'erreur de validation est affichée
      expect(screen.getByText(/format de téléphone invalide/i)).toBeInTheDocument();
    });

    it('accepte les formats de téléphone valides', () => {
      renderWithProvider(<Profile />);

      const phoneInput = screen.getByLabelText(/téléphone/i);
      
      // Tester avec des formats valides
      const validFormats = ['+33123456789', '0123456789', '01 23 45 67 89'];
      
      validFormats.forEach(format => {
        fireEvent.change(phoneInput, { target: { value: format } });
        fireEvent.blur(phoneInput);
        
        // Vérifier qu'aucune erreur n'est affichée
        expect(screen.queryByText(/format de téléphone invalide/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Sécurité - Champs admin masqués', () => {
    it('ne permet pas l\'accès aux champs admin', () => {
      renderWithProvider(<Profile />);

      // Vérifier que les champs admin ne sont pas présents dans le DOM
      expect(screen.queryByLabelText(/notes/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/compétences/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/disponibilités/i)).not.toBeInTheDocument();
    });

    it('n\'envoie pas les champs admin lors de la sauvegarde', async () => {
      const { updateUserProfile } = require('../../../services/userService');
      updateUserProfile.mockResolvedValue({ success: true });

      renderWithProvider(<Profile />);

      // Modifier seulement les champs utilisateur
      const phoneInput = screen.getByLabelText(/téléphone/i);
      fireEvent.change(phoneInput, { target: { value: '+33987654321' } });

      const saveButton = screen.getByText(/sauvegarder/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        // Vérifier que seuls les champs utilisateur sont envoyés
        expect(updateUserProfile).toHaveBeenCalledWith({
          phone_number: '+33987654321',
          address: expect.any(String)
        });
        
        // Vérifier que les champs admin ne sont pas envoyés
        const callArgs = updateUserProfile.mock.calls[0][0];
        expect(callArgs).not.toHaveProperty('notes');
        expect(callArgs).not.toHaveProperty('skills');
        expect(callArgs).not.toHaveProperty('availability');
      });
    });
  });
});