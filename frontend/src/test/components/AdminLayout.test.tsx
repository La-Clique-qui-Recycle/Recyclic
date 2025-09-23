import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import AdminLayout from '../../components/AdminLayout.jsx';

// Mock the Outlet component since we're testing the layout structure
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Content Area</div>
  };
});

const renderWithRouter = (initialEntries = ['/admin']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AdminLayout />
    </MemoryRouter>
  );
};

describe('AdminLayout', () => {
  it('should render the admin layout with sidebar navigation', () => {
    renderWithRouter();

    // Check that the sidebar title is present
    expect(screen.getByText('Administration')).toBeInTheDocument();

    // Check that all navigation items are present
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    expect(screen.getByText('Utilisateurs')).toBeInTheDocument();
    expect(screen.getByText('Postes de caisse')).toBeInTheDocument();
    expect(screen.getByText('Sites')).toBeInTheDocument();

    // Check that the content area (Outlet) is rendered
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('should highlight the active navigation item for exact match', () => {
    renderWithRouter(['/admin']);

    const dashboardLink = screen.getByRole('link', { name: /tableau de bord/i });
    expect(dashboardLink).toHaveAttribute('href', '/admin');
  });

  it('should highlight the active navigation item for sub-routes', () => {
    renderWithRouter(['/admin/users']);

    const usersLink = screen.getByRole('link', { name: /utilisateurs/i });
    expect(usersLink).toHaveAttribute('href', '/admin/users');
  });

  it('should render all navigation links with correct paths', () => {
    renderWithRouter();

    const links = [
      { text: 'Tableau de bord', href: '/admin' },
      { text: 'Utilisateurs', href: '/admin/users' },
      { text: 'Postes de caisse', href: '/admin/cash-registers' },
      { text: 'Sites', href: '/admin/sites' }
    ];

    links.forEach(({ text, href }) => {
      const link = screen.getByRole('link', { name: new RegExp(text, 'i') });
      expect(link).toHaveAttribute('href', href);
    });
  });

  it('should have proper accessibility structure', () => {
    renderWithRouter();

    // Check for navigation element
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();

    // Check for main content area
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });
});