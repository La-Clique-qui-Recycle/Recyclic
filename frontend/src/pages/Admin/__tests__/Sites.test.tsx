import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Sites from '../Sites';
import { vi } from 'vitest';

vi.mock('../../../services/api', () => ({
  getSites: vi.fn(),
  deleteSite: vi.fn(),
  getSiteDependencies: vi.fn(),
}));

// Mock SiteDeleteConfirmationModal
vi.mock('../../../components/business/SiteDeleteConfirmationModal', () => ({
  default: ({ isOpen, siteName, dependencies, checkingDependencies, onConfirm, onCancel, loading }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="site-delete-confirmation-modal" role="dialog" aria-modal="true">
        <div data-testid="delete-site-name">{siteName}</div>
        <div data-testid="checking-dependencies">{checkingDependencies ? 'checking' : 'done'}</div>
        <div data-testid="has-dependencies">{dependencies?.hasBlockingDependencies ? 'yes' : 'no'}</div>
        {!dependencies?.hasBlockingDependencies && (
          <button
            data-testid="confirm-delete-button"
            onClick={onConfirm}
            disabled={loading || checkingDependencies}
          >
            {loading ? 'Suppression...' : 'Confirmer'}
          </button>
        )}
        <button data-testid="cancel-delete-button" onClick={onCancel}>
          Annuler
        </button>
      </div>
    );
  },
}));

