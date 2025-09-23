import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import DashboardHomePage from '../../../pages/Admin/DashboardHomePage.jsx';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const renderWithRouter = () => {
  return render(
    <MemoryRouter>
      <DashboardHomePage />
    </MemoryRouter>
  );
};

describe('DashboardHomePage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should render the dashboard home page with title and subtitle', () => {
    renderWithRouter();

    expect(screen.getByText('Tableau de Bord')).toBeInTheDocument();
    expect(screen.getByText(/Bienvenue dans l'espace d'administration de Recyclic/)).toBeInTheDocument();
  });

  it('should render all quick action cards', () => {
    renderWithRouter();

    const expectedCards = [
      'Gestion des utilisateurs',
      'Postes de caisse',
      'Sites et emplacements',
      'Rapports détaillés'
    ];

    expectedCards.forEach(cardTitle => {
      expect(screen.getByText(cardTitle)).toBeInTheDocument();
    });
  });

  it('should render card descriptions', () => {
    renderWithRouter();

    expect(screen.getByText('Gérer les comptes utilisateurs, les rôles et les permissions')).toBeInTheDocument();
    expect(screen.getByText('Configurer et superviser les postes de caisse')).toBeInTheDocument();
    expect(screen.getByText('Gérer les sites et leurs configurations')).toBeInTheDocument();
    expect(screen.getByText('Accéder aux rapports complets et statistiques')).toBeInTheDocument();
  });

  it('should navigate to users page when users card is clicked', () => {
    renderWithRouter();

    const usersCard = screen.getByRole('button', { name: 'Accéder à Gestion des utilisateurs: Gérer les comptes utilisateurs, les rôles et les permissions' });
    fireEvent.click(usersCard);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
  });

  it('should navigate to cash registers page when cash registers card is clicked', () => {
    renderWithRouter();

    const cashRegistersCard = screen.getByRole('button', { name: 'Accéder à Postes de caisse: Configurer et superviser les postes de caisse' });
    fireEvent.click(cashRegistersCard);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/cash-registers');
  });

  it('should navigate to sites page when sites card is clicked', () => {
    renderWithRouter();

    const sitesCard = screen.getByRole('button', { name: 'Accéder à Sites et emplacements: Gérer les sites et leurs configurations' });
    fireEvent.click(sitesCard);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/sites');
  });

  it('should navigate to reports page when reports card is clicked', () => {
    renderWithRouter();

    const reportsCard = screen.getByRole('button', { name: 'Accéder à Rapports détaillés: Accéder aux rapports complets et statistiques' });
    fireEvent.click(reportsCard);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/reports');
  });

  it('should render the stats section with placeholder values', () => {
    renderWithRouter();

    expect(screen.getByText('Aperçu rapide')).toBeInTheDocument();
    expect(screen.getByText('Utilisateurs actifs')).toBeInTheDocument();
    expect(screen.getByText('Sessions ouvertes')).toBeInTheDocument();
    expect(screen.getByText('Postes configurés')).toBeInTheDocument();
    expect(screen.getByText('Sites gérés')).toBeInTheDocument();

    // Check that placeholder values are displayed
    const placeholders = screen.getAllByText('--');
    expect(placeholders).toHaveLength(4);
  });

  it('should have proper accessibility with buttons and headings', () => {
    renderWithRouter();

    // Check for main heading
    expect(screen.getByRole('heading', { level: 1, name: 'Tableau de Bord' })).toBeInTheDocument();

    // Check for section heading
    expect(screen.getByRole('heading', { level: 2, name: 'Aperçu rapide' })).toBeInTheDocument();

    // Check for card buttons
    const cardButtons = screen.getAllByRole('button');
    expect(cardButtons).toHaveLength(4);

    // Each button should be clickable and accessible
    cardButtons.forEach(button => {
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
    });
  });
});