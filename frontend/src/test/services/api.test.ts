import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

// Mock axios (compatible avec le hoisting de vi.mock)
var mockAxiosInstance: any

vi.mock('axios', () => {
  mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance)
    }
  }
})

// Import du service API après le mock
import api, { HealthApi, UsersApi, SitesApi, DepositsApi, SalesApi, CashSessionsApi } from '../../generated/api'

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock les réponses axios
    mockAxiosInstance.get.mockResolvedValue({ data: {} })
    mockAxiosInstance.post.mockResolvedValue({ data: {} })
    mockAxiosInstance.put.mockResolvedValue({ data: {} })
    mockAxiosInstance.delete.mockResolvedValue({ data: {} })
  })

  describe('Health Check', () => {
    it('should call health endpoint', async () => {
      const mockResponse = { status: 'ok' }
      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse })

      const result = await HealthApi.checkapiv1healthget()

      // Le client généré appelle /v1/health/
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/health/')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Users API', () => {
    it('should get all users', async () => {
      const mockUsers = [{ id: 1, name: 'John Doe' }]
      mockAxiosInstance.get.mockResolvedValue({ data: mockUsers })

      const result = await UsersApi.usersapiv1usersget()

      // Le générateur ajoute ? quand aucun param
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/users/?')
      expect(result).toEqual(mockUsers)
    })

    it('should get user by id', async () => {
      const mockUser = { id: 1, name: 'John Doe' }
      mockAxiosInstance.get.mockResolvedValue({ data: mockUser })

      const result = await UsersApi.userapiv1usersuseridget(1)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/users/1')
      expect(result).toEqual(mockUser)
    })

    it('should create user', async () => {
      const userData = { name: 'John Doe', email: 'john@example.com' }
      const mockResponse = { id: 1, ...userData }
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse })

      const result = await UsersApi.userapiv1userspost(userData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v1/users/', userData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Sites API', () => {
    it('should get all sites', async () => {
      const mockSites = [{ id: 1, name: 'Site 1' }]
      mockAxiosInstance.get.mockResolvedValue({ data: mockSites })

      const result = await SitesApi.sitesapiv1sitesget()

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/sites/?')
      expect(result).toEqual(mockSites)
    })

    it('should get site by id', async () => {
      const mockSite = { id: 1, name: 'Site 1' }
      mockAxiosInstance.get.mockResolvedValue({ data: mockSite })

      const result = await SitesApi.siteapiv1sitessiteidget(1)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/sites/1')
      expect(result).toEqual(mockSite)
    })

    it('should create site', async () => {
      const siteData = { name: 'New Site', address: '123 Main St' }
      const mockResponse = { id: 1, ...siteData }
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse })

      const result = await SitesApi.siteapiv1sitespost(siteData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v1/sites/', siteData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Deposits API', () => {
    it('should get all deposits', async () => {
      const mockDeposits = [{ id: 1, amount: 100 }]
      mockAxiosInstance.get.mockResolvedValue({ data: mockDeposits })

      const result = await DepositsApi.depositsapiv1depositsget()

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/deposits/?')
      expect(result).toEqual(mockDeposits)
    })

    it('should get deposit by id', async () => {
      const mockDeposit = { id: 1, amount: 100 }
      mockAxiosInstance.get.mockResolvedValue({ data: mockDeposit })

      const result = await DepositsApi.depositapiv1depositsdepositidget(1)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/deposits/1')
      expect(result).toEqual(mockDeposit)
    })

    it('should create deposit', async () => {
      const depositData = { amount: 100, user_id: 1 }
      const mockResponse = { id: 1, ...depositData }
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse })

      const result = await DepositsApi.depositapiv1depositspost(depositData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v1/deposits/', depositData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Sales API', () => {
    it('should get all sales', async () => {
      const mockSales = [{ id: 1, total: 50 }]
      mockAxiosInstance.get.mockResolvedValue({ data: mockSales })

      const result = await SalesApi.salesapiv1salesget()

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/sales/?')
      expect(result).toEqual(mockSales)
    })

    it('should get sale by id', async () => {
      const mockSale = { id: 1, total: 50 }
      mockAxiosInstance.get.mockResolvedValue({ data: mockSale })

      const result = await SalesApi.saleapiv1salessaleidget(1)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/sales/1')
      expect(result).toEqual(mockSale)
    })

    it('should create sale', async () => {
      const saleData = { total: 50, items: [] }
      const mockResponse = { id: 1, ...saleData }
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse })

      const result = await SalesApi.saleapiv1salespost(saleData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v1/sales/', saleData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Cash Sessions API', () => {
    it('should get all cash sessions', async () => {
      const mockSessions = [{ id: 1, opened_at: '2024-01-01' }]
      mockAxiosInstance.get.mockResolvedValue({ data: mockSessions })

      const result = await CashSessionsApi.cashsessionsapiv1cashsessionsget()

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/cash-sessions/?')
      expect(result).toEqual(mockSessions)
    })

    it('should get cash session by id', async () => {
      const mockSession = { id: 1, opened_at: '2024-01-01' }
      mockAxiosInstance.get.mockResolvedValue({ data: mockSession })

      const result = await CashSessionsApi.cashsessionapiv1cashsessionssessionidget(1)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/cash-sessions/1')
      expect(result).toEqual(mockSession)
    })

    it('should create cash session', async () => {
      const sessionData = { user_id: 1, site_id: 1 }
      const mockResponse = { id: 1, ...sessionData }
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse })

      const result = await CashSessionsApi.cashsessionapiv1cashsessionspost(sessionData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v1/cash-sessions/', sessionData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Error Handling', () => {
    it('should propagate errors from API calls', async () => {
      const error = new Error('Network error')
      mockAxiosInstance.get.mockRejectedValue(error)

      await expect(UsersApi.usersapiv1usersget()).rejects.toThrow('Network error')
    })

    it('should handle API error responses', async () => {
      const error = {
        response: {
          data: { detail: 'Validation error' },
          status: 400
        }
      }
      mockAxiosInstance.post.mockRejectedValue(error)

      await expect(UsersApi.userapiv1userspost({})).rejects.toEqual(error)
    })
  })
})
