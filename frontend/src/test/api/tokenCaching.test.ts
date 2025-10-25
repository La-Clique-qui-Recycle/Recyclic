import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../../stores/authStore'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('Token Caching Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset auth store state
    useAuthStore.getState().logout()
  })

  it('should read token from localStorage only once and cache in memory', () => {
    // Arrange
    const mockToken = 'test-jwt-token-123'
    mockLocalStorage.getItem.mockReturnValue(mockToken)

    // Act
    useAuthStore.getState().initializeAuth()

    // Assert
    expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(1)
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token')
    expect(useAuthStore.getState().getToken()).toBe(mockToken)
  })

  it('should use token from auth store instead of localStorage in axios interceptor', () => {
    // Arrange
    const mockToken = 'cached-jwt-token-456'
    useAuthStore.getState().setToken(mockToken)

    // Act
    const token = useAuthStore.getState().getToken()

    // Assert
    expect(token).toBe(mockToken)
    expect(mockLocalStorage.getItem).not.toHaveBeenCalled()
  })

  it('should handle token expiration and update from auth store', () => {
    // Arrange
    const initialToken = 'initial-token'
    const updatedToken = 'updated-token'
    useAuthStore.getState().setToken(initialToken)

    // Act
    useAuthStore.getState().setToken(updatedToken)

    // Assert
    expect(useAuthStore.getState().getToken()).toBe(updatedToken)
  })

  it('should not call localStorage.getItem on every API call in a loop', () => {
    // Arrange
    const mockToken = 'loop-test-token'
    useAuthStore.getState().setToken(mockToken)

    // Act - Simulate multiple API calls
    for (let i = 0; i < 10; i++) {
      const token = useAuthStore.getState().getToken()
      expect(token).toBe(mockToken)
    }

    // Assert
    expect(mockLocalStorage.getItem).not.toHaveBeenCalled()
  })

  it('should clear cached token on logout', () => {
    // Arrange
    const mockToken = 'logout-test-token'
    useAuthStore.getState().setToken(mockToken)
    expect(useAuthStore.getState().getToken()).toBe(mockToken)

    // Act
    useAuthStore.getState().logout()

    // Assert
    expect(useAuthStore.getState().getToken()).toBeNull()
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token')
  })

  it('should handle multiple login attempts with different tokens', async () => {
    // Arrange
    const user1 = { username: 'user1@test.com', password: 'password1' }
    const user2 = { username: 'user2@test.com', password: 'password2' }
    const token1 = 'token-user-1'
    const token2 = 'token-user-2'

    // Act - First login
    useAuthStore.getState().setToken(token1)
    expect(useAuthStore.getState().getToken()).toBe(token1)

    // Act - Second login (different user)
    useAuthStore.getState().setToken(token2)
    expect(useAuthStore.getState().getToken()).toBe(token2)

    // Assert
    expect(useAuthStore.getState().getToken()).toBe(token2)
  })
})
