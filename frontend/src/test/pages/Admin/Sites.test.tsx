import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sites from '../../../pages/Admin/Sites';
import { getSites, deleteSite } from '../../../services/api';

// Mock the API services
vi.mock('../../../services/api', () => ({
  getSites: vi.fn(),
  deleteSite: vi.fn(),
}));

const mockGetSites = vi.mocked(getSites);
const mockDeleteSite = vi.mocked(deleteSite);

const mockSites = [
  {
    id: '1',
    name: 'Site Test 1',
    address: '123 Rue Test',
    city: 'Test City',
    postal_code: '12345',
    country: 'France',
    is_active: true,
  },
  {
    id: '2',
    name: 'Site Test 2',
    address: '456 Avenue Test',
    city: 'Test City',
    postal_code: '67890',
    country: 'France',
    is_active: false,
  },
];

const renderSites = () => {
  return render(
    <MemoryRouter>
      <Sites />
    </MemoryRouter>
  );
};

describe('Sites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSites.mockResolvedValue(mockSites);
  });

  it('should render the sites page with title', async () => {
    renderSites();

    expect(screen.getByRole('heading', { name: 'Sites' })).toBeInTheDocument();
    expect(screen.getByLabelText('Créer un nouveau site')).toBeInTheDocument();
  });

  it('should render the sites table with correct headers', async () => {
    renderSites();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    expect(screen.getByRole('columnheader', { name: 'Nom' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Adresse' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Ville' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Code postal' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Pays' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Actif' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
  });

  it('should display sites data in the table', async () => {
    renderSites();

    await waitFor(() => {
      expect(screen.getByText('Site Test 1')).toBeInTheDocument();
      expect(screen.getByText('123 Rue Test')).toBeInTheDocument();
      expect(screen.getByText('Test City')).toBeInTheDocument();
      expect(screen.getByText('12345')).toBeInTheDocument();
      expect(screen.getByText('France')).toBeInTheDocument();
      expect(screen.getByText('Oui')).toBeInTheDocument();
    });
  });

  it('should display "Non" for inactive sites', async () => {
    renderSites();

    await waitFor(() => {
      expect(screen.getByLabelText('Site inactif')).toBeInTheDocument();
    });
  });

  it('should display "-" for empty optional fields', async () => {
    mockGetSites.mockResolvedValue([
      {
        id: '3',
        name: 'Site Minimal',
        address: undefined,
        city: undefined,
        postal_code: undefined,
        country: undefined,
        is_active: true,
      },
    ]);

    renderSites();

    await waitFor(() => {
      expect(screen.getAllByText('-')).toHaveLength(4); // address, city, postal_code, country
    });
  });

  it('should open create form when create button is clicked', async () => {
    renderSites();

    const createButton = screen.getByLabelText('Créer un nouveau site');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });

  it('should open edit form when edit button is clicked', async () => {
    renderSites();

    await waitFor(() => {
      expect(screen.getByLabelText(`Modifier le site ${mockSites[0].name}`)).toBeInTheDocument();
    });

    const editButton = screen.getByLabelText(`Modifier le site ${mockSites[0].name}`);
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });

  it('should open delete confirmation when delete button is clicked', async () => {
    renderSites();

    await waitFor(() => {
      expect(screen.getByLabelText(`Supprimer le site ${mockSites[0].name}`)).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText(`Supprimer le site ${mockSites[0].name}`);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(`Confirmer la suppression de "${mockSites[0].name}"`)).toBeInTheDocument();
    });
  });

  it('should call deleteSite when delete is confirmed', async () => {
    mockDeleteSite.mockResolvedValue();

    renderSites();

    await waitFor(() => {
      expect(screen.getByLabelText(`Supprimer le site ${mockSites[0].name}`)).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText(`Supprimer le site ${mockSites[0].name}`);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Confirmer')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Confirmer');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteSite).toHaveBeenCalledWith(mockSites[0].id);
    });
  });

  it('should display loading state', async () => {
    mockGetSites.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockSites), 100)));

    renderSites();

    expect(screen.getByLabelText('Chargement des sites en cours')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Site Test 1')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText('Chargement des sites en cours')).not.toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Erreur de chargement des sites';
    mockGetSites.mockRejectedValue(new Error(errorMessage));

    renderSites();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    });
  });

  it('should have proper accessibility structure', async () => {
    renderSites();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Check table structure
    expect(screen.getByRole('row', { name: /site test 1/i })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Site Test 1' })).toBeInTheDocument();

    // Check buttons have proper labels
    expect(screen.getByLabelText('Créer un nouveau site')).toBeInTheDocument();
    expect(screen.getByLabelText(/modifier le site/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/supprimer le site/i)).toBeInTheDocument();
  });

  it('should handle empty sites list', async () => {
    mockGetSites.mockResolvedValue([]);

    renderSites();

    await waitFor(() => {
      expect(screen.getByText('Aucun site trouvé')).toBeInTheDocument();
      expect(screen.getByLabelText('Créer le premier site')).toBeInTheDocument();
    });
  });
});
