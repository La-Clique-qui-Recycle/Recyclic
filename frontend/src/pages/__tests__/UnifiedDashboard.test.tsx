import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UnifiedDashboard from '../UnifiedDashboard';
import { useAuthStore } from '../../stores/authStore';
import * as api from '../../services/api';

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn()
}));

// Mock the API
vi.mock('../../services/api', () => ({
  getCashSessionStats: vi.fn(),
  getReceptionSummary: vi.fn(),
  getReceptionByCategory: vi.fn()
}));

describe('UnifiedDashboard', () => {
  const mockGetCashSessionStats = vi.mocked(api.getCashSessionStats);
  const mockGetReceptionSummary = vi.mocked(api.getReceptionSummary);
  const mockGetReceptionByCategory = vi.mocked(api.getReceptionByCategory);
  const mockUseAuthStore = vi.mocked(useAuthStore);

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Default auth store mock (user role)
    mockUseAuthStore.mockReturnValue({
      currentUser: {
        id: '1',
        username: 'testuser',
        first_name: 'Test',
        role: 'user',
        status: 'approved',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      isAdmin: () => false
    } as any);

    // Default API responses
    mockGetCashSessionStats.mockResolvedValue({
      total_sales: 1500.50,
      total_donations: 250.75,
      total_weight_sold: 120.5
    });

    mockGetReceptionSummary.mockResolvedValue({
      total_weight: 350.8,
      total_items: 45
    });

    mockGetReceptionByCategory.mockResolvedValue([
      { category_name: 'Électronique', total_weight: 150.5, total_items: 20 },
      { category_name: 'Mobilier', total_weight: 200.3, total_items: 25 }
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render welcome message with user name', async () => {
    render(
      <BrowserRouter>
        <UnifiedDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Bienvenue sur Recyclic, Test/i)).toBeInTheDocument();
    });
  });

  it('should display volunteer quick action button for user role', async () => {
    render(
      <BrowserRouter>
        <UnifiedDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const volunteerButton = screen.getByTestId('quick-action-volunteer-dashboard');
      expect(volunteerButton).toBeInTheDocument();
      expect(volunteerButton).toHaveTextContent('Dashboard bénévole');
    });
  });

  it('should NOT display volunteer quick action button for admin role', async () => {
    mockUseAuthStore.mockReturnValue({
      currentUser: {
        id: '1',
        username: 'admin',
        role: 'admin',
        status: 'approved',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    } as any);

    render(
      <BrowserRouter>
        <UnifiedDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('quick-action-volunteer-dashboard')).not.toBeInTheDocument();
    });
  });

  it('should display sales statistics correctly', async () => {
    render(
      <BrowserRouter>
        <UnifiedDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('stat-sales-revenue')).toHaveTextContent('1500.50€');
      expect(screen.getByTestId('stat-sales-donations')).toHaveTextContent('250.75€');
      expect(screen.getByTestId('stat-sales-weight')).toHaveTextContent('120.5 kg');
    });
  });

  it('should display reception statistics correctly', async () => {
    render(
      <BrowserRouter>
        <UnifiedDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('stat-reception-weight')).toHaveTextContent('350.8 kg');
      expect(screen.getByTestId('stat-reception-items')).toHaveTextContent('45');
    });
  });

  it('should display loading state initially', () => {
    render(
      <BrowserRouter>
        <UnifiedDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/Chargement des statistiques/i)).toBeInTheDocument();
  });

  it('should display error message when API fails', async () => {
    mockGetCashSessionStats.mockRejectedValue(new Error('API Error'));
    mockGetReceptionSummary.mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <UnifiedDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Impossible de charger les statistiques/i)).toBeInTheDocument();
    });
  });

  it('should call both API endpoints on mount', async () => {
    render(
      <BrowserRouter>
        <UnifiedDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockGetCashSessionStats).toHaveBeenCalledTimes(1);
      expect(mockGetReceptionSummary).toHaveBeenCalledTimes(1);
    });
  });

  it('should display section titles correctly', async () => {
    render(
      <BrowserRouter>
        <UnifiedDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Ventes (Sorties)')).toBeInTheDocument();
      expect(screen.getByText('Réception (Entrées)')).toBeInTheDocument();
    });
  });

  it('should have all required stat icons', async () => {
    render(
      <BrowserRouter>
        <UnifiedDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('sales-revenue-icon')).toBeInTheDocument();
      expect(screen.getByTestId('sales-donations-icon')).toBeInTheDocument();
      expect(screen.getByTestId('sales-weight-icon')).toBeInTheDocument();
      expect(screen.getByTestId('reception-weight-icon')).toBeInTheDocument();
      expect(screen.getByTestId('reception-items-icon')).toBeInTheDocument();
    });
  });

  // NEW TESTS FOR FILTERS AND CHARTS

  it('should display filter buttons', async () => {
    render(
      <BrowserRouter>
        <UnifiedDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('filter-today')).toBeInTheDocument();
      expect(screen.getByTestId('filter-week')).toBeInTheDocument();
      expect(screen.getByTestId('filter-month')).toBeInTheDocument();
      expect(screen.getByTestId('filter-year')).toBeInTheDocument();
      expect(screen.getByTestId('filter-apply-custom')).toBeInTheDocument();
    });
  });

  it('should have default filter set to month', async () => {
    render(
      <BrowserRouter>
        <UnifiedDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const monthButton = screen.getByTestId('filter-month');
      expect(monthButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('should call API with date parameters when filter changes', async () => {
    render(
      <BrowserRouter>
        <UnifiedDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockGetCashSessionStats).toHaveBeenCalled();
    });

    const todayButton = screen.getByTestId('filter-today');
    fireEvent.click(todayButton);

    await waitFor(() => {
      expect(mockGetCashSessionStats).toHaveBeenCalledTimes(2);
    });
  });

  it('should NOT display charts for non-admin users', async () => {
    render(
      <BrowserRouter>
        <UnifiedDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Analyse Détaillée/i)).not.toBeInTheDocument();
    });
  });

  it('should display charts for admin users', async () => {
    mockUseAuthStore.mockReturnValue({
      currentUser: {
        id: '1',
        username: 'admin',
        role: 'admin',
        status: 'approved',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      isAdmin: () => true
    } as any);

    render(
      <BrowserRouter>
        <UnifiedDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Analyse Détaillée de la Réception - Poids par Catégorie/i)).toBeInTheDocument();
      expect(screen.getByText(/Analyse Détaillée de la Réception - Articles par Catégorie/i)).toBeInTheDocument();
    });
  });

  it('should call getReceptionByCategory for admin users', async () => {
    mockUseAuthStore.mockReturnValue({
      currentUser: {
        id: '1',
        username: 'admin',
        role: 'admin',
        status: 'approved',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      isAdmin: () => true
    } as any);

    render(
      <BrowserRouter>
        <UnifiedDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockGetReceptionByCategory).toHaveBeenCalledTimes(1);
    });
  });

  it('should NOT call getReceptionByCategory for non-admin users', async () => {
    render(
      <BrowserRouter>
        <UnifiedDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockGetReceptionByCategory).not.toHaveBeenCalled();
    });
  });

  it('should validate custom date range', async () => {
    render(
      <BrowserRouter>
        <UnifiedDashboard />
      </BrowserRouter>
    );

    const startDateInput = screen.getByTestId('filter-start-date');
    const endDateInput = screen.getByTestId('filter-end-date');
    const applyButton = screen.getByTestId('filter-apply-custom');

    // Set invalid date range (end before start)
    fireEvent.change(startDateInput, { target: { value: '2024-12-31' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-01' } });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getByText(/La date de début doit être antérieure/i)).toBeInTheDocument();
    });
  });
});
