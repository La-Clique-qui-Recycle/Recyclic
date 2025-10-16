import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CashRegisters from '../CashRegisters';
import * as api from '../../../services/api';

// Mock the API module
vi.mock('../../../services/api', () => ({
  getCashRegisters: vi.fn(),
  deleteCashRegister: vi.fn(),
}));

// Mock the form components
vi.mock('../../../components/business/CashRegisterForm', () => ({
  default: ({ onSuccess, onCancel }: any) => (
    <div data-testid="cash-register-form">
      <button onClick={onSuccess}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('../../../components/business/DeleteConfirmationModal', () => ({
  default: ({ isOpen, onConfirm, onCancel }: any) =>
    isOpen ? (
      <div data-testid="delete-modal">
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}));

describe('CashRegisters', () => {
  const mockCashRegisters = [
    {
      id: '1',
      name: 'Caisse Principale',
      location: 'Entrée',
      site_id: 'site-1',
      is_active: true,
    },
    {
      id: '2',
      name: 'Caisse Secondaire',
      location: 'Sortie',
      site_id: 'site-1',
      is_active: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Success scenarios', () => {
    it('should load and display cash registers successfully', async () => {
      vi.mocked(api.getCashRegisters).mockResolvedValue(mockCashRegisters);

      render(<CashRegisters />);

      // Should show loading initially
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByTestId('cash-registers-table')).toBeInTheDocument();
      });

      // Should display cash registers
      expect(screen.getByText('Caisse Principale')).toBeInTheDocument();
      expect(screen.getByText('Caisse Secondaire')).toBeInTheDocument();
      expect(screen.getByText('Entrée')).toBeInTheDocument();
      expect(screen.getByText('Sortie')).toBeInTheDocument();
    });

    it('should display empty state when no cash registers exist', async () => {
      vi.mocked(api.getCashRegisters).mockResolvedValue([]);

      render(<CashRegisters />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });

      expect(screen.getByText('Aucun poste de caisse configuré')).toBeInTheDocument();
    });

    it('should support API responses wrapped in data property', async () => {
      vi.mocked(api.getCashRegisters).mockResolvedValue({ data: mockCashRegisters } as any);

      render(<CashRegisters />);

      await waitFor(() => {
        expect(screen.getByTestId('cash-registers-table')).toBeInTheDocument();
      });

      expect(screen.getByText('Caisse Principale')).toBeInTheDocument();
      expect(screen.getByText('Entrée')).toBeInTheDocument();
    });

    it('should handle non-array response gracefully', async () => {
      // Simulate malformed API response
      vi.mocked(api.getCashRegisters).mockResolvedValue(null as any);

      render(<CashRegisters />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });

      // Should not crash and show empty state
      expect(screen.getByText('Aucun poste de caisse configuré')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should display error message with retry button on network error', async () => {
      const networkError = {
        code: 'NETWORK_ERROR',
        message: 'Network Error',
      };
      vi.mocked(api.getCashRegisters).mockRejectedValue(networkError);

      render(<CashRegisters />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Problème de connexion réseau. Vérifiez votre connexion internet.')
      ).toBeInTheDocument();
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    it('should display error message with retry button on ERR_NETWORK error', async () => {
      const networkError = {
        code: 'ERR_NETWORK',
        message: 'Network Error',
      };
      vi.mocked(api.getCashRegisters).mockRejectedValue(networkError);

      render(<CashRegisters />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Problème de connexion réseau. Vérifiez votre connexion internet.')
      ).toBeInTheDocument();
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    it('should display error message on 401 unauthorized', async () => {
      const error = {
        response: { status: 401 },
      };
      vi.mocked(api.getCashRegisters).mockRejectedValue(error);

      render(<CashRegisters />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(screen.getByText('Session expirée. Veuillez vous reconnecter.')).toBeInTheDocument();
    });

    it('should display error message on 403 forbidden', async () => {
      const error = {
        response: { status: 403 },
      };
      vi.mocked(api.getCashRegisters).mockRejectedValue(error);

      render(<CashRegisters />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(
        screen.getByText(
          "Vous n'avez pas les permissions nécessaires pour accéder aux postes de caisse."
        )
      ).toBeInTheDocument();
    });

    it('should display error message on 500 server error', async () => {
      const error = {
        response: { status: 500 },
      };
      vi.mocked(api.getCashRegisters).mockRejectedValue(error);

      render(<CashRegisters />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Erreur serveur. Veuillez réessayer dans quelques instants.')
      ).toBeInTheDocument();
    });

    it('should retry loading when retry button is clicked', async () => {
      const error = {
        response: { status: 500 },
      };
      vi.mocked(api.getCashRegisters)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockCashRegisters);

      render(<CashRegisters />);

      // Wait for error to display
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByTestId('retry-button');
      await userEvent.click(retryButton);

      // Should successfully load data on retry
      await waitFor(() => {
        expect(screen.getByTestId('cash-registers-table')).toBeInTheDocument();
      });

      expect(screen.getByText('Caisse Principale')).toBeInTheDocument();
    });
  });

  describe('User interactions', () => {
    beforeEach(() => {
      vi.mocked(api.getCashRegisters).mockResolvedValue(mockCashRegisters);
    });

    it('should open create form when create button is clicked', async () => {
      render(<CashRegisters />);

      await waitFor(() => {
        expect(screen.getByTestId('cash-registers-table')).toBeInTheDocument();
      });

      const createButton = screen.getByTestId('create-cash-register-button');
      await userEvent.click(createButton);

      expect(screen.getByTestId('cash-register-form-modal')).toBeInTheDocument();
    });

    it('should open edit form when edit button is clicked', async () => {
      render(<CashRegisters />);

      await waitFor(() => {
        expect(screen.getByTestId('cash-registers-table')).toBeInTheDocument();
      });

      const editButton = screen.getByTestId('edit-cash-register-1');
      await userEvent.click(editButton);

      expect(screen.getByTestId('cash-register-form-modal')).toBeInTheDocument();
    });

    it('should open delete modal when delete button is clicked', async () => {
      render(<CashRegisters />);

      await waitFor(() => {
        expect(screen.getByTestId('cash-registers-table')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId('delete-cash-register-1');
      await userEvent.click(deleteButton);

      expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
    });
  });

  describe('Delete operations', () => {
    beforeEach(() => {
      vi.mocked(api.getCashRegisters).mockResolvedValue(mockCashRegisters);
    });

    it('should successfully delete cash register', async () => {
      vi.mocked(api.deleteCashRegister).mockResolvedValue(undefined);

      render(<CashRegisters />);

      await waitFor(() => {
        expect(screen.getByTestId('cash-registers-table')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByTestId('delete-cash-register-1');
      await userEvent.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByText('Confirm');
      await userEvent.click(confirmButton);

      // Should reload data after successful deletion
      await waitFor(() => {
        expect(api.deleteCashRegister).toHaveBeenCalledWith('1');
        expect(api.getCashRegisters).toHaveBeenCalledTimes(2); // Initial load + reload
      });
    });

    it('should display error when deletion fails with 409 conflict with detail', async () => {
      const error = {
        response: {
          status: 409,
          data: { detail: 'Cannot delete: has active sessions' },
        },
      };
      vi.mocked(api.deleteCashRegister).mockRejectedValue(error);

      render(<CashRegisters />);

      await waitFor(() => {
        expect(screen.getByTestId('cash-registers-table')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByTestId('delete-cash-register-1');
      await userEvent.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByText('Confirm');
      await userEvent.click(confirmButton);

      // Should display error message
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // The detail from response.data.detail takes precedence
      expect(screen.getByText('Cannot delete: has active sessions')).toBeInTheDocument();
    });

    it('should display generic conflict error when deletion fails with 409 without detail', async () => {
      const error = {
        response: {
          status: 409,
        },
      };
      vi.mocked(api.deleteCashRegister).mockRejectedValue(error);

      render(<CashRegisters />);

      await waitFor(() => {
        expect(screen.getByTestId('cash-registers-table')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByTestId('delete-cash-register-1');
      await userEvent.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByText('Confirm');
      await userEvent.click(confirmButton);

      // Should display error message
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Should show the generic 409 error message
      expect(
        screen.getByText(
          "Ce poste de caisse ne peut pas être supprimé car il est utilisé par d'autres éléments du système."
        )
      ).toBeInTheDocument();
    });
  });
});
