import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';
import { AuthApi } from '../../generated/api';

// Mock du client API
vi.mock('../../generated/api', () => ({
  AuthApi: {
    apiv1authloginpost: vi.fn(),
  },
}));

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset du store
    useAuthStore.setState({
      currentUser: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  });

  describe('login', () => {
    it('devrait appeler l\'API avec les bonnes données', async () => {
      const mockResponse = {
        access_token: 'test-token',
        token_type: 'bearer',
        user: {
          id: '1',
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          role: 'user',
          status: 'approved',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      };

      vi.mocked(AuthApi.apiv1authloginpost).mockResolvedValue(mockResponse);

      const { login } = useAuthStore.getState();
      await login('testuser', 'testpass');

      expect(AuthApi.apiv1authloginpost).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'testpass',
      });
    });

    it('devrait stocker le token dans localStorage', async () => {
      const mockResponse = {
        access_token: 'test-token',
        token_type: 'bearer',
        user: {
          id: '1',
          username: 'testuser',
          role: 'user',
          status: 'approved',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      };

      vi.mocked(AuthApi.apiv1authloginpost).mockResolvedValue(mockResponse);

      const { login } = useAuthStore.getState();
      await login('testuser', 'testpass');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test-token');
    });

    it('devrait mettre à jour l\'état du store après une connexion réussie', async () => {
      const mockResponse = {
        access_token: 'test-token',
        token_type: 'bearer',
        user: {
          id: '1',
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          role: 'user',
          status: 'approved',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      };

      vi.mocked(AuthApi.apiv1authloginpost).mockResolvedValue(mockResponse);

      const { login } = useAuthStore.getState();
      await login('testuser', 'testpass');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.currentUser).toEqual({
        id: '1',
        telegram_id: undefined,
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
        status: 'approved',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      });
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('devrait gérer les erreurs de connexion', async () => {
      const mockError = {
        detail: 'Invalid credentials',
      };

      vi.mocked(AuthApi.apiv1authloginpost).mockRejectedValue(mockError);

      const { login } = useAuthStore.getState();
      
      try {
        await login('testuser', 'wrongpass');
      } catch (error) {
        // Expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.currentUser).toBe(null);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });

    it('devrait définir loading à true pendant la connexion', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(AuthApi.apiv1authloginpost).mockReturnValue(promise as any);

      const { login } = useAuthStore.getState();
      const loginPromise = login('testuser', 'testpass');

      // Vérifier que loading est true pendant l'appel
      expect(useAuthStore.getState().loading).toBe(true);

      // Résoudre la promesse
      resolvePromise!({
        access_token: 'test-token',
        token_type: 'bearer',
        user: {
          id: '1',
          username: 'testuser',
          role: 'user',
          status: 'approved',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      });

      await loginPromise;

      // Vérifier que loading est false après la connexion
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  describe('logout', () => {
    it('devrait réinitialiser l\'état et supprimer le token', () => {
      // État initial avec utilisateur connecté
      useAuthStore.setState({
        currentUser: {
          id: '1',
          username: 'testuser',
          role: 'user',
          status: 'approved',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        isAuthenticated: true,
        error: 'Some error',
      });

      const { logout } = useAuthStore.getState();
      logout();

      const state = useAuthStore.getState();
      expect(state.currentUser).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe(null);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('computed properties', () => {
    it('devrait calculer isAdmin correctement', () => {
      const { isAdmin } = useAuthStore.getState();

      // Pas d'utilisateur
      expect(isAdmin()).toBe(false);

      // Utilisateur normal
      useAuthStore.setState({
        currentUser: {
          id: '1',
          username: 'user',
          role: 'user',
          status: 'approved',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      });
      expect(isAdmin()).toBe(false);

      // Admin
      useAuthStore.setState({
        currentUser: {
          id: '1',
          username: 'admin',
          role: 'admin',
          status: 'approved',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      });
      expect(isAdmin()).toBe(true);

      // Super admin
      useAuthStore.setState({
        currentUser: {
          id: '1',
          username: 'superadmin',
          role: 'super-admin',
          status: 'approved',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      });
      expect(isAdmin()).toBe(true);
    });
  });
});