import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../../hooks/useAuth'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with no user when localStorage is empty', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should load user from localStorage on mount', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      role: 'user',
      email: 'test@example.com'
    }
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser))
    
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle login successfully', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      role: 'user',
      email: 'test@example.com'
    }
    
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      const response = await result.current.login(mockUser)
      expect(response.success).toBe(true)
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser))
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('should handle logout', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      role: 'user',
      email: 'test@example.com'
    }
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser))
    
    const { result } = renderHook(() => useAuth())
    
    act(() => {
      result.current.logout()
    })
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should check user role correctly', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      role: 'admin',
      email: 'test@example.com'
    }
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser))
    
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.hasRole('admin')).toBe(true)
    expect(result.current.hasRole('user')).toBe(false)
  })

  it('should check permissions correctly', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      role: 'admin',
      email: 'test@example.com',
      permissions: ['read', 'write', 'delete']
    }
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser))
    
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.hasPermission('read')).toBe(true)
    expect(result.current.hasPermission('write')).toBe(true)
    expect(result.current.hasPermission('admin')).toBe(false)
  })

  it('should return false for permissions when not authenticated', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.hasRole('admin')).toBe(false)
    expect(result.current.hasPermission('read')).toBe(false)
  })

  it('should handle super-admin permissions', () => {
    const mockUser = {
      id: '1',
      username: 'superadmin',
      role: 'super-admin',
      email: 'superadmin@example.com',
      permissions: ['*'] // Super admin has all permissions
    }
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser))
    
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.hasRole('super-admin')).toBe(true)
    expect(result.current.hasPermission('read')).toBe(true)
    expect(result.current.hasPermission('write')).toBe(true)
    expect(result.current.hasPermission('delete')).toBe(true)
    expect(result.current.hasPermission('admin')).toBe(true)
  })

  it('should handle user role permissions', () => {
    const mockUser = {
      id: '1',
      username: 'regularuser',
      role: 'user',
      email: 'user@example.com',
      permissions: ['read']
    }
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser))
    
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.hasRole('user')).toBe(true)
    expect(result.current.hasRole('admin')).toBe(false)
    expect(result.current.hasPermission('read')).toBe(true)
    expect(result.current.hasPermission('write')).toBe(false)
  })

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error')
    })
    
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('Failed to load user')
  })

  it('should handle login errors gracefully', async () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage error')
    })
    
    const mockUser = {
      id: '1',
      username: 'testuser',
      role: 'user',
      email: 'test@example.com'
    }
    
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      const response = await result.current.login(mockUser)
      expect(response.success).toBe(false)
      expect(response.error).toBe('Failed to login')
    })
    
    expect(result.current.error).toBe('Failed to login')
  })

  it('should handle invalid JSON in localStorage', () => {
    localStorageMock.getItem.mockReturnValue('invalid json')
    
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('Failed to load user')
  })

  it('should maintain state consistency during operations', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      role: 'user',
      email: 'test@example.com'
    }
    
    const { result } = renderHook(() => useAuth())
    
    // Initial state
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    
    // Login
    await act(async () => {
      await result.current.login(mockUser)
    })
    
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(mockUser)
    
    // Logout
    act(() => {
      result.current.logout()
    })
    
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('should handle multiple login attempts', async () => {
    const mockUser1 = {
      id: '1',
      username: 'user1',
      role: 'user',
      email: 'user1@example.com'
    }
    
    const mockUser2 = {
      id: '2',
      username: 'user2',
      role: 'admin',
      email: 'user2@example.com'
    }
    
    const { result } = renderHook(() => useAuth())
    
    // First login
    await act(async () => {
      await result.current.login(mockUser1)
    })
    
    expect(result.current.user).toEqual(mockUser1)
    expect(result.current.hasRole('user')).toBe(true)
    
    // Second login (should replace first)
    await act(async () => {
      await result.current.login(mockUser2)
    })
    
    expect(result.current.user).toEqual(mockUser2)
    expect(result.current.hasRole('admin')).toBe(true)
    expect(result.current.hasRole('user')).toBe(false)
  })
})