/**
 * Tests unitaires pour le composant ProtectedRoute
 * Story 1.4 - Authentification et Routes Protégées
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuthStore } from '../../../stores/authStore';

// Mock du store d'authentification
vi.mock('../../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Composant de test pour simuler une page protégée
const TestPage = () => <div data-testid="protected-content">Protected Content</div>;

describe('ProtectedRoute', () => {
  let mockStore: any;

  beforeEach(() => {
    // Mock du store d'authentification
    mockStore = {
      isAuthenticated: false,
      currentUser: null,
      loading: false,
    };
    
    // Mock useAuthStore pour retourner les valeurs selon le sélecteur
    vi.mocked(useAuthStore).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector(mockStore);
      }
      return mockStore;
    });
  });

  describe('Redirection vers login', () => {
    it('devrait rediriger vers /login quand l\'utilisateur n\'est pas connecté', () => {
      mockStore.isAuthenticated = false;
      mockStore.loading = false;

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <ProtectedRoute>
            <TestPage />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Vérifier que le contenu protégé n'est pas affiché
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('devrait rediriger vers /login pendant le chargement', () => {
      mockStore.isAuthenticated = false;
      mockStore.loading = true;

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <ProtectedRoute>
            <TestPage />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Pendant le chargement, le contenu protégé ne devrait pas être affiché
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Accès autorisé', () => {
    it('devrait afficher le contenu protégé quand l\'utilisateur est connecté', () => {
      mockStore.isAuthenticated = true;
      mockStore.currentUser = { id: '1', role: 'user' };
      mockStore.loading = false;

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <ProtectedRoute>
            <TestPage />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('devrait afficher le contenu protégé pour un utilisateur admin', () => {
      mockStore.isAuthenticated = true;
      mockStore.currentUser = { id: '1', role: 'admin' };
      mockStore.loading = false;

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <ProtectedRoute>
            <TestPage />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Protection par rôle', () => {
    it('devrait afficher le contenu admin pour un utilisateur admin', () => {
      mockStore.isAuthenticated = true;
      mockStore.currentUser = { id: '1', role: 'admin' };
      mockStore.loading = false;

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <ProtectedRoute adminOnly={true}>
            <TestPage />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('devrait afficher le contenu admin pour un super-admin', () => {
      mockStore.isAuthenticated = true;
      mockStore.currentUser = { id: '1', role: 'super-admin' };
      mockStore.loading = false;

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <ProtectedRoute adminOnly={true}>
            <TestPage />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('devrait bloquer l\'accès pour un utilisateur normal sur une route admin', () => {
      mockStore.isAuthenticated = true;
      mockStore.currentUser = { id: '1', role: 'user' };
      mockStore.loading = false;

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <ProtectedRoute adminOnly={true}>
            <TestPage />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Le contenu protégé ne devrait pas être affiché
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('devrait bloquer l\'accès pour un utilisateur sans permissions admin', () => {
      mockStore.isAuthenticated = true;
      mockStore.currentUser = { id: '1', role: 'user' };
      mockStore.loading = false;

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <ProtectedRoute adminOnly={true}>
            <TestPage />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Le contenu protégé ne devrait pas être affiché
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Props personnalisées', () => {
    it('devrait accepter des props personnalisées', () => {
      mockStore.isAuthenticated = true;
      mockStore.currentUser = { id: '1', role: 'user' };
      mockStore.loading = false;

      const CustomComponent = ({ customProp }: { customProp: string }) => (
        <div data-testid="custom-content">{customProp}</div>
      );

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <ProtectedRoute>
            <CustomComponent customProp="test value" />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByText('test value')).toBeInTheDocument();
    });
  });

  describe('Protection par rôles multiples (requiredRoles)', () => {
    it('devrait autoriser l\'accès pour un utilisateur avec un rôle autorisé', () => {
      mockStore.isAuthenticated = true;
      mockStore.currentUser = { id: '1', role: 'user' };
      mockStore.loading = false;

      render(
        <MemoryRouter initialEntries={['/caisse']}>
          <ProtectedRoute requiredRoles={['user', 'admin', 'super-admin']}>
            <TestPage />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('devrait autoriser l\'accès pour un admin avec un rôle autorisé', () => {
      mockStore.isAuthenticated = true;
      mockStore.currentUser = { id: '1', role: 'admin' };
      mockStore.loading = false;

      render(
        <MemoryRouter initialEntries={['/caisse']}>
          <ProtectedRoute requiredRoles={['user', 'admin', 'super-admin']}>
            <TestPage />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('devrait autoriser l\'accès pour un super-admin avec un rôle autorisé', () => {
      mockStore.isAuthenticated = true;
      mockStore.currentUser = { id: '1', role: 'super-admin' };
      mockStore.loading = false;

      render(
        <MemoryRouter initialEntries={['/caisse']}>
          <ProtectedRoute requiredRoles={['user', 'admin', 'super-admin']}>
            <TestPage />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('devrait bloquer l\'accès pour un utilisateur avec un rôle non autorisé', () => {
      mockStore.isAuthenticated = true;
      mockStore.currentUser = { id: '1', role: 'manager' };
      mockStore.loading = false;

      render(
        <MemoryRouter initialEntries={['/caisse']}>
          <ProtectedRoute requiredRoles={['user', 'admin', 'super-admin']}>
            <TestPage />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Le contenu protégé ne devrait pas être affiché
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    // Test supprimé: le rôle supprimé n'existe plus
  });

  describe('Intégration avec React Router', () => {
    it('devrait fonctionner avec MemoryRouter', () => {
      mockStore.isAuthenticated = true;
      mockStore.currentUser = { id: '1', role: 'user' };
      mockStore.loading = false;

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <ProtectedRoute>
            <TestPage />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});