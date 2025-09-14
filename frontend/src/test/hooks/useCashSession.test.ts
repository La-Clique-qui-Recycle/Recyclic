import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCashSession } from '../../hooks/useCashSession'

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

describe('useCashSession Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with no session', () => {
    const { result } = renderHook(() => useCashSession())
    
    expect(result.current.currentSession).toBeNull()
    expect(result.current.isSessionOpen).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should open session successfully', async () => {
    const { result } = renderHook(() => useCashSession())
    
    await act(async () => {
      const response = await result.current.openSession('cashier-123', 100)
      expect(response.success).toBe(true)
      expect(response.session).toBeDefined()
    })
    
    expect(result.current.currentSession).toBeDefined()
    expect(result.current.isSessionOpen).toBe(true)
    expect(result.current.currentSession?.cashier_id).toBe('cashier-123')
    expect(result.current.currentSession?.opening_amount).toBe(100)
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  it('should close session successfully', async () => {
    const { result } = renderHook(() => useCashSession())
    
    // Open session first
    await act(async () => {
      await result.current.openSession('cashier-123', 100)
    })
    
    // Close session
    await act(async () => {
      const response = await result.current.closeSession(150, 'Variance due to tips')
      expect(response.success).toBe(true)
    })
    
    expect(result.current.currentSession?.status).toBe('closed')
    expect(result.current.currentSession?.closing_amount).toBe(150)
    expect(result.current.currentSession?.variance).toBe(50)
    expect(result.current.currentSession?.variance_comment).toBe('Variance due to tips')
  })

  it('should load existing session from localStorage', () => {
    const mockSession = {
      id: 'session-123',
      site_id: '1',
      cashier_id: 'cashier-123',
      opening_amount: 100,
      status: 'opened',
      opened_at: '2024-01-15T10:00:00Z'
    }
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession))
    
    const { result } = renderHook(() => useCashSession())
    
    expect(result.current.currentSession).toEqual(mockSession)
    expect(result.current.isSessionOpen).toBe(true)
  })

  it('should handle session loading errors', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error')
    })
    
    const { result } = renderHook(() => useCashSession())
    
    expect(result.current.currentSession).toBeNull()
    expect(result.current.isSessionOpen).toBe(false)
    expect(result.current.error).toBe('Failed to load session')
  })

  it('should handle invalid session data in localStorage', () => {
    localStorageMock.getItem.mockReturnValue('invalid json')
    
    const { result } = renderHook(() => useCashSession())
    
    expect(result.current.currentSession).toBeNull()
    expect(result.current.isSessionOpen).toBe(false)
    expect(result.current.error).toBe('Failed to load session')
  })

  it('should generate unique session IDs', async () => {
    const { result } = renderHook(() => useCashSession())
    
    const sessionIds = new Set()
    
    // Open multiple sessions (simulating different times)
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        const response = await result.current.openSession(`cashier-${i}`, 100)
        if (response.session) {
          sessionIds.add(response.session.id)
        }
      })
    }
    
    expect(sessionIds.size).toBe(5) // All IDs should be unique
  })

  it('should include all required fields in closed session', async () => {
    const { result } = renderHook(() => useCashSession())
    
    // Open session
    await act(async () => {
      await result.current.openSession('cashier-123', 100)
    })
    
    // Close session
    await act(async () => {
      await result.current.closeSession(150, 'Test variance')
    })
    
    const session = result.current.currentSession
    expect(session).toBeDefined()
    expect(session?.id).toBeDefined()
    expect(session?.site_id).toBeDefined()
    expect(session?.cashier_id).toBeDefined()
    expect(session?.opening_amount).toBe(100)
    expect(session?.closing_amount).toBe(150)
    expect(session?.variance).toBe(50)
    expect(session?.variance_comment).toBe('Test variance')
    expect(session?.status).toBe('closed')
    expect(session?.opened_at).toBeDefined()
    expect(session?.closed_at).toBeDefined()
  })

  it('should calculate variance correctly', async () => {
    const { result } = renderHook(() => useCashSession())
    
    // Open session
    await act(async () => {
      await result.current.openSession('cashier-123', 100)
    })
    
    // Close with different amounts
    const testCases = [
      { closing: 100, expected: 0 },
      { closing: 120, expected: 20 },
      { closing: 80, expected: -20 },
      { closing: 150.50, expected: 50.50 }
    ]
    
    for (const testCase of testCases) {
      await act(async () => {
        await result.current.closeSession(testCase.closing)
      })
      
      expect(result.current.currentSession?.variance).toBe(testCase.expected)
    }
  })

  it('should handle session summary correctly', async () => {
    const { result } = renderHook(() => useCashSession())
    
    // Open session
    await act(async () => {
      await result.current.openSession('cashier-123', 100)
    })
    
    const summary = result.current.getSessionSummary()
    expect(summary).toBeDefined()
    expect(summary?.id).toBeDefined()
    expect(summary?.openingAmount).toBe(100)
    expect(summary?.status).toBe('opened')
    
    // Close session
    await act(async () => {
      await result.current.closeSession(150)
    })
    
    const closedSummary = result.current.getSessionSummary()
    expect(closedSummary?.closingAmount).toBe(150)
    expect(closedSummary?.variance).toBe(50)
    expect(closedSummary?.status).toBe('closed')
  })

  it('should detect significant variance', async () => {
    const { result } = renderHook(() => useCashSession())
    
    // Open session
    await act(async () => {
      await result.current.openSession('cashier-123', 100)
    })
    
    // Test different variance levels
    const testCases = [
      { closing: 104, threshold: 5, expected: false },
      { closing: 106, threshold: 5, expected: true },
      { closing: 94, threshold: 5, expected: false },
      { closing: 90, threshold: 5, expected: true }
    ]
    
    for (const testCase of testCases) {
      await act(async () => {
        await result.current.closeSession(testCase.closing)
      })
      
      expect(result.current.isVarianceSignificant(testCase.threshold)).toBe(testCase.expected)
    }
  })

  it('should handle multiple open/close cycles', async () => {
    const { result } = renderHook(() => useCashSession())
    
    // First cycle
    await act(async () => {
      await result.current.openSession('cashier-1', 100)
    })
    
    expect(result.current.isSessionOpen).toBe(true)
    
    await act(async () => {
      await result.current.closeSession(120)
    })
    
    expect(result.current.currentSession?.status).toBe('closed')
    
    // Second cycle
    await act(async () => {
      await result.current.openSession('cashier-2', 200)
    })
    
    expect(result.current.isSessionOpen).toBe(true)
    expect(result.current.currentSession?.cashier_id).toBe('cashier-2')
    expect(result.current.currentSession?.opening_amount).toBe(200)
  })

  it('should handle session errors gracefully', async () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage error')
    })
    
    const { result } = renderHook(() => useCashSession())
    
    await act(async () => {
      const response = await result.current.openSession('cashier-123', 100)
      expect(response.success).toBe(false)
      expect(response.error).toBe('Failed to open session')
    })
    
    expect(result.current.error).toBe('Failed to open session')
    expect(result.current.isSessionOpen).toBe(false)
  })

  it('should maintain session state consistency', async () => {
    const { result } = renderHook(() => useCashSession())
    
    // Initial state
    expect(result.current.isSessionOpen).toBe(false)
    expect(result.current.currentSession).toBeNull()
    
    // Open session
    await act(async () => {
      await result.current.openSession('cashier-123', 100)
    })
    
    expect(result.current.isSessionOpen).toBe(true)
    expect(result.current.currentSession).toBeDefined()
    expect(result.current.error).toBeNull()
    
    // Close session
    await act(async () => {
      await result.current.closeSession(150)
    })
    
    expect(result.current.currentSession?.status).toBe('closed')
    expect(result.current.currentSession?.closing_amount).toBe(150)
  })
})