import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Dashboard from '../pages/Dashboard';
import * as api from '../services/api';

// Mock des services API
vi.mock('../services/api', () => ({
  getCashSessionStats: vi.fn(),
  getReceptionSummary: vi.fn(),
}));

// Mock de @mantine/dates
vi.mock('@mantine/dates', () => ({
  DatePicker: ({ onChange, value, placeholder }) => (
    <div data-testid="date-picker">
      <input 
        placeholder={placeholder}
        onChange={(e) => {
          // Simuler le changement de date
          if (onChange) {
            onChange([new Date('2024-01-01'), new Date('2024-01-31')]);
          }
        }}
      />
    </div>
  ),
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard with welcome message', () => {
    // Mock des réponses API
    api.getCashSessionStats.mockResolvedValue({
      total_revenue: 1500.50,
      total_donations: 200.00,
      total_weight_sold: 45.5
    });
    
    api.getReceptionSummary.mockResolvedValue({
      total_weight: 120.5,
      total_items: 25
    });

    render(<Dashboard />);
    
    expect(screen.getByText('Bienvenue sur RecyClique')).toBeInTheDocument();
    expect(screen.getByText('Plateforme de gestion pour ressourceries.')).toBeInTheDocument();
  });

  it('should display date filter', () => {
    api.getCashSessionStats.mockResolvedValue({});
    api.getReceptionSummary.mockResolvedValue({});

    render(<Dashboard />);
    
    expect(screen.getByText('Filtre de période')).toBeInTheDocument();
    expect(screen.getByTestId('date-picker')).toBeInTheDocument();
  });

  it('should display sales section with KPIs', async () => {
    const mockSalesData = {
      total_revenue: 1500.50,
      total_donations: 200.00,
      total_weight_sold: 45.5
    };
    
    api.getCashSessionStats.mockResolvedValue(mockSalesData);
    api.getReceptionSummary.mockResolvedValue({});

    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Ventes (Sorties)')).toBeInTheDocument();
      expect(screen.getByText('1500.50€')).toBeInTheDocument();
      expect(screen.getByText('200.00€')).toBeInTheDocument();
      expect(screen.getByText('45.5 kg')).toBeInTheDocument();
    });
  });

  it('should display reception section with KPIs', async () => {
    const mockReceptionData = {
      total_weight: 120.5,
      total_items: 25
    };
    
    api.getCashSessionStats.mockResolvedValue({});
    api.getReceptionSummary.mockResolvedValue(mockReceptionData);

    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Réception (Entrées)')).toBeInTheDocument();
      expect(screen.getByText('120.5 kg')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    api.getCashSessionStats.mockRejectedValue(new Error('API Error'));
    api.getReceptionSummary.mockRejectedValue(new Error('API Error'));

    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Impossible de charger les statistiques. Vérifiez vos permissions.')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    // Mock des promesses qui ne se résolvent jamais
    api.getCashSessionStats.mockImplementation(() => new Promise(() => {}));
    api.getReceptionSummary.mockImplementation(() => new Promise(() => {}));

    render(<Dashboard />);
    
    expect(screen.getByText('Chargement des statistiques...')).toBeInTheDocument();
  });
});
