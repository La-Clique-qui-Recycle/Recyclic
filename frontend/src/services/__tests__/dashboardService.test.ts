import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dashboardService } from '../dashboardService'
import ApiClient from '../../generated/api'

// Récupérer le mockClient depuis le mock
const mockClient = (ApiClient as any).client || {
  get: vi.fn(),
  defaults: { headers: { common: {} } }
}

// Mock du service d'authentification
vi.mock('../authService', () => ({
  getAuthHeader: vi.fn(() => ({
    Authorization: 'Bearer mock-token'
  }))
}))

// Mock du client API
vi.mock('../../generated/api', () => {
  const mockClient = {
    get: vi.fn(),
    defaults: {
      headers: {
        common: {}
      }
    }
  }

  return {
    default: {
      client: mockClient
    }
  }
})

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('dashboardService', () => {
  const mockCashSessions = [
    {
      id: 'session-1',
      operator_id: 'user-1',
      site_id: 'site-1',
      status: 'open',
      initial_amount: 100,
      current_amount: 100,
      total_sales: 250,
      total_items: 5,
      opened_at: '2024-01-15T10:00:00Z',
      closed_at: null,
    },
    {
      id: 'session-2',
      operator_id: 'user-2',
      site_id: 'site-1',
      status: 'closed',
      initial_amount: 100,
      current_amount: 100,
      total_sales: 180,
      total_items: 3,
      opened_at: '2024-01-15T08:00:00Z',
      closed_at: '2024-01-15T12:00:00Z',
    },
  ]

  const mockUsers = [
    {
      id: 'user-1',
      full_name: 'John Doe',
      username: 'john.doe',
    },
    {
      id: 'user-2',
      full_name: 'Jane Smith',
      username: 'jane.smith',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  describe('getDashboardData', () => {
    it('retourne les données agrégées du dashboard', async () => {
      const mockApiResponse = {
        metrics: {
          totalSessions: 2,
          openSessions: 1,
          closedSessions: 1,
          totalSales: 430,
          totalItems: 8,
          averageSessionDuration: 4,
        },
        recentSessions: mockCashSessions,
        reports: [],
      }

      mockClient.get.mockResolvedValueOnce({ data: mockApiResponse })

      const result = await dashboardService.getDashboardData()

      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/admin/dashboard/stats', { headers: { Authorization: 'Bearer mock-token' } })
      expect(result).toEqual({
        stats: {
          totalSessions: 2,
          openSessions: 1,
          closedSessions: 1,
          totalSales: 430,
          totalItems: 8,
          averageSessionDuration: 4,
        },
        sessions: [
          {
            id: 'session-1',
            siteId: 'site-1',
            operator: 'Opérateur inconnu',
            status: 'open',
            initialAmount: 100,
            currentAmount: 100,
            totalSales: 250,
            totalItems: 5,
            openedAt: '2024-01-15T10:00:00Z',
            closedAt: null,
          },
          {
            id: 'session-2',
            siteId: 'site-1',
            operator: 'Opérateur inconnu',
            status: 'closed',
            initialAmount: 100,
            currentAmount: 100,
            totalSales: 180,
            totalItems: 3,
            openedAt: '2024-01-15T08:00:00Z',
            closedAt: '2024-01-15T12:00:00Z',
          },
        ],
        reports: [],
        encryptedMetrics: undefined,
      })
    })

    it('propage une erreur quand les sessions échouent', async () => {
      const apiError = new Error('API Error')
      mockClient.get.mockRejectedValueOnce(apiError)
      await expect(dashboardService.getDashboardData()).rejects.toThrow('API Error')
    })
  })

  describe('listSites', () => {
    it('retourne la liste des sites depuis l\'API', async () => {
      const mockSites = [
        { id: 'site-1', name: 'Site 1' },
        { id: 'site-2', name: 'Site 2' }
      ]
      const mockApiResponse = { sites: mockSites }

      mockClient.get.mockResolvedValueOnce({ data: mockApiResponse })

      const result = await dashboardService.listSites()

      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/admin/sites')
      expect(result).toEqual(mockSites)
    })

    it('retourne un tableau vide en cas d\'erreur', async () => {
      mockClient.get.mockRejectedValueOnce({ message: 'API Error' })

      const result = await dashboardService.listSites()

      expect(result).toEqual([])
    })
  })

  describe('saveAlertThresholds', () => {
    it('persiste les seuils en localStorage', async () => {
      const thresholds = { cashDiscrepancy: 15, lowInventory: 8 }

      await dashboardService.saveAlertThresholds(thresholds)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'admin_alert_thresholds',
        JSON.stringify({ site_id: null, thresholds }),
      )
    })
  })

  describe('getAlertThresholds', () => {
    it('retourne les valeurs persist�es pour le site courant', async () => {
      const stored = { site_id: 'site-1', thresholds: { cashDiscrepancy: 20, lowInventory: 3 } }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(stored))

      const result = await dashboardService.getAlertThresholds('site-1')
      expect(result).toEqual(stored.thresholds)
    })

    it('retourne les valeurs par d�faut si aucune valeur stock�e', async () => {
      localStorageMock.getItem.mockReturnValue(null)
      const result = await dashboardService.getAlertThresholds()
      expect(result).toEqual({ cashDiscrepancy: 10, lowInventory: 5 })
    })

    it('retourne les valeurs par d�faut si parsing �choue', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      const result = await dashboardService.getAlertThresholds()
      expect(result).toEqual({ cashDiscrepancy: 10, lowInventory: 5 })
    })

    it('retourne les valeurs par d�faut si les seuils concernent un autre site', async () => {
      const stored = { site_id: 'site-2', thresholds: { cashDiscrepancy: 20, lowInventory: 3 } }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(stored))
      const result = await dashboardService.getAlertThresholds('site-1')
      expect(result).toEqual({ cashDiscrepancy: 10, lowInventory: 5 })
    })
  })

  describe('formatDate', () => {
    it('formate correctement une date', () => {
      const result = dashboardService.formatDate('2024-01-15T10:30:00Z')
      expect(result).toBe(new Date('2024-01-15T10:30:00Z').toLocaleString('fr-FR'))
    })
  })

})
