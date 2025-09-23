import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SiteForm from '../../../components/business/SiteForm';
import { createSite, updateSite } from '../../../services/api';

// Mock the API services
vi.mock('../../../services/api', () => ({
  createSite: vi.fn(),
  updateSite: vi.fn(),
}));

const mockCreateSite = vi.mocked(createSite);
const mockUpdateSite = vi.mocked(updateSite);

const mockSite = {
  id: '1',
  name: 'Test Site',
  address: '123 Test Street',
  city: 'Test City',
  postal_code: '12345',
  country: 'France',
  is_active: true,
};

const renderSiteForm = (site = null, onSuccess = vi.fn(), onCancel = vi.fn()) => {
  return render(
    <SiteForm
      site={site}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
};

describe('SiteForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render create form with correct title and fields', () => {
    renderSiteForm();

    expect(screen.getByRole('heading', { name: 'Créer un site' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nom *')).toBeInTheDocument();
    expect(screen.getByLabelText('Adresse')).toBeInTheDocument();
    expect(screen.getByLabelText('Ville')).toBeInTheDocument();
    expect(screen.getByLabelText('Code postal')).toBeInTheDocument();
    expect(screen.getByLabelText('Pays')).toBeInTheDocument();
    expect(screen.getByLabelText('Site actif')).toBeInTheDocument();
  });

  it('should render edit form with correct title when site is provided', () => {
    renderSiteForm(mockSite);

    expect(screen.getByRole('heading', { name: 'Modifier le site' })).toBeInTheDocument();
  });

  it('should populate form fields with site data when editing', () => {
    renderSiteForm(mockSite);

    expect(screen.getByDisplayValue('Test Site')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Test Street')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test City')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12345')).toBeInTheDocument();
    expect(screen.getByDisplayValue('France')).toBeInTheDocument();
    expect(screen.getByLabelText('Site actif')).toBeChecked();
  });

  it('should call createSite when form is submitted for creation', async () => {
    mockCreateSite.mockResolvedValue(mockSite);
    const onSuccess = vi.fn();

    renderSiteForm(null, onSuccess);

    // Fill form
    fireEvent.change(screen.getByLabelText('Nom *'), { target: { value: 'New Site' } });
    fireEvent.change(screen.getByLabelText('Adresse'), { target: { value: 'New Address' } });
    fireEvent.change(screen.getByLabelText('Ville'), { target: { value: 'New City' } });

    // Submit form
    fireEvent.click(screen.getByLabelText('Créer'));

    await waitFor(() => {
      expect(mockCreateSite).toHaveBeenCalledWith({
        name: 'New Site',
        address: 'New Address',
        city: 'New City',
        postal_code: '',
        country: '',
        is_active: true,
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should call updateSite when form is submitted for editing', async () => {
    mockUpdateSite.mockResolvedValue(mockSite);
    const onSuccess = vi.fn();

    renderSiteForm(mockSite, onSuccess);

    // Modify form
    fireEvent.change(screen.getByLabelText('Nom *'), { target: { value: 'Updated Site' } });
    fireEvent.click(screen.getByLabelText('Site actif')); // Uncheck

    // Submit form
    fireEvent.click(screen.getByLabelText('Modifier'));

    await waitFor(() => {
      expect(mockUpdateSite).toHaveBeenCalledWith(mockSite.id, {
        name: 'Updated Site',
        address: '123 Test Street',
        city: 'Test City',
        postal_code: '12345',
        country: 'France',
        is_active: false,
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should show loading state during submission', async () => {
    mockCreateSite.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockSite), 100)));
    const onSuccess = vi.fn();

    renderSiteForm(null, onSuccess);

    fireEvent.change(screen.getByLabelText('Nom *'), { target: { value: 'New Site' } });
    fireEvent.click(screen.getByLabelText('Créer'));

    expect(screen.getByLabelText('Sauvegarde en cours, veuillez patienter')).toBeInTheDocument();
    expect(screen.getByLabelText('Sauvegarde en cours, veuillez patienter')).toBeDisabled();

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should display error message on API failure', async () => {
    const errorMessage = 'Erreur lors de la création du site';
    mockCreateSite.mockRejectedValue(new Error(errorMessage));
    const onSuccess = vi.fn();

    renderSiteForm(null, onSuccess);

    fireEvent.change(screen.getByLabelText('Nom *'), { target: { value: 'New Site' } });
    fireEvent.click(screen.getByLabelText('Créer'));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should display server validation errors', async () => {
    const serverError = {
      response: {
        data: {
          detail: [
            {
              loc: ['body', 'name'],
              msg: 'Name is required',
              type: 'value_error.missing'
            }
          ]
        }
      }
    };

    mockCreateSite.mockRejectedValue(serverError);
    const onSuccess = vi.fn();

    renderSiteForm(null, onSuccess);

    // Submit empty form
    fireEvent.click(screen.getByLabelText('Créer'));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();

    renderSiteForm(null, vi.fn(), onCancel);

    fireEvent.click(screen.getByLabelText('Annuler et fermer le formulaire'));

    expect(onCancel).toHaveBeenCalled();
  });

  it('should have proper accessibility structure', () => {
    renderSiteForm();

    // Check form structure
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('form')).toBeInTheDocument();

    // Check required field indication
    expect(screen.getByLabelText('Nom *')).toHaveAttribute('aria-required', 'true');

    // Check button labels
    expect(screen.getByLabelText('Créer')).toBeInTheDocument();
    expect(screen.getByLabelText('Annuler et fermer le formulaire')).toBeInTheDocument();
  });

  it('should handle form validation', async () => {
    const onSuccess = vi.fn();

    renderSiteForm(null, onSuccess);

    // Submit without required field
    fireEvent.click(screen.getByLabelText('Créer'));

    // Form should not submit
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(mockCreateSite).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should handle checkbox changes', () => {
    renderSiteForm(mockSite);

    const checkbox = screen.getByLabelText('Site actif');
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('should handle all input types correctly', () => {
    renderSiteForm();

    // Text inputs
    const nameInput = screen.getByLabelText('Nom *');
    fireEvent.change(nameInput, { target: { value: 'Test Name' } });
    expect(nameInput).toHaveValue('Test Name');

    // Checkbox
    const activeCheckbox = screen.getByLabelText('Site actif');
    fireEvent.click(activeCheckbox);
    expect(activeCheckbox).not.toBeChecked();
  });

  it('should disable form during loading', async () => {
    mockCreateSite.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockSite), 100)));

    renderSiteForm();

    fireEvent.change(screen.getByLabelText('Nom *'), { target: { value: 'Test Site' } });
    fireEvent.click(screen.getByLabelText('Créer'));

    // Form should be disabled during loading
    expect(screen.getByLabelText('Sauvegarde en cours, veuillez patienter')).toBeDisabled();
    expect(screen.getByLabelText('Annuler et fermer le formulaire')).toBeDisabled();
  });
});
