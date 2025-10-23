/**
 * Tests pour la déconnexion audité (Story b34-p7)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../../stores/authStore';
import axiosClient from '../../api/axiosClient';

// Mock axios
vi.mock('../../api/axiosClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    defaults: {
      headers: {
        common: {}
      }
    }
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('AuthStore Logout Audited', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().logout();
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-token');
  });

  it('should call logout API before local logout', async () => {
    const mockLogoutResponse = { message: 'Déconnexion réussie' };
    
    // Mock successful logout API call
    vi.mocked(axiosClient.post).mockResolvedValueOnce({
      data: mockLogoutResponse
    });

    const { result } = renderHook(() => useAuthStore());

    // Set up authenticated user
    act(() => {
      result.current.setCurrentUser({
        id: 'test-user',
        username: 'test@example.com',
        role: 'user',
        status: 'approved',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      result.current.setAuthenticated(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    // Verify API call was made
    expect(axiosClient.post).toHaveBeenCalledWith('/v1/auth/logout');
    
    // Verify local logout occurred
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.currentUser).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
  });

  it('should proceed with local logout even if API call fails', async () => {
    // Mock failed logout API call
    vi.mocked(axiosClient.post).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAuthStore());

    // Set up authenticated user
    act(() => {
      result.current.setCurrentUser({
        id: 'test-user',
        username: 'test@example.com',
        role: 'user',
        status: 'approved',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      result.current.setAuthenticated(true);
    });

    // Mock console.warn to verify it's called
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await act(async () => {
      await result.current.logout();
    });

    // Verify API call was attempted
    expect(axiosClient.post).toHaveBeenCalledWith('/v1/auth/logout');
    
    // Verify warning was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      'Logout API call failed, proceeding with local logout:',
      expect.any(Error)
    );
    
    // Verify local logout still occurred
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.currentUser).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');

    consoleSpy.mockRestore();
  });

  it('should handle network timeout gracefully', async () => {
    // Mock timeout error
    const timeoutError = new Error('timeout');
    timeoutError.name = 'TimeoutError';
    vi.mocked(axiosClient.post).mockRejectedValueOnce(timeoutError);

    const { result } = renderHook(() => useAuthStore());

    // Set up authenticated user
    act(() => {
      result.current.setCurrentUser({
        id: 'test-user',
        username: 'test@example.com',
        role: 'user',
        status: 'approved',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      result.current.setAuthenticated(true);
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await act(async () => {
      await result.current.logout();
    });

    // Verify local logout still occurred despite timeout
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.currentUser).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');

    consoleSpy.mockRestore();
  });

  it('should clear authorization header on logout', async () => {
    // Mock successful logout API call
    vi.mocked(axiosClient.post).mockResolvedValueOnce({
      data: { message: 'Déconnexion réussie' }
    });

    const { result } = renderHook(() => useAuthStore());

    // Set up authenticated user
    act(() => {
      result.current.setCurrentUser({
        id: 'test-user',
        username: 'test@example.com',
        role: 'user',
        status: 'approved',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      result.current.setAuthenticated(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    // Verify authorization header was cleared
    expect(axiosClient.defaults.headers.common['Authorization']).toBeUndefined();
  });

  it('should reset permissions on logout', async () => {
    // Mock successful logout API call
    vi.mocked(axiosClient.post).mockResolvedValueOnce({
      data: { message: 'Déconnexion réussie' }
    });

    const { result } = renderHook(() => useAuthStore());

    // Set up authenticated user with permissions
    act(() => {
      result.current.setCurrentUser({
        id: 'test-user',
        username: 'test@example.com',
        role: 'user',
        status: 'approved',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      result.current.setAuthenticated(true);
      result.current.permissions = ['caisse.access', 'reception.access'];
    });

    await act(async () => {
      await result.current.logout();
    });

    // Verify permissions were cleared
    expect(result.current.permissions).toEqual([]);
  });
});

