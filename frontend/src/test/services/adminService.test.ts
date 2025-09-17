import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { adminService, AdminUser, UserRole, UserStatus } from '../../services/adminService'
import { UsersApi, AdminApi } from '../../generated/api'

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
vi.mock('../../generated/api', () => ({
  UsersApi: {
    usersapiv1usersget: vi.fn(),
    userapiv1usersuseridget: vi.fn(),
    userapiv1userspost: vi.fn(),
    userapiv1usersuseridput: vi.fn(),
    userapiv1usersuseriddelete: vi.fn(),
    userstatusapiv1usersuseridstatusput: vi.fn()
  },
  AdminApi: {
    userroleapiv1adminusersuseridroleput: vi.fn(),
    pendingusersapiv1adminuserspendingget: vi.fn(),
    userapiv1adminusersuseridapprovepost: vi.fn(),
    userapiv1adminusersuseridrejectpost: vi.fn()
  }
}))

// Mock des types générés
vi.mock('../../generated/types', () => ({
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
  }
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

      const { UsersApi } = await import('../../generated/api')
      vi.mocked(UsersApi.usersapiv1usersget).mockResolvedValue(mockUsers)

      const result = await adminService.getUsers()

      expect(UsersApi.usersapiv1usersget).toHaveBeenCalledWith({})
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        id: '1',
        telegram_id: 123456789, // Should be converted to number
        username: 'john_doe',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.USER,
        status: UserStatus.APPROVED,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
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

      const { UsersApi } = await import('../../generated/api')
      vi.mocked(UsersApi.usersapiv1usersget).mockResolvedValue(mockUsers)

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

      const { UsersApi } = await import('../../generated/api')
      vi.mocked(UsersApi.usersapiv1usersget).mockResolvedValue(mockUsers)

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

      const mockResponse = {
        data: {
          id: '1',
          telegram_id: 123456789,
          username: 'john_doe',
          first_name: 'John',
          last_name: 'Doe',
          role: UserRole.ADMIN,
          status: UserStatus.APPROVED,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          full_name: 'John Doe',
          email: undefined,
          site_id: undefined
        },
        message: 'Rôle mis à jour avec succès',
        success: true
      }

      const { AdminApi } = await import('../../generated/api')
      vi.mocked(AdminApi.userroleapiv1adminusersuseridroleput).mockResolvedValue(mockResponse)

      const result = await adminService.updateUserRole('1', { role: UserRole.ADMIN })

      expect(AdminApi.userroleapiv1adminusersuseridroleput).toHaveBeenCalledWith('1', { role: UserRole.ADMIN })
      expect(result).toEqual(mockResponse)
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

      const { UsersApi } = await import('../../generated/api')
      vi.mocked(UsersApi.userapiv1usersuseridget).mockResolvedValue(mockUser)

      const result = await adminService.getUserById('1')

      expect(UsersApi.userapiv1usersuseridget).toHaveBeenCalledWith('1')
      expect(result).toMatchObject({
        id: '1',
        telegram_id: 123456789, // Should be converted to number
        username: 'john_doe',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.USER,
        status: UserStatus.APPROVED,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
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

      const { UsersApi } = await import('../../generated/api')
      vi.mocked(UsersApi.userapiv1userspost).mockResolvedValue(mockCreatedUser)

      const result = await adminService.createUser(userData)

      expect(UsersApi.userapiv1userspost).toHaveBeenCalledWith(userData)
      expect(result).toMatchObject({
        data: {
          id: '1',
          telegram_id: 123456789, // Should be converted to number
          username: 'john_doe',
          first_name: 'John',
          last_name: 'Doe',
          role: UserRole.USER,
          status: UserStatus.PENDING,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
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

      // Mock the generated API
      vi.mocked(UsersApi.userapiv1usersuseridput).mockResolvedValue(mockUpdatedUser)

      const result = await adminService.updateUser('1', userData)

      expect(UsersApi.userapiv1usersuseridput).toHaveBeenCalledWith('1', userData)
      expect(result).toMatchObject({
        data: {
          ...mockUpdatedUser,
          telegram_id: 123456789, // Converted from string to number
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
      // Mock the generated API
      vi.mocked(UsersApi.userapiv1usersuseriddelete).mockResolvedValue({})

      const result = await adminService.deleteUser('1')

      expect(UsersApi.userapiv1usersuseriddelete).toHaveBeenCalledWith('1')
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
      const { UsersApi } = await import('../../generated/api')
      vi.mocked(UsersApi.usersapiv1usersget).mockRejectedValue(error)

      await expect(adminService.getUsers()).rejects.toThrow('API Error')
    })

    it('should handle API error responses', async () => {
      const error = {
        detail: 'Validation error',
        type: 'validation_error'
      }
      const { UsersApi } = await import('../../generated/api')
      vi.mocked(UsersApi.userapiv1userspost).mockRejectedValue(error)

      await expect(adminService.createUser({})).rejects.toEqual(error)
    })
  })
})
