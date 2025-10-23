/**
 * Tests pour le système de permissions frontend
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../stores/authStore';
import axiosClient from '../api/axiosClient';

// Mock axios
vi.mock('../api/axiosClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: {
      headers: {
        common: {}
      }
    }
  }
}));

describe('Permissions System', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().logout();
    vi.clearAllMocks();
  });

  it('should load user permissions on login', async () => {
    const mockPermissions = ['caisse.access', 'reception.access'];
    const mockLoginResponse = {
      access_token: 'test-token',
      user: {
        id: 'test-user',
        username: 'test@example.com',
        role: 'user',
        status: 'active',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };

    // Mock login response
    vi.mocked(axiosClient.post).mockResolvedValueOnce({
      data: mockLoginResponse
    });

    // Mock permissions response
    vi.mocked(axiosClient.get).mockResolvedValueOnce({
      data: { permissions: mockPermissions }
    });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.permissions).toEqual(mockPermissions);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle permission loading failure gracefully', async () => {
    const mockLoginResponse = {
      access_token: 'test-token',
      user: {
        id: 'test-user',
        username: 'test@example.com',
        role: 'user',
        status: 'active',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };

    // Mock login response
    vi.mocked(axiosClient.post).mockResolvedValueOnce({
      data: mockLoginResponse
    });

    // Mock permissions failure
    vi.mocked(axiosClient.get).mockRejectedValueOnce(new Error('Permissions failed'));

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    // Login should still succeed even if permissions fail
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.permissions).toEqual([]);
  });

  it('should check permissions correctly', () => {
    const { result } = renderHook(() => useAuthStore());

    // Set up user with permissions
    act(() => {
      result.current.setCurrentUser({
        id: 'test-user',
        username: 'test@example.com',
        role: 'user',
        status: 'active',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      result.current.permissions = ['caisse.access', 'reception.access'];
    });

    expect(result.current.hasPermission('caisse.access')).toBe(true);
    expect(result.current.hasPermission('reception.access')).toBe(true);
    expect(result.current.hasPermission('admin.access')).toBe(false);
  });

  it('should give super-admin all permissions', () => {
    const { result } = renderHook(() => useAuthStore());

    // Set up super-admin user
    act(() => {
      result.current.setCurrentUser({
        id: 'test-super-admin',
        username: 'superadmin@example.com',
        role: 'super-admin',
        status: 'active',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      result.current.permissions = [];
    });

    // Super-admin should have all permissions regardless of stored permissions
    expect(result.current.hasPermission('caisse.access')).toBe(true);
    expect(result.current.hasPermission('reception.access')).toBe(true);
    expect(result.current.hasPermission('admin.access')).toBe(true);
    expect(result.current.hasPermission('any.permission')).toBe(true);
  });

  it('should clear permissions on logout', () => {
    const { result } = renderHook(() => useAuthStore());

    // Set up user with permissions
    act(() => {
      result.current.setCurrentUser({
        id: 'test-user',
        username: 'test@example.com',
        role: 'user',
        status: 'active',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      result.current.permissions = ['caisse.access'];
    });

    expect(result.current.permissions).toEqual(['caisse.access']);

    // Logout should clear permissions
    act(() => {
      result.current.logout();
    });

    expect(result.current.permissions).toEqual([]);
    expect(result.current.isAuthenticated).toBe(false);
  });
});
