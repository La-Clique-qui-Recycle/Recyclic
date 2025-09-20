import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cashSessionService } from '../../services/cashSessionService'
import axios from 'axios'

// Le mock axios est déjà configuré dans setup.ts
const mockAxiosInstance = axios.create()

describe('cashSessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('closeSessionWithAmounts', () => {
    it('should call API with correct parameters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'session-123',
            status: 'closed',
            actual_amount: 75.0,
            variance: 0.0,
            variance_comment: null
          }
        }
      }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      const result = await cashSessionService.closeSessionWithAmounts('session-123', 75.0, 'Test comment')
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/v1/cash-sessions/session-123/close', {
        actual_amount: 75.0,
        variance_comment: 'Test comment'
      })
      
      expect(result).toEqual(mockResponse.data.data)
    })

    it('should call API without comment when not provided', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'session-123',
            status: 'closed',
            actual_amount: 75.0,
            variance: 0.0,
            variance_comment: null
          }
        }
      }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      await cashSessionService.closeSessionWithAmounts('session-123', 75.0)
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/v1/cash-sessions/session-123/close', {
        actual_amount: 75.0,
        variance_comment: undefined
      })
    })

    it('should throw error when API returns error', async () => {
      const mockError = {
        response: {
          data: {
            detail: 'Session not found'
          }
        }
      }
      
      mockAxiosInstance.post.mockRejectedValue(mockError)
      
      await expect(cashSessionService.closeSessionWithAmounts('session-123', 75.0))
        .rejects.toThrow('Session not found')
    })

    it('should throw error when API returns success: false', async () => {
      const mockResponse = {
        data: {
          success: false,
          message: 'Session already closed'
        }
      }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      await expect(cashSessionService.closeSessionWithAmounts('session-123', 75.0))
        .rejects.toThrow('Session already closed')
    })

    it('should throw generic error for network issues', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'))
      
      await expect(cashSessionService.closeSessionWithAmounts('session-123', 75.0))
        .rejects.toThrow('Network error')
    })

    it('should throw generic error for unknown errors', async () => {
      mockAxiosInstance.post.mockRejectedValue({})
      
      await expect(cashSessionService.closeSessionWithAmounts('session-123', 75.0))
        .rejects.toThrow('Erreur lors de la fermeture de la session')
    })
  })
})
