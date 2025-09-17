import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@test/test-utils'
import { UserListTable } from '../../../components/business/UserListTable'
import { AdminUser, UserRole, UserStatus } from '../../../services/adminService'

// Les mocks sont centralisés dans setup.ts

describe('UserListTable Component', () => {
  const mockUsers: AdminUser[] = [
    {
      id: '1',
      username: 'john_doe',
      telegram_id: '123456789',
      first_name: 'John',
      last_name: 'Doe',
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '+33123456789',
      role: UserRole.USER,
      status: UserStatus.APPROVED,
      site_id: '1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      username: 'jane_smith',
      telegram_id: '987654321',
      first_name: 'Jane',
      last_name: 'Smith',
      full_name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+33987654321',
      role: UserRole.ADMIN,
      status: UserStatus.PENDING,
      site_id: '1',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    }
  ]

  const defaultProps = {
    users: mockUsers,
    onRoleChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render table with users', () => {
    render(<UserListTable {...defaultProps} />)

    expect(screen.getByTestId('table')).toBeInTheDocument()
    expect(screen.getByText('Nom')).toBeInTheDocument()
    expect(screen.getByText('Rôle')).toBeInTheDocument()
    expect(screen.getByText('Statut')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('should render user rows with correct data', () => {
    render(<UserListTable {...defaultProps} />)
    
    // Vérifier les noms d'utilisateurs
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('@john_doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('@jane_smith')).toBeInTheDocument()
  })

  it('should render role selectors for each user', () => {
    render(<UserListTable {...defaultProps} />)
    
    expect(screen.getAllByTestId('role-selector-button')).toHaveLength(2)
  })

  it('should render status badges with correct colors', () => {
    render(<UserListTable {...defaultProps} />)
    
    expect(screen.getByText('Approuvé')).toBeInTheDocument()
    expect(screen.getByText('En attente')).toBeInTheDocument()
  })

  it('should render action buttons when callbacks provided', () => {
    const props = {
      ...defaultProps,
      onViewUser: vi.fn(),
      onEditUser: vi.fn(),
      onDeleteUser: vi.fn()
    }

    render(<UserListTable {...props} />)

    expect(screen.getAllByTestId('view-user-button')).toHaveLength(2)
    expect(screen.getAllByTestId('edit-user-button')).toHaveLength(2)
    expect(screen.getAllByTestId('delete-user-button')).toHaveLength(2)
  })

  it('should not render action buttons when callbacks not provided', () => {
    render(<UserListTable {...defaultProps} />)
    
    expect(screen.queryByTestId('view-user-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('edit-user-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('delete-user-button')).not.toBeInTheDocument()
  })

  it('should call onViewUser when view button clicked', () => {
    const onViewUser = vi.fn()
    const props = { ...defaultProps, onViewUser }
    
    render(<UserListTable {...props} />)

    fireEvent.click(screen.getAllByTestId('view-user-button')[0])

    expect(onViewUser).toHaveBeenCalledWith(mockUsers[0])
  })

  it('should call onEditUser when edit button clicked', () => {
    const onEditUser = vi.fn()
    const props = { ...defaultProps, onEditUser }
    
    render(<UserListTable {...props} />)

    fireEvent.click(screen.getAllByTestId('edit-user-button')[0])

    expect(onEditUser).toHaveBeenCalledWith(mockUsers[0])
  })

  it('should call onDeleteUser when delete button clicked', () => {
    const onDeleteUser = vi.fn()
    const props = { ...defaultProps, onDeleteUser }
    
    render(<UserListTable {...props} />)

    fireEvent.click(screen.getAllByTestId('delete-user-button')[0])

    expect(onDeleteUser).toHaveBeenCalledWith(mockUsers[0])
  })

  it('should show loading skeleton when loading is true', () => {
    render(<UserListTable {...defaultProps} loading={true} />)
    
    expect(screen.getAllByTestId('skeleton')).toHaveLength(20) // 5 rows × 4 columns
    expect(screen.queryByTestId('user-list-table')).not.toBeInTheDocument()
  })

  it('should show empty state when no users', () => {
    render(<UserListTable {...defaultProps} users={[]} />)
    
    expect(screen.getByText('Aucun utilisateur trouvé')).toBeInTheDocument()
    expect(screen.queryByTestId('user-list-table')).not.toBeInTheDocument()
  })

  it('should handle users with missing names gracefully', () => {
    const usersWithMissingNames: AdminUser[] = [
      {
        id: '3',
        username: 'test_user',
        telegram_id: '111111111',
        first_name: '',
        last_name: '',
        full_name: '',
        email: 'test@example.com',
        phone: '+33111111111',
        role: UserRole.USER,
        status: UserStatus.APPROVED,
        site_id: '1',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z'
      }
    ]
    
    render(<UserListTable {...defaultProps} users={usersWithMissingNames} />)
    
    expect(screen.getByText('Utilisateur')).toBeInTheDocument()
    expect(screen.getByText('@test_user')).toBeInTheDocument()
  })

  it('should handle users with only username', () => {
    const usersWithUsernameOnly: AdminUser[] = [
      {
        id: '4',
        username: 'username_only',
        telegram_id: '222222222',
        first_name: '',
        last_name: '',
        full_name: '',
        email: '',
        phone: '',
        role: UserRole.USER,
        status: UserStatus.APPROVED,
        site_id: '1',
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z'
      }
    ]
    
    render(<UserListTable {...defaultProps} users={usersWithUsernameOnly} />)
    
    expect(screen.getByText('Utilisateur')).toBeInTheDocument()
    expect(screen.getByText('@username_only')).toBeInTheDocument()
  })

  it('should handle users with only telegram_id', () => {
    const usersWithTelegramOnly: AdminUser[] = [
      {
        id: '5',
        username: '',
        telegram_id: '333333333',
        first_name: '',
        last_name: '',
        full_name: '',
        email: '',
        phone: '',
        role: UserRole.USER,
        status: UserStatus.APPROVED,
        site_id: '1',
        created_at: '2024-01-05T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z'
      }
    ]
    
    render(<UserListTable {...defaultProps} users={usersWithTelegramOnly} />)
    
    expect(screen.getByText('Utilisateur')).toBeInTheDocument()
    expect(screen.getByText('@333333333')).toBeInTheDocument()
  })

  it('should render correct status labels for all statuses', () => {
    const allStatusUsers: AdminUser[] = [
      { ...mockUsers[0], status: UserStatus.APPROVED },
      { ...mockUsers[0], id: '2', status: UserStatus.PENDING },
      { ...mockUsers[0], id: '3', status: UserStatus.REJECTED }
    ]
    
    render(<UserListTable {...defaultProps} users={allStatusUsers} />)
    
    expect(screen.getByText('Approuvé')).toBeInTheDocument()
    expect(screen.getByText('En attente')).toBeInTheDocument()
    expect(screen.getByText('Rejeté')).toBeInTheDocument()
  })

  it('should pass correct props to RoleSelector', () => {
    render(<UserListTable {...defaultProps} />)
    
    const roleSelectors = screen.getAllByTestId('role-selector-button')
    
    expect(roleSelectors).toHaveLength(2)
    expect(roleSelectors[0]).toBeInTheDocument()
    expect(roleSelectors[1]).toBeInTheDocument()
  })

  it('should handle role change through RoleSelector', () => {
    const onRoleChange = vi.fn()
    render(<UserListTable {...defaultProps} onRoleChange={onRoleChange} />)
    
    // Cliquer sur le premier RoleSelector
    const roleSelectors = screen.getAllByTestId('role-selector-button')
    fireEvent.click(roleSelectors[0])
    
    // Vérifier que la modal s'ouvre
    expect(screen.getByTestId('role-change-modal')).toBeInTheDocument()
  })
})
