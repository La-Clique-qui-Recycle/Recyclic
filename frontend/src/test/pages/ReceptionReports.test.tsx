import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../test/test-utils';
import { vi } from 'vitest';
import ReceptionReports from '../../pages/Admin/ReceptionReports';
import * as api from '../../services/api';

// Mock des services API
vi.mock('../../services/api', () => ({
  getReceptionLignes: vi.fn(),
  exportReceptionLignesCSV: vi.fn(),
  getReceptionCategories: vi.fn(),
}));

// Données de test
const mockCategories = [
  { id: '1', label: 'Informatique', slug: 'informatique' },
  { id: '2', label: 'Électroménager', slug: 'electromenager' },
];

const mockLignesData = {
  lignes: [
    {
      id: '1',
      ticket_id: 'ticket-1',
      poste_id: 'poste-1',
      benevole_username: 'benevole1',
      dom_category_label: 'Informatique',
      poids_kg: 10.5,
      destination: 'MAGASIN',
      notes: 'Test note 1',
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      ticket_id: 'ticket-2',
      poste_id: 'poste-1',
      benevole_username: 'benevole2',
      dom_category_label: 'Électroménager',
      poids_kg: 25.3,
      destination: 'RECYCLAGE',
      notes: '',
      created_at: '2024-01-16T14:30:00Z',
    },
  ],
  total: 2,
  page: 1,
  per_page: 50,
  total_pages: 1,
};

const renderWithRouter = (component: React.ReactElement) => render(component);