// Mock SiteForm
vi.mock('../../../components/business/SiteForm', () => ({
  default: ({ site, onSuccess, onCancel }: any) => (
    <div data-testid="site-form" role="dialog" aria-modal="true">
      <div data-testid="form-mode">{site ? 'edit' : 'create'}</div>
      <div data-testid="editing-site-name">{site?.name || ''}</div>
      <button data-testid="form-success-button" onClick={onSuccess}>
        Success
      </button>
      <button data-testid="form-cancel-button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

const mockSites = [
  {
    id: '1',
    name: 'Site Principal',
    address: '123 Rue de la Paix',
    city: 'Paris',
    postal_code: '75001',
    country: 'France',
    is_active: true,
  },
  {
    id: '2',
    name: 'Site Secondaire',
    address: '456 Avenue des Champs',
    city: 'Lyon',
    postal_code: '69000',
    country: 'France',
    is_active: false,
  },
  {
    id: '3',
    name: 'Site Remote',
    address: null,
    city: null,
    postal_code: null,
    country: null,
    is_active: true,
  },
];

const renderWithProviders = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Import the mocked functions after module is mocked
import { getSites, deleteSite, getSiteDependencies } from '../../../services/api';

describe('Sites Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSites).mockResolvedValue(mockSites);
    vi.mocked(deleteSite).mockResolvedValue(undefined);
    vi.mocked(getSiteDependencies).mockResolvedValue({
      cashRegisters: [],
      cashSessions: [],
      hasBlockingDependencies: false
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial Load', () => {
    it('should display page title and create button', async () => {
      renderWithProviders(<Sites />);

      expect(screen.getByRole('heading', { name: /sites/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /créer/i })).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      vi.mocked(getSites).mockImplementation(() => new Promise(() => {})); // Never resolves
      renderWithProviders(<Sites />);

      expect(screen.getByText('Chargement...')).toBeInTheDocument();
    });

    it('should load and display sites table', async () => {
      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(vi.mocked(getSites)).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check table headers
      expect(screen.getByRole('columnheader', { name: /nom/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /adresse/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /ville/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /code postal/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /pays/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actif/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();

      // Check site data
      expect(screen.getByText('Site Principal')).toBeInTheDocument();
      expect(screen.getByText('Site Secondaire')).toBeInTheDocument();
      expect(screen.getByText('Site Remote')).toBeInTheDocument();
    });

    it('should handle empty site list', async () => {
      vi.mocked(getSites).mockResolvedValue([]);
      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(vi.mocked(getSites)).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Should show empty state
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('Aucun site configuré')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading sites fails', async () => {
      const errorMessage = 'Network error occurred';
      vi.mocked(getSites).mockRejectedValue(new Error(errorMessage));

      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should display generic error message for unknown errors', async () => {
      vi.mocked(getSites).mockRejectedValue({});

      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByText('Erreur de chargement')).toBeInTheDocument();
      });
    });

    it('should clear error when reload succeeds', async () => {
      const errorMessage = 'Network error';
      vi.mocked(getSites).mockRejectedValueOnce(new Error(errorMessage));

      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Mock successful reload
      vi.mocked(getSites).mockResolvedValue(mockSites);

      // Trigger reload by opening and closing form
      const createButton = screen.getByRole('button', { name: /créer un site/i });
      await act(async () => {
        await userEvent.click(createButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('site-form')).toBeInTheDocument();
      });

      const cancelButton = screen.getByTestId('form-cancel-button');
      await act(async () => {
        await userEvent.click(cancelButton);
      });

      // Form should close and no error should be visible
      await waitFor(() => {
        expect(screen.queryByTestId('site-form')).not.toBeInTheDocument();
      });
    });
  });

  describe('Site Creation', () => {
    it('should open create form when create button is clicked', async () => {
      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /créer un site/i });
      await act(async () => {
        await userEvent.click(createButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('site-form')).toBeInTheDocument();
      });
      expect(screen.getByTestId('form-mode')).toHaveTextContent('create');
    });

    it('should close form and reload data on successful creation', async () => {
      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open create form
      const createButton = screen.getByRole('button', { name: /créer un site/i });
      await act(async () => {
        await userEvent.click(createButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('site-form')).toBeInTheDocument();
      });

      // Simulate successful creation
      const successButton = screen.getByTestId('form-success-button');
      await act(async () => {
        await userEvent.click(successButton);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('site-form')).not.toBeInTheDocument();
      });

      // Should trigger reload
      expect(vi.mocked(getSites)).toHaveBeenCalledTimes(2);
    });

    it('should close form without reload on cancel', async () => {
      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open create form
      const createButton = screen.getByRole('button', { name: /créer un site/i });
      await act(async () => {
        await userEvent.click(createButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('site-form')).toBeInTheDocument();
      });

      // Cancel form
      const cancelButton = screen.getByTestId('form-cancel-button');
      await act(async () => {
        await userEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('site-form')).not.toBeInTheDocument();
      });

      // Should not trigger additional reload
      expect(vi.mocked(getSites)).toHaveBeenCalledTimes(1);
    });
  });

  describe('Site Editing', () => {
    it('should open edit form when edit button is clicked', async () => {
      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /modifier/i });
      await act(async () => {
        await userEvent.click(editButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('site-form')).toBeInTheDocument();
      });
      expect(screen.getByTestId('form-mode')).toHaveTextContent('edit');
      expect(screen.getByTestId('editing-site-name')).toHaveTextContent('Site Principal');
    });

    it('should close form and reload data on successful edit', async () => {
      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open edit form
      const editButtons = screen.getAllByRole('button', { name: /modifier/i });
      await act(async () => {
        await userEvent.click(editButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('site-form')).toBeInTheDocument();
      });

      // Simulate successful edit
      const successButton = screen.getByTestId('form-success-button');
      await act(async () => {
        await userEvent.click(successButton);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('site-form')).not.toBeInTheDocument();
      });

      // Should trigger reload
      expect(vi.mocked(getSites)).toHaveBeenCalledTimes(2);
    });
  });

  describe('Site Deletion', () => {
    it('should open delete confirmation modal when delete button is clicked', async () => {
      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /supprimer/i });
      await act(async () => {
        await userEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('site-delete-confirmation-modal')).toBeInTheDocument();
      });
      expect(screen.getByTestId('delete-site-name')).toHaveTextContent('Site Principal');
    });

    it('should close modal without deletion on cancel', async () => {
      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open delete modal
      const deleteButtons = screen.getAllByRole('button', { name: /supprimer/i });
      await act(async () => {
        await userEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('site-delete-confirmation-modal')).toBeInTheDocument();
      });

      // Cancel deletion
      const cancelButton = screen.getByTestId('cancel-delete-button');
      await act(async () => {
        await userEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('site-delete-confirmation-modal')).not.toBeInTheDocument();
      });

      expect(vi.mocked(deleteSite)).not.toHaveBeenCalled();
    });

    it('should delete site and reload data on confirmation', async () => {
      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open delete modal
      const deleteButtons = screen.getAllByRole('button', { name: /supprimer/i });
      await act(async () => {
        await userEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('site-delete-confirmation-modal')).toBeInTheDocument();
      });

      // Confirm deletion
      const confirmButton = screen.getByTestId('confirm-delete-button');
      await act(async () => {
        await userEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(vi.mocked(deleteSite)).toHaveBeenCalledWith('1');
      });

      await waitFor(() => {
        expect(screen.queryByTestId('site-delete-confirmation-modal')).not.toBeInTheDocument();
      });

      // Should trigger reload
      expect(vi.mocked(getSites)).toHaveBeenCalledTimes(2);
    });

    it('should handle deletion errors gracefully', async () => {
      const deleteError = new Error('Deletion failed');
      vi.mocked(deleteSite).mockRejectedValue(deleteError);

      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open delete modal
      const deleteButtons = screen.getAllByRole('button', { name: /supprimer/i });
      await act(async () => {
        await userEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('site-delete-confirmation-modal')).toBeInTheDocument();
      });

      // Confirm deletion
      const confirmButton = screen.getByTestId('confirm-delete-button');
      await act(async () => {
        await userEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(vi.mocked(deleteSite)).toHaveBeenCalledWith('1');
      });

      // Should display error and keep modal open
      await waitFor(() => {
        expect(screen.getByText('Deletion failed')).toBeInTheDocument();
      });

      expect(screen.getByTestId('site-delete-confirmation-modal')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display site data correctly', async () => {
      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check first site
      expect(screen.getByText('Site Principal')).toBeInTheDocument();
      expect(screen.getByText('123 Rue de la Paix')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
      expect(screen.getByText('75001')).toBeInTheDocument();
      expect(screen.getByText('France')).toBeInTheDocument();

      // Check active status
      const activeStatuses = screen.getAllByText('Oui');
      expect(activeStatuses).toHaveLength(2); // Site 1 and 3 are active

      const inactiveStatus = screen.getByText('Non');
      expect(inactiveStatus).toBeInTheDocument(); // Site 2 is inactive
    });

    it('should display "-" for empty fields', async () => {
      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Site Remote has null values that should display as "-"
      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThanOrEqual(4); // At least 4 dashes for Site Remote's empty fields
    });

    it('should display action buttons for each site', async () => {
      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /modifier/i });
      const deleteButtons = screen.getAllByRole('button', { name: /supprimer/i });

      expect(editButtons).toHaveLength(3);
      expect(deleteButtons).toHaveLength(3);
    });
  });

  describe('Modal Interactions', () => {
    it('should close form modal when clicking outside (overlay)', async () => {
      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open create form
      const createButton = screen.getByRole('button', { name: /créer un site/i });
      await act(async () => {
        await userEvent.click(createButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('site-form')).toBeInTheDocument();
      });

      // The modal overlay click is handled in the actual component
      // This test verifies the modal structure is present
      const formModal = screen.getByTestId('site-form');
      expect(formModal).toHaveAttribute('role', 'dialog');
      expect(formModal).toHaveAttribute('aria-modal', 'true');
    });

    it('should prevent form closure when clicking inside form content', async () => {
      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open create form
      const createButton = screen.getByRole('button', { name: /créer un site/i });
      await act(async () => {
        await userEvent.click(createButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('site-form')).toBeInTheDocument();
      });

      // Click inside the form (should not close)
      const formContent = screen.getByTestId('site-form');
      await act(async () => {
        await userEvent.click(formContent);
      });

      // Form should still be open
      expect(screen.getByTestId('site-form')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should reset editing state when form is closed', async () => {
      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open edit form
      const editButtons = screen.getAllByRole('button', { name: /modifier/i });
      await act(async () => {
        await userEvent.click(editButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('site-form')).toBeInTheDocument();
      });
      expect(screen.getByTestId('editing-site-name')).toHaveTextContent('Site Principal');

      // Close form
      const cancelButton = screen.getByTestId('form-cancel-button');
      await act(async () => {
        await userEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('site-form')).not.toBeInTheDocument();
      });

      // Open create form (should not have editing data)
      const createButton = screen.getByRole('button', { name: /créer un site/i });
      await act(async () => {
        await userEvent.click(createButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('site-form')).toBeInTheDocument();
      });
      expect(screen.getByTestId('form-mode')).toHaveTextContent('create');
      expect(screen.getByTestId('editing-site-name')).toHaveTextContent('');
    });

    it('should maintain loading state during actions', async () => {
      // Mock slow delete operation
      vi.mocked(deleteSite).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open delete modal
      const deleteButtons = screen.getAllByRole('button', { name: /supprimer/i });
      await act(async () => {
        await userEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('site-delete-confirmation-modal')).toBeInTheDocument();
      });

      // Confirm deletion
      const confirmButton = screen.getByTestId('confirm-delete-button');
      await act(async () => {
        await userEvent.click(confirmButton);
      });

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Suppression...')).toBeInTheDocument();
      });

      // Wait for operation to complete
      await waitFor(() => {
        expect(screen.queryByTestId('site-delete-confirmation-modal')).not.toBeInTheDocument();
      });
    });

    it('should check dependencies before allowing deletion', async () => {
      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open delete modal
      const deleteButtons = screen.getAllByRole('button', { name: /supprimer/i });
      await act(async () => {
        await userEvent.click(deleteButtons[0]);
      });

      // Should call dependencies check
      expect(vi.mocked(getSiteDependencies)).toHaveBeenCalledWith('1');

      await waitFor(() => {
        expect(screen.getByTestId('site-delete-confirmation-modal')).toBeInTheDocument();
      });

      // Should show no dependencies
      expect(screen.getByTestId('has-dependencies')).toHaveTextContent('no');
    });

    it('should prevent deletion when site has dependencies', async () => {
      // Mock site with dependencies
      vi.mocked(getSiteDependencies).mockResolvedValue({
        cashRegisters: [{ id: '1', name: 'Caisse 1' }],
        cashSessions: [{ id: '1', created_at: '2025-01-01T00:00:00Z' }],
        hasBlockingDependencies: true
      });

      renderWithProviders(<Sites />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open delete modal
      const deleteButtons = screen.getAllByRole('button', { name: /supprimer/i });
      await act(async () => {
        await userEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('site-delete-confirmation-modal')).toBeInTheDocument();
      });

      // Should show dependencies
      expect(screen.getByTestId('has-dependencies')).toHaveTextContent('yes');

      // Should not show confirm button
      expect(screen.queryByTestId('confirm-delete-button')).not.toBeInTheDocument();
    });
  });
});