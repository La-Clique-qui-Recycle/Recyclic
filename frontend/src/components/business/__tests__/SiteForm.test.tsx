import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SiteForm from '../SiteForm';
import { vi } from 'vitest';

vi.mock('../../../services/api', () => ({
  createSite: vi.fn(),
  updateSite: vi.fn(),
}));

const mockSite = {
  id: '1',
  name: 'Site Principal',
  address: '123 Rue de la Paix',
  city: 'Paris',
  postal_code: '75001',
  country: 'France',
  is_active: true,
};

const mockOnSuccess = vi.fn();
const mockOnCancel = vi.fn();

// Import the mocked functions after module is mocked
import { createSite, updateSite } from '../../../services/api';

describe('SiteForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSite).mockResolvedValue({ id: 'new-site', ...mockSite });
    vi.mocked(updateSite).mockResolvedValue(mockSite);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Create Mode', () => {
    it('should render create form correctly', () => {
      render(
        <SiteForm
          site={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('heading', { name: /créer un site/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /créer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
    });

    it('should have empty form fields initially', () => {
      render(
        <SiteForm
          site={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('textbox', { name: /nom/i })).toHaveValue('');
      expect(screen.getByRole('textbox', { name: /adresse/i })).toHaveValue('');
      expect(screen.getByRole('textbox', { name: /ville/i })).toHaveValue('');
      expect(screen.getByRole('textbox', { name: /code postal/i })).toHaveValue('');
      expect(screen.getByRole('textbox', { name: /pays/i })).toHaveValue('');
      expect(screen.getByRole('checkbox', { name: /site actif/i })).toBeChecked();
    });

    it('should create site with form data on submit', async () => {
      const user = userEvent.setup();
      render(
        <SiteForm
          site={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Fill form
      await act(async () => {
        await user.type(screen.getByRole('textbox', { name: /nom/i }), 'Nouveau Site');
        await user.type(screen.getByRole('textbox', { name: /adresse/i }), '123 Nouvelle Rue');
        await user.type(screen.getByRole('textbox', { name: /ville/i }), 'Lyon');
        await user.type(screen.getByRole('textbox', { name: /code postal/i }), '69000');
        await user.type(screen.getByRole('textbox', { name: /pays/i }), 'France');
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /créer/i });
      await act(async () => {
        await user.click(submitButton);
      });

      await waitFor(() => {
        expect(vi.mocked(createSite)).toHaveBeenCalledWith({
          name: 'Nouveau Site',
          address: '123 Nouvelle Rue',
          city: 'Lyon',
          postal_code: '69000',
          country: 'France',
          is_active: true,
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('should handle checkbox toggling', async () => {
      const user = userEvent.setup();
      render(
        <SiteForm
          site={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /site actif/i });
      expect(checkbox).toBeChecked();

      await act(async () => {
        await user.click(checkbox);
      });

      expect(checkbox).not.toBeChecked();

      // Fill required field and submit
      await act(async () => {
        await user.type(screen.getByRole('textbox', { name: /nom/i }), 'Site Inactif');
      });

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await act(async () => {
        await user.click(submitButton);
      });

      await waitFor(() => {
        expect(vi.mocked(createSite)).toHaveBeenCalledWith({
          name: 'Site Inactif',
          address: '',
          city: '',
          postal_code: '',
          country: '',
          is_active: false,
        });
      });
    });
  });

  describe('Edit Mode', () => {
    it('should render edit form correctly', () => {
      render(
        <SiteForm
          site={mockSite}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('heading', { name: /modifier le site/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
    });

    it('should populate form fields with site data', () => {
      render(
        <SiteForm
          site={mockSite}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('textbox', { name: /nom/i })).toHaveValue('Site Principal');
      expect(screen.getByRole('textbox', { name: /adresse/i })).toHaveValue('123 Rue de la Paix');
      expect(screen.getByRole('textbox', { name: /ville/i })).toHaveValue('Paris');
      expect(screen.getByRole('textbox', { name: /code postal/i })).toHaveValue('75001');
      expect(screen.getByRole('textbox', { name: /pays/i })).toHaveValue('France');
      expect(screen.getByRole('checkbox', { name: /site actif/i })).toBeChecked();
    });

    it('should handle null/undefined values gracefully', () => {
      const siteWithNulls = {
        ...mockSite,
        address: null,
        city: undefined,
        postal_code: null,
        country: undefined,
      };

      render(
        <SiteForm
          site={siteWithNulls}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('textbox', { name: /nom/i })).toHaveValue('Site Principal');
      expect(screen.getByRole('textbox', { name: /adresse/i })).toHaveValue('');
      expect(screen.getByRole('textbox', { name: /ville/i })).toHaveValue('');
      expect(screen.getByRole('textbox', { name: /code postal/i })).toHaveValue('');
      expect(screen.getByRole('textbox', { name: /pays/i })).toHaveValue('');
    });

    it('should update site with modified data on submit', async () => {
      const user = userEvent.setup();
      render(
        <SiteForm
          site={mockSite}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Modify form data
      const nameInput = screen.getByRole('textbox', { name: /nom/i });
      await act(async () => {
        await user.clear(nameInput);
        await user.type(nameInput, 'Site Principal Modifié');
      });

      const cityInput = screen.getByRole('textbox', { name: /ville/i });
      await act(async () => {
        await user.clear(cityInput);
        await user.type(cityInput, 'Marseille');
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /modifier/i });
      await act(async () => {
        await user.click(submitButton);
      });

      await waitFor(() => {
        expect(vi.mocked(updateSite)).toHaveBeenCalledWith('1', {
          name: 'Site Principal Modifié',
          address: '123 Rue de la Paix',
          city: 'Marseille',
          postal_code: '75001',
          country: 'France',
          is_active: true,
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('should require name field', async () => {
      const user = userEvent.setup();
      render(
        <SiteForm
          site={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByRole('textbox', { name: /nom/i });
      expect(nameInput).toBeRequired();

      // Try to submit without name
      const submitButton = screen.getByRole('button', { name: /créer/i });
      await act(async () => {
        await user.click(submitButton);
      });

      // Should not call API
      expect(vi.mocked(createSite)).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should allow submission with only name field filled', async () => {
      const user = userEvent.setup();
      render(
        <SiteForm
          site={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Fill only required field
      await act(async () => {
        await user.type(screen.getByRole('textbox', { name: /nom/i }), 'Site Minimal');
      });

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await act(async () => {
        await user.click(submitButton);
      });

      await waitFor(() => {
        expect(vi.mocked(createSite)).toHaveBeenCalledWith({
          name: 'Site Minimal',
          address: '',
          city: '',
          postal_code: '',
          country: '',
          is_active: true,
        });
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      // Mock slow API call
      vi.mocked(createSite).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <SiteForm
          site={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Fill required field
      await act(async () => {
        await user.type(screen.getByRole('textbox', { name: /nom/i }), 'Nouveau Site');
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /créer/i });
      await act(async () => {
        await user.click(submitButton);
      });

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sauvegarde.../i })).toBeInTheDocument();
      });

      // Button should be disabled
      const loadingButton = screen.getByRole('button', { name: /sauvegarde.../i });
      expect(loadingButton).toBeDisabled();
    });

    it('should disable form during loading', async () => {
      const user = userEvent.setup();
      // Mock slow API call
      vi.mocked(createSite).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <SiteForm
          site={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Fill required field
      await act(async () => {
        await user.type(screen.getByRole('textbox', { name: /nom/i }), 'Nouveau Site');
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /créer/i });
      await act(async () => {
        await user.click(submitButton);
      });

      // Button should be disabled during loading
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', { name: /sauvegarde.../i });
        expect(loadingButton).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display API error messages', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Site name already exists';
      vi.mocked(createSite).mockRejectedValue({
        response: {
          data: {
            detail: errorMessage,
          },
        },
      });

      render(
        <SiteForm
          site={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Fill and submit form
      await act(async () => {
        await user.type(screen.getByRole('textbox', { name: /nom/i }), 'Duplicate Site');
      });

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await act(async () => {
        await user.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Should not call onSuccess
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should display generic error message for unknown errors', async () => {
      const user = userEvent.setup();
      vi.mocked(createSite).mockRejectedValue(new Error('Network error'));

      render(
        <SiteForm
          site={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Fill and submit form
      await act(async () => {
        await user.type(screen.getByRole('textbox', { name: /nom/i }), 'Test Site');
      });

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await act(async () => {
        await user.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should display fallback error message for empty errors', async () => {
      const user = userEvent.setup();
      vi.mocked(createSite).mockRejectedValue({});

      render(
        <SiteForm
          site={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Fill and submit form
      await act(async () => {
        await user.type(screen.getByRole('textbox', { name: /nom/i }), 'Test Site');
      });

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await act(async () => {
        await user.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Erreur lors de la sauvegarde')).toBeInTheDocument();
      });
    });

    it('should clear error on subsequent submission attempts', async () => {
      const user = userEvent.setup();
      vi.mocked(createSite).mockRejectedValueOnce(new Error('First error'));
      vi.mocked(createSite).mockResolvedValueOnce({ id: 'new-site' });

      render(
        <SiteForm
          site={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Fill and submit form (first attempt - fails)
      await act(async () => {
        await user.type(screen.getByRole('textbox', { name: /nom/i }), 'Test Site');
      });

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await act(async () => {
        await user.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Submit again (second attempt - succeeds)
      await act(async () => {
        await user.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  describe('Cancel Behavior', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <SiteForm
          site={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /annuler/i });
      await act(async () => {
        await user.click(cancelButton);
      });

      expect(mockOnCancel).toHaveBeenCalled();
      expect(vi.mocked(createSite)).not.toHaveBeenCalled();
    });

    it('should not lose form data after failed submission', async () => {
      const user = userEvent.setup();
      vi.mocked(createSite).mockRejectedValue(new Error('API Error'));

      render(
        <SiteForm
          site={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Fill form
      await act(async () => {
        await user.type(screen.getByRole('textbox', { name: /nom/i }), 'Test Site');
        await user.type(screen.getByRole('textbox', { name: /ville/i }), 'Test City');
      });

      // Submit and fail
      const submitButton = screen.getByRole('button', { name: /créer/i });
      await act(async () => {
        await user.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });

      // Form data should still be there
      expect(screen.getByRole('textbox', { name: /nom/i })).toHaveValue('Test Site');
      expect(screen.getByRole('textbox', { name: /ville/i })).toHaveValue('Test City');
    });
  });

  describe('Prop Changes', () => {
    it('should update form data when site prop changes', () => {
      const { rerender } = render(
        <SiteForm
          site={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('textbox', { name: /nom/i })).toHaveValue('');

      // Update with site data
      rerender(
        <SiteForm
          site={mockSite}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('textbox', { name: /nom/i })).toHaveValue('Site Principal');
      expect(screen.getByRole('heading', { name: /modifier le site/i })).toBeInTheDocument();
    });

    it('should reset form when changing from edit to create mode', () => {
      const { rerender } = render(
        <SiteForm
          site={mockSite}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('textbox', { name: /nom/i })).toHaveValue('Site Principal');

      // Change to create mode
      rerender(
        <SiteForm
          site={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('textbox', { name: /nom/i })).toHaveValue('');
      expect(screen.getByRole('heading', { name: /créer un site/i })).toBeInTheDocument();
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper form structure', () => {
      render(
        <SiteForm
          site={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();

      // All form fields should have labels
      const nameInput = screen.getByRole('textbox', { name: /nom/i });
      const addressInput = screen.getByRole('textbox', { name: /adresse/i });
      const cityInput = screen.getByRole('textbox', { name: /ville/i });
      const postalCodeInput = screen.getByRole('textbox', { name: /code postal/i });
      const countryInput = screen.getByRole('textbox', { name: /pays/i });
      const activeCheckbox = screen.getByRole('checkbox', { name: /site actif/i });

      expect(nameInput).toHaveAccessibleName();
      expect(addressInput).toHaveAccessibleName();
      expect(cityInput).toHaveAccessibleName();
      expect(postalCodeInput).toHaveAccessibleName();
      expect(countryInput).toHaveAccessibleName();
      expect(activeCheckbox).toHaveAccessibleName();
    });

    it('should have proper input associations', () => {
      render(
        <SiteForm
          site={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Check that inputs have proper id/htmlFor associations
      const nameLabel = screen.getByText('Nom *');
      const nameInput = screen.getByRole('textbox', { name: /nom/i });

      expect(nameLabel).toHaveAttribute('for', 'name');
      expect(nameInput).toHaveAttribute('id', 'name');
    });
  });
});