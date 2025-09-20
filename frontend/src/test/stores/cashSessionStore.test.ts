import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock du service avant l'import
vi.mock('../../services/cashSessionService', () => ({
  cashSessionService: {
    closeSession: vi.fn(),
    closeSessionWithAmounts: vi.fn()
  }
}))

import { useCashSessionStore } from '../../stores/cashSessionStore'
import { cashSessionService } from '../../services/cashSessionService'

// Récupérer les mocks après l'import
const mockCloseSession = vi.mocked(cashSessionService.closeSession)
const mockCloseSessionWithAmounts = vi.mocked(cashSessionService.closeSessionWithAmounts)

describe('cashSessionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store state
    useCashSessionStore.setState({
      currentSession: null,
      loading: false,
      error: null
    })
  })

  describe('closeSession', () => {
    it('should close session without amounts when no closeData provided', async () => {
      mockCloseSession.mockResolvedValue(true)
      
      const store = useCashSessionStore.getState()
      const result = await store.closeSession('session-123')
      
      expect(mockCloseSession).toHaveBeenCalledWith('session-123')
      expect(result).toBe(true)
    })

    it('should close session with amounts when closeData provided', async () => {
      const mockClosedSession = {
        id: 'session-123',
        status: 'closed',
        actual_amount: 75.0,
        variance: 0.0
      }
      
      mockCloseSessionWithAmounts.mockResolvedValue(mockClosedSession)
      
      const store = useCashSessionStore.getState()
      const result = await store.closeSession('session-123', {
        actual_amount: 75.0,
        variance_comment: 'Test comment'
      })
      
      expect(mockCloseSessionWithAmounts).toHaveBeenCalledWith('session-123', 75.0, 'Test comment')
      expect(result).toBe(true)
    })

    it('should set loading state during closure', async () => {
      let resolvePromise: (value: boolean) => void
      const promise = new Promise<boolean>(resolve => {
        resolvePromise = resolve
      })
      
      mockCloseSession.mockReturnValue(promise)
      
      const store = useCashSessionStore.getState()
      const closePromise = store.closeSession('session-123')
      
      // Check loading state
      expect(useCashSessionStore.getState().loading).toBe(true)
      
      // Resolve the promise
      resolvePromise!(true)
      await closePromise
      
      // Check loading state after completion
      expect(useCashSessionStore.getState().loading).toBe(false)
    })

    it('should clear currentSession and localStorage on successful closure', async () => {
      const mockSession = {
        id: 'session-123',
        status: 'open'
      }
      
      useCashSessionStore.setState({ currentSession: mockSession })

      // Mock localStorage
      const mockRemoveItem = vi.fn()
      Object.defineProperty(window, 'localStorage', {
        value: {
          removeItem: mockRemoveItem
        }
      })
      
      mockCloseSession.mockResolvedValue(true)
      
      const store = useCashSessionStore.getState()
      await store.closeSession('session-123')
      
      expect(useCashSessionStore.getState().currentSession).toBeNull()
      expect(mockRemoveItem).toHaveBeenCalledWith('currentCashSession')
    })

    it('should handle closure error and set error state', async () => {
      const errorMessage = 'Session not found'
      mockCloseSession.mockRejectedValue(new Error(errorMessage))
      
      const store = useCashSessionStore.getState()
      const result = await store.closeSession('session-123')
      
      expect(result).toBe(false)
      expect(useCashSessionStore.getState().error).toBe(errorMessage)
      expect(useCashSessionStore.getState().loading).toBe(false)
    })

    it('should handle closure with amounts error', async () => {
      const errorMessage = 'Invalid amount'
      mockCloseSessionWithAmounts.mockRejectedValue(new Error(errorMessage))
      
      const store = useCashSessionStore.getState()
      const result = await store.closeSession('session-123', {
        actual_amount: 75.0,
        variance_comment: 'Test'
      })
      
      expect(result).toBe(false)
      expect(useCashSessionStore.getState().error).toBe(errorMessage)
    })

    it('should handle unknown error types', async () => {
      mockCloseSession.mockRejectedValue('Unknown error')
      
      const store = useCashSessionStore.getState()
      const result = await store.closeSession('session-123')
      
      expect(result).toBe(false)
      expect(useCashSessionStore.getState().error).toBe('Erreur lors de la fermeture de session')
    })

    it('should not clear session when closure fails', async () => {
      const mockSession = {
        id: 'session-123',
        status: 'open'
      }
      
      useCashSessionStore.setState({ currentSession: mockSession })
      
      mockCloseSession.mockResolvedValue(false)
      
      const store = useCashSessionStore.getState()
      await store.closeSession('session-123')
      
      expect(useCashSessionStore.getState().currentSession).toBe(mockSession)
    })
  })
})