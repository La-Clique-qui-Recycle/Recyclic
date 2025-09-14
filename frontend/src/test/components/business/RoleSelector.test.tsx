import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@test/test-utils'
import { RoleSelector } from '../../../components/business/RoleSelector'
import { UserRole } from '../../../services/adminService'

// Mock des notifications Mantine
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn()
  }
}))

describe('RoleSelector Component', () => {
  const mockOnRoleChange = vi.fn()
  const defaultProps = {
    currentRole: UserRole.USER,
    userId: 'user-123',
    userName: 'John Doe',
    onRoleChange: mockOnRoleChange
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render current role as button', () => {
    render(<RoleSelector {...defaultProps} />)
    
    expect(screen.getByTestId('role-selector-button')).toBeInTheDocument()
    expect(screen.getByText('Utilisateur')).toBeInTheDocument()
  })

  it('should render role icon in button', () => {
    render(<RoleSelector {...defaultProps} />)
    
    expect(screen.getByTestId('icon-user')).toBeInTheDocument()
  })

  it('should open modal when button clicked', () => {
    render(<RoleSelector {...defaultProps} />)
    
    fireEvent.click(screen.getByTestId('role-selector-button'))
    
    expect(screen.getByTestId('role-change-modal')).toBeInTheDocument()
    expect(screen.getByText('Modifier le rôle')).toBeInTheDocument()
  })

  it('should display user name in modal', () => {
    render(<RoleSelector {...defaultProps} />)
    
    fireEvent.click(screen.getByTestId('role-selector-button'))
    
    expect(screen.getByText('Modifier le rôle de John Doe')).toBeInTheDocument()
  })

  it('should render all role options in select', () => {
    render(<RoleSelector {...defaultProps} />)
    
    fireEvent.click(screen.getByTestId('role-selector-button'))
    
    const select = screen.getByTestId('role-select')
    expect(select).toBeInTheDocument()
    
    // Vérifier que les options sont présentes
    fireEvent.click(select)
    
    expect(screen.getByText('Utilisateur')).toBeInTheDocument()
    expect(screen.getByText('Caissier')).toBeInTheDocument()
    expect(screen.getByText('Manager')).toBeInTheDocument()
    expect(screen.getByText('Administrateur')).toBeInTheDocument()
    expect(screen.getByText('Super Admin')).toBeInTheDocument()
  })

  it('should call onRoleChange when role is changed and confirmed', async () => {
    mockOnRoleChange.mockResolvedValue(true)
    render(<RoleSelector {...defaultProps} />)
    
    // Ouvrir la modal
    fireEvent.click(screen.getByTestId('role-selector-button'))
    
    // Changer le rôle
    const select = screen.getByTestId('role-select')
    fireEvent.change(select, { target: { value: UserRole.ADMIN } })
    
    // Confirmer
    fireEvent.click(screen.getByTestId('confirm-role-change'))
    
    await waitFor(() => {
      expect(mockOnRoleChange).toHaveBeenCalledWith('user-123', UserRole.ADMIN)
    })
  })

  it('should show success notification on successful role change', async () => {
    const { notifications } = await import('@mantine/notifications')
    mockOnRoleChange.mockResolvedValue(true)
    render(<RoleSelector {...defaultProps} />)
    
    // Ouvrir la modal et changer le rôle
    fireEvent.click(screen.getByTestId('role-selector-button'))
    const select = screen.getByTestId('role-select')
    fireEvent.change(select, { target: { value: UserRole.ADMIN } })
    fireEvent.click(screen.getByTestId('confirm-role-change'))
    
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith({
        title: 'Succès',
        message: 'Rôle de John Doe mis à jour vers Administrateur',
        color: 'green'
      })
    })
  })

  it('should show error notification on failed role change', async () => {
    const { notifications } = await import('@mantine/notifications')
    mockOnRoleChange.mockResolvedValue(false)
    render(<RoleSelector {...defaultProps} />)
    
    // Ouvrir la modal et changer le rôle
    fireEvent.click(screen.getByTestId('role-selector-button'))
    const select = screen.getByTestId('role-select')
    fireEvent.change(select, { target: { value: UserRole.ADMIN } })
    fireEvent.click(screen.getByTestId('confirm-role-change'))
    
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith({
        title: 'Erreur',
        message: 'Impossible de mettre à jour le rôle',
        color: 'red'
      })
    })
  })

  it('should show error notification on exception', async () => {
    const { notifications } = await import('@mantine/notifications')
    mockOnRoleChange.mockRejectedValue(new Error('Network error'))
    render(<RoleSelector {...defaultProps} />)
    
    // Ouvrir la modal et changer le rôle
    fireEvent.click(screen.getByTestId('role-selector-button'))
    const select = screen.getByTestId('role-select')
    fireEvent.change(select, { target: { value: UserRole.ADMIN } })
    fireEvent.click(screen.getByTestId('confirm-role-change'))
    
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith({
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la mise à jour',
        color: 'red'
      })
    })
  })

  it('should close modal on cancel', () => {
    render(<RoleSelector {...defaultProps} />)
    
    // Ouvrir la modal
    fireEvent.click(screen.getByTestId('role-selector-button'))
    expect(screen.getByTestId('role-change-modal')).toBeInTheDocument()
    
    // Annuler
    fireEvent.click(screen.getByTestId('cancel-role-change'))
    
    expect(screen.queryByTestId('role-change-modal')).not.toBeInTheDocument()
  })

  it('should not call onRoleChange when same role selected', async () => {
    render(<RoleSelector {...defaultProps} />)
    
    // Ouvrir la modal
    fireEvent.click(screen.getByTestId('role-selector-button'))
    
    // Sélectionner le même rôle
    const select = screen.getByTestId('role-select')
    fireEvent.change(select, { target: { value: UserRole.USER } })
    
    // Confirmer
    fireEvent.click(screen.getByTestId('confirm-role-change'))
    
    await waitFor(() => {
      expect(mockOnRoleChange).not.toHaveBeenCalled()
    })
  })

  it('should be disabled when disabled prop is true', () => {
    render(<RoleSelector {...defaultProps} disabled={true} />)
    
    const button = screen.getByTestId('role-selector-button')
    expect(button).toBeDisabled()
  })

  it('should show loading state during role change', async () => {
    mockOnRoleChange.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    render(<RoleSelector {...defaultProps} />)
    
    // Ouvrir la modal et changer le rôle
    fireEvent.click(screen.getByTestId('role-selector-button'))
    const select = screen.getByTestId('role-select')
    fireEvent.change(select, { target: { value: UserRole.ADMIN } })
    fireEvent.click(screen.getByTestId('confirm-role-change'))
    
    // Vérifier l'état de chargement
    expect(screen.getByTestId('confirm-role-change')).toBeDisabled()
    expect(screen.getByTestId('cancel-role-change')).toBeDisabled()
  })

  it('should render correct role icons', () => {
    const roles = [
      { role: UserRole.USER, icon: 'icon-user' },
      { role: UserRole.CASHIER, icon: 'icon-cash' },
      { role: UserRole.MANAGER, icon: 'icon-settings' },
      { role: UserRole.ADMIN, icon: 'icon-shield' },
      { role: UserRole.SUPER_ADMIN, icon: 'icon-shield' }
    ]

    roles.forEach(({ role, icon }) => {
      const { unmount } = render(<RoleSelector {...defaultProps} currentRole={role} />)
      expect(screen.getByTestId(icon)).toBeInTheDocument()
      unmount()
    })
  })

  it('should handle different user roles correctly', () => {
    const testCases = [
      { role: UserRole.USER, expectedLabel: 'Utilisateur' },
      { role: UserRole.CASHIER, expectedLabel: 'Caissier' },
      { role: UserRole.MANAGER, expectedLabel: 'Manager' },
      { role: UserRole.ADMIN, expectedLabel: 'Administrateur' },
      { role: UserRole.SUPER_ADMIN, expectedLabel: 'Super Admin' }
    ]

    testCases.forEach(({ role, expectedLabel }) => {
      const { unmount } = render(<RoleSelector {...defaultProps} currentRole={role} />)
      expect(screen.getByText(expectedLabel)).toBeInTheDocument()
      unmount()
    })
  })
})