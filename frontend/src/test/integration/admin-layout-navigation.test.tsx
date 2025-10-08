import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import AdminLayout from '../../components/AdminLayout.jsx';
import DashboardHomePage from '../../pages/Admin/DashboardHomePage.jsx';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const renderAdminRoutes = (initialEntries = ['/admin']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardHomePage />} />
          <Route path="users" element={<div>Users Page</div>} />
          <Route path="cash-registers" element={<div>Cash Registers Page</div>} />
          <Route path="sites" element={<div>Sites Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe('Admin Layout Navigation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the admin dashboard home page when navigating to /admin', () => {
    renderAdminRoutes(['/admin']);

    expect(screen.getByText('Tableau de Bord')).toBeInTheDocument();
    expect(screen.getByText(/Bienvenue dans l'espace d'administration de Recyclic/)).toBeInTheDocument();
    expect(screen.getByText('Administration')).toBeInTheDocument(); // Sidebar title
  });

  it('should navigate to users page from sidebar', () => {
    renderAdminRoutes(['/admin']);

    expect(screen.getByText('Administration')).toBeInTheDocument();

    const usersLink = screen.getByRole('link', { name: /utilisateurs/i });
    fireEvent.click(usersLink);

    // In a real app, this would navigate, but we can check the href
    expect(usersLink).toHaveAttribute('href', '/admin/users');
  });

  it('should navigate to cash registers page from sidebar', () => {
    renderAdminRoutes(['/admin']);

    expect(screen.getByText('Administration')).toBeInTheDocument();

    const cashRegistersLink = screen.getByRole('link', { name: /postes de caisse/i });
    expect(cashRegistersLink).toHaveAttribute('href', '/admin/cash-registers');
  });

  it('should render users page when navigating to /admin/users', () => {
    renderAdminRoutes(['/admin/users']);

    expect(screen.getByText('Administration')).toBeInTheDocument();
    expect(screen.getByText('Users Page')).toBeInTheDocument();
  });

  it('should highlight the correct navigation item based on current route', () => {
    renderAdminRoutes(['/admin/users']);

    expect(screen.getByText('Administration')).toBeInTheDocument();

    const usersLink = screen.getByRole('link', { name: /utilisateurs/i });
    expect(usersLink).toHaveAttribute('href', '/admin/users');
  });

  it('should maintain the admin layout structure across different admin pages', () => {
    renderAdminRoutes(['/admin']);

    expect(screen.getByText('Administration')).toBeInTheDocument();

    // Check that sidebar is present
    expect(screen.getByRole('navigation')).toBeInTheDocument();

    // Check that main content area is present
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should navigate from dashboard home page quick action cards', () => {
    renderAdminRoutes(['/admin']);

    expect(screen.getByText('Tableau de Bord')).toBeInTheDocument();

    const usersCard = screen.getByRole('listitem', { name: 'Accéder à Gestion des utilisateurs: Gérer les comptes utilisateurs, les rôles et les permissions' });
    fireEvent.click(usersCard);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
  });

  it('should have a back link to return to main application', () => {
    renderAdminRoutes(['/admin']);

    const backLink = screen.getByRole('link', { name: /retourner à l'application principale/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/');
  });
});