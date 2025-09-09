import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock axios et le module api complètement
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }))
  }
}))

// Mock du module api
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  },
  getHealth: vi.fn(),
  getUsers: vi.fn(),
  getUser: vi.fn(),
  createUser: vi.fn(),
  getSites: vi.fn(),
  getSite: vi.fn(),
  createSite: vi.fn(),
  getDeposits: vi.fn(),
  getDeposit: vi.fn(),
  createDeposit: vi.fn(),
  getSales: vi.fn(),
  getSale: vi.fn(),
  createSale: vi.fn(),
  getCashSessions: vi.fn(),
  getCashSession: vi.fn(),
  createCashSession: vi.fn()
}))

// Import après les mocks
import axios from 'axios'
import api, {
  getHealth,
  getUsers,
  getUser,
  createUser,
  getSites,
  getSite,
  createSite,
  getDeposits,
  getDeposit,
  createDeposit,
  getSales,
  getSale,
  createSale,
  getCashSessions,
  getCashSession,
  createCashSession
} from '../../services/api'

const mockedAxios = vi.mocked(axios)
const mockAxiosInstance = mockedAxios.create()

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock les fonctions API
    api.get.mockResolvedValue({ data: {} })
    api.post.mockResolvedValue({ data: {} })
    api.put.mockResolvedValue({ data: {} })
    api.delete.mockResolvedValue({ data: {} })
  })


  describe('Health Check', () => {
    it('should call health endpoint', async () => {
      const mockResponse = { status: 'ok' }
      vi.mocked(getHealth).mockResolvedValue(mockResponse)

      const result = await getHealth()

      expect(getHealth).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Users API', () => {
    it('should get all users', async () => {
      const mockUsers = [{ id: 1, name: 'John Doe' }]
      vi.mocked(getUsers).mockResolvedValue(mockUsers)

      const result = await getUsers()

      expect(getUsers).toHaveBeenCalled()
      expect(result).toEqual(mockUsers)
    })

    it('should get user by id', async () => {
      const mockUser = { id: 1, name: 'John Doe' }
      vi.mocked(getUser).mockResolvedValue(mockUser)

      const result = await getUser(1)

      expect(getUser).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockUser)
    })

    it('should create user', async () => {
      const userData = { name: 'John Doe', email: 'john@example.com' }
      const mockResponse = { id: 1, ...userData }
      vi.mocked(createUser).mockResolvedValue(mockResponse)

      const result = await createUser(userData)

      expect(createUser).toHaveBeenCalledWith(userData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Sites API', () => {
    it('should get all sites', async () => {
      const mockSites = [{ id: 1, name: 'Site 1' }]
      vi.mocked(getSites).mockResolvedValue(mockSites)

      const result = await getSites()

      expect(getSites).toHaveBeenCalled()
      expect(result).toEqual(mockSites)
    })

    it('should get site by id', async () => {
      const mockSite = { id: 1, name: 'Site 1' }
      vi.mocked(getSite).mockResolvedValue(mockSite)

      const result = await getSite(1)

      expect(getSite).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockSite)
    })

    it('should create site', async () => {
      const siteData = { name: 'New Site', address: '123 Main St' }
      const mockResponse = { id: 1, ...siteData }
      vi.mocked(createSite).mockResolvedValue(mockResponse)

      const result = await createSite(siteData)

      expect(createSite).toHaveBeenCalledWith(siteData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Deposits API', () => {
    it('should get all deposits', async () => {
      const mockDeposits = [{ id: 1, amount: 100 }]
      vi.mocked(getDeposits).mockResolvedValue(mockDeposits)

      const result = await getDeposits()

      expect(getDeposits).toHaveBeenCalled()
      expect(result).toEqual(mockDeposits)
    })

    it('should get deposit by id', async () => {
      const mockDeposit = { id: 1, amount: 100 }
      vi.mocked(getDeposit).mockResolvedValue(mockDeposit)

      const result = await getDeposit(1)

      expect(getDeposit).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockDeposit)
    })

    it('should create deposit', async () => {
      const depositData = { amount: 100, user_id: 1 }
      const mockResponse = { id: 1, ...depositData }
      vi.mocked(createDeposit).mockResolvedValue(mockResponse)

      const result = await createDeposit(depositData)

      expect(createDeposit).toHaveBeenCalledWith(depositData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Sales API', () => {
    it('should get all sales', async () => {
      const mockSales = [{ id: 1, total: 50 }]
      vi.mocked(getSales).mockResolvedValue(mockSales)

      const result = await getSales()

      expect(getSales).toHaveBeenCalled()
      expect(result).toEqual(mockSales)
    })

    it('should get sale by id', async () => {
      const mockSale = { id: 1, total: 50 }
      vi.mocked(getSale).mockResolvedValue(mockSale)

      const result = await getSale(1)

      expect(getSale).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockSale)
    })

    it('should create sale', async () => {
      const saleData = { total: 50, items: [] }
      const mockResponse = { id: 1, ...saleData }
      vi.mocked(createSale).mockResolvedValue(mockResponse)

      const result = await createSale(saleData)

      expect(createSale).toHaveBeenCalledWith(saleData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Cash Sessions API', () => {
    it('should get all cash sessions', async () => {
      const mockSessions = [{ id: 1, opened_at: '2024-01-01' }]
      vi.mocked(getCashSessions).mockResolvedValue(mockSessions)

      const result = await getCashSessions()

      expect(getCashSessions).toHaveBeenCalled()
      expect(result).toEqual(mockSessions)
    })

    it('should get cash session by id', async () => {
      const mockSession = { id: 1, opened_at: '2024-01-01' }
      vi.mocked(getCashSession).mockResolvedValue(mockSession)

      const result = await getCashSession(1)

      expect(getCashSession).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockSession)
    })

    it('should create cash session', async () => {
      const sessionData = { user_id: 1, site_id: 1 }
      const mockResponse = { id: 1, ...sessionData }
      vi.mocked(createCashSession).mockResolvedValue(mockResponse)

      const result = await createCashSession(sessionData)

      expect(createCashSession).toHaveBeenCalledWith(sessionData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Error Handling', () => {
    it('should propagate errors from API calls', async () => {
      const error = new Error('Network error')
      vi.mocked(getUsers).mockRejectedValue(error)

      await expect(getUsers()).rejects.toThrow('Network error')
    })

    it('should handle API error responses', async () => {
      const error = {
        response: {
          data: { detail: 'Validation error' },
          status: 400
        }
      }
      vi.mocked(createUser).mockRejectedValue(error)

      await expect(createUser({})).rejects.toEqual(error)
    })
  })
})