describe('ReceptionReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock des appels API par défaut
    vi.mocked(api.getReceptionCategories).mockResolvedValue(mockCategories);
    vi.mocked(api.getReceptionLignes).mockResolvedValue(mockLignesData);
    vi.mocked(api.exportReceptionLignesCSV).mockResolvedValue(new Blob(['test,csv,content'], { type: 'text/csv' }));
  });

  it('should render the page title and export button', async () => {
    renderWithRouter(<ReceptionReports />);
    
    await waitFor(() => {
      expect(screen.getByText('Rapports de Réception')).toBeInTheDocument();
      expect(screen.getByText('📊 Exporter CSV')).toBeInTheDocument();
    });
  });

  it('should load and display categories in the filter dropdown', async () => {
    renderWithRouter(<ReceptionReports />);
    
    await waitFor(() => {
      expect(api.getReceptionCategories).toHaveBeenCalled();
    });
    
    const categorySelect = screen.getByLabelText('Catégorie');
    expect(categorySelect).toBeInTheDocument();
    
    // Vérifier que les options sont présentes
    expect(screen.getByText('Toutes les catégories')).toBeInTheDocument();
    expect(screen.getAllByText('Informatique')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Électroménager')[0]).toBeInTheDocument();
  });

  it('should load and display reception lines data', async () => {
    renderWithRouter(<ReceptionReports />);
    
    await waitFor(() => {
      expect(api.getReceptionLignes).toHaveBeenCalledWith(1, 50, undefined, undefined, undefined);
    });
    
    // Vérifier les en-têtes du tableau
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Bénévole')).toBeInTheDocument();
    expect(screen.getAllByText('Catégorie').length).toBeGreaterThan(0);
    expect(screen.getByText('Poids (kg)')).toBeInTheDocument();
    expect(screen.getByText('Destination')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    
    // Vérifier les données
    expect(screen.getByText('benevole1')).toBeInTheDocument();
    expect(screen.getByText('benevole2')).toBeInTheDocument();
    expect(screen.getAllByText('Informatique')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Électroménager')[0]).toBeInTheDocument();
    expect(screen.getByText('10,5')).toBeInTheDocument();
    expect(screen.getByText('25,3')).toBeInTheDocument();
    expect(screen.getByText('MAGASIN')).toBeInTheDocument();
    expect(screen.getByText('RECYCLAGE')).toBeInTheDocument();
  });

  it('should handle date filter changes', async () => {
    renderWithRouter(<ReceptionReports />);
    
    await waitFor(() => {
      expect(api.getReceptionLignes).toHaveBeenCalled();
    });
    
    const startDateInput = screen.getByLabelText('Date de début');
    const endDateInput = screen.getByLabelText('Date de fin');
    
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });
    
    await waitFor(() => {
      expect(api.getReceptionLignes).toHaveBeenCalledWith(1, 50, '2024-01-01', '2024-01-31', undefined);
    });
  });

  it('should handle category filter changes', async () => {
    renderWithRouter(<ReceptionReports />);
    
    await waitFor(() => {
      expect(api.getReceptionLignes).toHaveBeenCalled();
    });
    
    const categorySelect = screen.getByLabelText('Catégorie');
    fireEvent.change(categorySelect, { target: { value: '1' } });
    
    await waitFor(() => {
      expect(api.getReceptionLignes).toHaveBeenCalledWith(1, 50, undefined, undefined, '1');
    });
  });

  it('should handle per page changes', async () => {
    renderWithRouter(<ReceptionReports />);
    
    await waitFor(() => {
      expect(api.getReceptionLignes).toHaveBeenCalled();
    });
    
    const perPageSelect = screen.getByLabelText('Éléments par page');
    fireEvent.change(perPageSelect, { target: { value: '25' } });
    
    await waitFor(() => {
      expect(api.getReceptionLignes).toHaveBeenCalledWith(1, 25, undefined, undefined, undefined);
    });
  });

  it.skip('should handle CSV export', async () => {
    // Mock de l'API blob et des méthodes de téléchargement
    const mockBlob = new Blob(['test,csv,content'], { type: 'text/csv' });
    vi.mocked(api.exportReceptionLignesCSV).mockResolvedValue(mockBlob);
    
    // Mock des méthodes DOM pour le téléchargement
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
    // jsdom stub déjà dans setup.ts ; garantir les spies
    // @ts-ignore
    window.URL.revokeObjectURL = window.URL.revokeObjectURL || vi.fn();
    // @ts-ignore
    window.URL.createObjectURL = window.URL.createObjectURL || vi.fn(() => 'blob:test-url');
    const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL');
    const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL');
    
    renderWithRouter(<ReceptionReports />);
    
    await waitFor(() => {
      expect(api.getReceptionLignes).toHaveBeenCalled();
    });
    
    const exportButton = screen.getByText('📊 Exporter CSV');
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(api.exportReceptionLignesCSV).toHaveBeenCalledWith(undefined, undefined, undefined);
    });
    
    // Vérifier que le téléchargement a été déclenché
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockLink.click).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();
    
    // Nettoyer les mocks
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    createObjectURLSpy.mockRestore();
  });

  it.skip('should display loading state initially', () => {
    // Mock pour que l'API ne se résolve pas immédiatement
    vi.mocked(api.getReceptionLignes).mockImplementation(() => new Promise(() => {}));
    
    renderWithRouter(<ReceptionReports />);
    
    expect(screen.getByText('Chargement des données...')).toBeInTheDocument();
  });

  it.skip('should display error state when API fails', async () => {
    const errorMessage = 'Erreur lors du chargement des données';
    vi.mocked(api.getReceptionLignes).mockRejectedValue(new Error(errorMessage));
    
    renderWithRouter(<ReceptionReports />);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it.skip('should display empty state when no data', async () => {
    vi.mocked(api.getReceptionLignes).mockResolvedValue({
      ...mockLignesData,
      lignes: [],
      total: 0,
    });
    
    renderWithRouter(<ReceptionReports />);
    
    await waitFor(() => {
      expect(screen.getByText('Aucune donnée trouvée pour les filtres sélectionnés')).toBeInTheDocument();
    });
  });

  it('should format dates correctly', async () => {
    renderWithRouter(<ReceptionReports />);
    
    await waitFor(() => {
      expect(api.getReceptionLignes).toHaveBeenCalled();
    });
    
    // Vérifier que les dates sont formatées (format français)
    expect(screen.getByText(/15\/01\/2024/)).toBeInTheDocument();
    expect(screen.getByText(/16\/01\/2024/)).toBeInTheDocument();
  });

  it('should format weights correctly', async () => {
    renderWithRouter(<ReceptionReports />);
    
    await waitFor(() => {
      expect(api.getReceptionLignes).toHaveBeenCalled();
    });
    
    // Vérifier le formatage des poids (virgule pour les décimales en français)
    expect(screen.getByText('10,5')).toBeInTheDocument();
    expect(screen.getByText('25,3')).toBeInTheDocument();
  });

  it('should handle pagination when there are multiple pages', async () => {
    const paginatedData = {
      ...mockLignesData,
      total: 100,
      total_pages: 4,
    };
    vi.mocked(api.getReceptionLignes).mockResolvedValue(paginatedData);
    
    renderWithRouter(<ReceptionReports />);
    
    await waitFor(() => {
      expect(api.getReceptionLignes).toHaveBeenCalled();
    });
    
    // Vérifier que la pagination est affichée
    expect(screen.getByText(/Affichage de 1 à 50 sur 100 éléments/)).toBeInTheDocument();
    expect(screen.getByText('Précédent')).toBeInTheDocument();
    expect(screen.getByText('Suivant')).toBeInTheDocument();
  });
});
