import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useAuthStore } from '../../stores/authStore';
import { AuthApi } from '../../generated/api';

// Mock de l'API
vi.mock('../../generated/api');

const mockAuthApi = AuthApi as any;

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset du store
    useAuthStore.getState().setCurrentUser(null);
    useAuthStore.getState().setAuthenticated(false);
    useAuthStore.getState().setError(null);
    useAuthStore.getState().setLoading(false);
    localStorage.clear();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockLoginResponse = {
        access_token: 'fake-jwt-token',
        token_type: 'bearer',
        user: {
          id: 'user-123',
          username: 'testuser',
          role: 'user',
          status: 'approved',
          is_active: true,
          created_at: '2025-01-27T10:00:00Z',
          updated_at: '2025-01-27T10:00:00Z'
        }
      };

      mockAuthApi.apiv1authloginpost = vi.fn().mockResolvedValue(mockLoginResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('testuser', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.currentUser).toEqual({
        id: 'user-123',
        username: 'testuser',
        role: 'user',
        status: 'approved',
        is_active: true,
        created_at: '2025-01-27T10:00:00Z',
        updated_at: '2025-01-27T10:00:00Z'
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(localStorage.getItem('token')).toBe('fake-jwt-token');
    });

    it('should handle login failure', async () => {
      const mockError = {
        detail: 'Identifiants invalides ou utilisateur inactif'
      };

      mockAuthApi.apiv1authloginpost = vi.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.login('wronguser', 'wrongpassword');
        } catch {
          // Expected error
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentUser).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Identifiants invalides ou utilisateur inactif');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('signup', () => {
    it('should signup successfully with valid data', async () => {
      const mockSignupResponse = {
        message: 'Compte créé avec succès. Votre compte est en attente de validation par un administrateur.',
        user_id: 'user-456',
        status: 'pending'
      };

      mockAuthApi.apiv1authsignuppost = vi.fn().mockResolvedValue(mockSignupResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signup('newuser', 'password123', 'test@example.com');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      // L'utilisateur ne devrait pas être connecté automatiquement après signup
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentUser).toBeNull();
      expect(mockAuthApi.apiv1authsignuppost).toHaveBeenCalledWith({
        username: 'newuser',
        password: 'password123',
        email: 'test@example.com'
      });
    });

    it('should signup successfully without email', async () => {
      const mockSignupResponse = {
        message: 'Compte créé avec succès. Votre compte est en attente de validation par un administrateur.',
        user_id: 'user-456',
        status: 'pending'
      };

      mockAuthApi.apiv1authsignuppost = vi.fn().mockResolvedValue(mockSignupResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signup('newuser2', 'password123');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockAuthApi.apiv1authsignuppost).toHaveBeenCalledWith({
        username: 'newuser2',
        password: 'password123',
        email: undefined
      });
    });

    it('should handle signup failure with existing username', async () => {
      const mockError = {
        detail: 'Ce nom d\'utilisateur est déjà pris'
      };

      mockAuthApi.apiv1authsignuppost = vi.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signup('existinguser', 'password123');
        } catch {
          // Expected error
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Ce nom d\'utilisateur est déjà pris');
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentUser).toBeNull();
    });

    it('should handle signup failure with generic error', async () => {
      const mockError = {};

      mockAuthApi.apiv1authsignuppost = vi.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signup('testuser', 'password123');
        } catch {
          // Expected error
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Erreur lors de l\'inscription');
    });
  });

  describe('logout', () => {
    it('should logout and clear all data', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set up authenticated state
      act(() => {
        result.current.setCurrentUser({
          id: 'user-123',
          username: 'testuser',
          role: 'user',
          status: 'approved',
          is_active: true,
          created_at: '2025-01-27T10:00:00Z',
          updated_at: '2025-01-27T10:00:00Z'
        });
        result.current.setAuthenticated(true);
      });
      localStorage.setItem('token', 'fake-token');

      act(() => {
        result.current.logout();
      });

      expect(result.current.currentUser).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('computed properties', () => {
    it('should correctly identify admin users', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setCurrentUser({
          id: 'admin-123',
          username: 'admin',
          role: 'admin',
          status: 'approved',
          is_active: true,
          created_at: '2025-01-27T10:00:00Z',
          updated_at: '2025-01-27T10:00:00Z'
        });
      });

      expect(result.current.isAdmin()).toBe(true);
      expect(result.current.canManageUsers()).toBe(true);
    });

    it('should correctly identify super-admin users', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setCurrentUser({
          id: 'superadmin-123',
          username: 'superadmin',
          role: 'super-admin',
          status: 'approved',
          is_active: true,
          created_at: '2025-01-27T10:00:00Z',
          updated_at: '2025-01-27T10:00:00Z'
        });
      });

      expect(result.current.isAdmin()).toBe(true);
      expect(result.current.canManageUsers()).toBe(true);
    });

    it('should correctly identify operator users (cash access)', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setCurrentUser({
          id: 'operator-123',
          username: 'operator',
          role: 'manager',
          status: 'approved',
          is_active: true,
          created_at: '2025-01-27T10:00:00Z',
          updated_at: '2025-01-27T10:00:00Z'
        });
      });

      expect(result.current.hasCashAccess()).toBe(true);
      expect(result.current.canManageUsers()).toBe(false);
    });

    it('should correctly identify regular users', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setCurrentUser({
          id: 'user-123',
          username: 'user',
          role: 'user',
          status: 'approved',
          is_active: true,
          created_at: '2025-01-27T10:00:00Z',
          updated_at: '2025-01-27T10:00:00Z'
        });
      });

      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.hasCashAccess()).toBe(true); // Les utilisateurs 'user' peuvent accéder à la caisse
      expect(result.current.canManageUsers()).toBe(false);
    });

    it('should allow user role to access cash functionality', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setCurrentUser({
          id: 'user-456',
          username: 'regular_user',
          role: 'user',
          status: 'approved',
          is_active: true,
          created_at: '2025-01-27T10:00:00Z',
          updated_at: '2025-01-27T10:00:00Z'
        });
      });

      // Vérifier que l'utilisateur 'user' peut accéder à la caisse
      expect(result.current.hasCashAccess()).toBe(true);
      expect(result.current.isAdmin()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should clear error when clearError is called', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should set loading state correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.loading).toBe(false);
    });
  });
});