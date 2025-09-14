import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { adminService, AdminUser, UserRole, UserStatus } from '../../services/adminService'

// Mock axios
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() }
  }
}

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance)
  }
}))

// Mock du client API généré
vi.mock('../../generated', () => ({
  UsersApi: {
    getUsers: vi.fn(),
    getUserById: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    updateUserRole: vi.fn(),
    updateUserStatus: vi.fn(),
    deleteUser: vi.fn()
  },
  UserRole: {
    USER: 'user',
    CASHIER: 'cashier',
    MANAGER: 'manager',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super-admin'
  },
  UserStatus: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  },
  UserRoleUpdate: {},
  UserStatusUpdate: {},
  UserCreate: {},
  UserUpdate: {},
  AdminUser: {},
  AdminResponse: {}
}))

describe('AdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUsers', () => {
    it('should fetch users and apply filters', async () => {
      const mockUsers = [
        {
          id: '1',
          telegram_id: '123456789',
          username: 'john_doe',
          first_name: 'John',
          last_name: 'Doe',
          role: UserRole.USER,
          status: UserStatus.APPROVED,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          telegram_id: '987654321',
          username: 'jane_smith',
          first_name: 'Jane',
          last_name: 'Smith',
          role: UserRole.ADMIN,
          status: UserStatus.PENDING,
          is_active: false,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ]

      const { UsersApi } = await import('../../generated')
      vi.mocked(UsersApi.getUsers).mockResolvedValue(mockUsers)

      const result = await adminService.getUsers()

      expect(UsersApi.getUsers).toHaveBeenCalledWith({
        skip: undefined,
        limit: undefined
      })
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        ...mockUsers[0],
        full_name: 'John Doe',
        email: undefined,
        site_id: undefined
      })
    })

    it('should apply role filter', async () => {
      const mockUsers = [
        {
          id: '1',
          telegram_id: '123456789',
          username: 'john_doe',
          first_name: 'John',
          last_name: 'Doe',
          role: UserRole.USER,
          status: UserStatus.APPROVED,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          telegram_id: '987654321',
          username: 'jane_smith',
          first_name: 'Jane',
          last_name: 'Smith',
          role: UserRole.ADMIN,
          status: UserStatus.PENDING,
          is_active: false,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ]

      const { UsersApi } = await import('../../generated')
      vi.mocked(UsersApi.getUsers).mockResolvedValue(mockUsers)

      const result = await adminService.getUsers({ role: UserRole.ADMIN })

      expect(result).toHaveLength(1)
      expect(result[0].role).toBe(UserRole.ADMIN)
    })

    it('should apply search filter', async () => {
      const mockUsers = [
        {
          id: '1',
          telegram_id: '123456789',
          username: 'john_doe',
          first_name: 'John',
          last_name: 'Doe',
          role: UserRole.USER,
          status: UserStatus.APPROVED,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          telegram_id: '987654321',
          username: 'jane_smith',
          first_name: 'Jane',
          last_name: 'Smith',
          role: UserRole.ADMIN,
          status: UserStatus.PENDING,
          is_active: false,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ]

      const { UsersApi } = await import('../../generated')
      vi.mocked(UsersApi.getUsers).mockResolvedValue(mockUsers)

      const result = await adminService.getUsers({ search: 'john' })

      expect(result).toHaveLength(1)
      expect(result[0].username).toBe('john_doe')
    })
  })

  describe('updateUserRole', () => {
    it('should update user role and return AdminResponse', async () => {
      const mockUpdatedUser = {
        id: '1',
        telegram_id: '123456789',
        username: 'john_doe',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.ADMIN,
        status: UserStatus.APPROVED,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const { UsersApi } = await import('../../generated')
      vi.mocked(UsersApi.updateUserRole).mockResolvedValue(mockUpdatedUser)

      const result = await adminService.updateUserRole('1', { role: UserRole.ADMIN })

      expect(UsersApi.updateUserRole).toHaveBeenCalledWith('1', { role: UserRole.ADMIN })
      expect(result).toMatchObject({
        data: {
          ...mockUpdatedUser,
          full_name: 'John Doe',
          email: undefined,
          site_id: undefined
        },
        message: 'Rôle mis à jour avec succès',
        success: true
      })
    })
  })

  describe('getUserById', () => {
    it('should get user by id and convert to AdminUser', async () => {
      const mockUser = {
        id: '1',
        telegram_id: '123456789',
        username: 'john_doe',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.USER,
        status: UserStatus.APPROVED,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const { UsersApi } = await import('../../generated')
      vi.mocked(UsersApi.getUserById).mockResolvedValue(mockUser)

      const result = await adminService.getUserById('1')

      expect(UsersApi.getUserById).toHaveBeenCalledWith('1')
      expect(result).toMatchObject({
        ...mockUser,
        full_name: 'John Doe',
        email: undefined,
        site_id: undefined
      })
    })
  })

  describe('createUser', () => {
    it('should create user and return AdminResponse', async () => {
      const userData = {
        telegram_id: '123456789',
        username: 'john_doe',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.USER,
        status: UserStatus.PENDING
      }

      const mockCreatedUser = {
        id: '1',
        ...userData,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const { UsersApi } = await import('../../generated')
      vi.mocked(UsersApi.createUser).mockResolvedValue(mockCreatedUser)

      const result = await adminService.createUser(userData)

      expect(UsersApi.createUser).toHaveBeenCalledWith(userData)
      expect(result).toMatchObject({
        data: {
          ...mockCreatedUser,
          full_name: 'John Doe',
          email: undefined,
          site_id: undefined
        },
        message: 'Utilisateur créé avec succès',
        success: true
      })
    })
  })

  describe('updateUser', () => {
    it('should update user and return AdminResponse', async () => {
      const userData = {
        username: 'john_doe_updated',
        first_name: 'John Updated'
      }

      const mockUpdatedUser = {
        id: '1',
        telegram_id: '123456789',
        username: 'john_doe_updated',
        first_name: 'John Updated',
        last_name: 'Doe',
        role: UserRole.USER,
        status: UserStatus.APPROVED,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const { UsersApi } = await import('../../generated')
      vi.mocked(UsersApi.updateUser).mockResolvedValue(mockUpdatedUser)

      const result = await adminService.updateUser('1', userData)

      expect(UsersApi.updateUser).toHaveBeenCalledWith('1', userData)
      expect(result).toMatchObject({
        data: {
          ...mockUpdatedUser,
          full_name: 'John Updated Doe',
          email: undefined,
          site_id: undefined
        },
        message: 'Utilisateur mis à jour avec succès',
        success: true
      })
    })
  })

  describe('deleteUser', () => {
    it('should delete user and return AdminResponse', async () => {
      const { UsersApi } = await import('../../generated')
      vi.mocked(UsersApi.deleteUser).mockResolvedValue(undefined)

      const result = await adminService.deleteUser('1')

      expect(UsersApi.deleteUser).toHaveBeenCalledWith('1')
      expect(result).toMatchObject({
        data: undefined,
        message: 'Utilisateur supprimé avec succès',
        success: true
      })
    })
  })

  describe('Error Handling', () => {
    it('should propagate errors from API calls', async () => {
      const error = new Error('API Error')
      const { UsersApi } = await import('../../generated')
      vi.mocked(UsersApi.getUsers).mockRejectedValue(error)

      await expect(adminService.getUsers()).rejects.toThrow('API Error')
    })

    it('should handle API error responses', async () => {
      const error = {
        detail: 'Validation error',
        type: 'validation_error'
      }
      const { UsersApi } = await import('../../generated')
      vi.mocked(UsersApi.createUser).mockRejectedValue(error)

      await expect(adminService.createUser({})).rejects.toEqual(error)
    })
  })
})
