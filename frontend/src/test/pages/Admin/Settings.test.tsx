/**
 * Tests pour la page Settings (Story B26-P1)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Settings from '../../../pages/Admin/Settings'
import { UserRole } from '../../../generated'

// Mock des hooks
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

vi.mock('../../../services/adminService', () => ({
  adminService: {
    exportDatabase: vi.fn()
  }
}))

import { useAuth } from '../../../hooks/useAuth'

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render unauthorized message for non-super-admin users', () => {
    // Arrange
    vi.mocked(useAuth).mockReturnValue({
      user: { role: UserRole.ADMIN, id: '1', username: 'admin' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false
    } as any)

    // Act
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    )

    // Assert
    expect(screen.getByText('Accès Restreint')).toBeInTheDocument()
    expect(screen.getByText(/Seuls les Super-Administrateurs peuvent accéder/i)).toBeInTheDocument()
  })

  it('should render unauthorized message for regular users', () => {
    // Arrange
    vi.mocked(useAuth).mockReturnValue({
      user: { role: UserRole.USER, id: '1', username: 'user' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false
    } as any)

    // Act
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    )

    // Assert
    expect(screen.getByText('Accès Restreint')).toBeInTheDocument()
  })

  it('should render settings page for super-admin users', () => {
    // Arrange
    vi.mocked(useAuth).mockReturnValue({
      user: { role: UserRole.SUPER_ADMIN, id: '1', username: 'superadmin' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false
    } as any)

    // Act
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    )

    // Assert
    expect(screen.getByText(/⚙️ Paramètres/i)).toBeInTheDocument()
    expect(screen.getByText(/Configuration et outils de maintenance/i)).toBeInTheDocument()
  })

  it('should display database section with export button', () => {
    // Arrange
    vi.mocked(useAuth).mockReturnValue({
      user: { role: UserRole.SUPER_ADMIN, id: '1', username: 'superadmin' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false
    } as any)

    // Act
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    )

    // Assert
    expect(screen.getByText(/🗄️ Base de Données/i)).toBeInTheDocument()
    expect(screen.getByText(/Export de la base de données/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /💾 Exporter/i })).toBeInTheDocument()
  })

  it('should display purge placeholder button as disabled', () => {
    // Arrange
    vi.mocked(useAuth).mockReturnValue({
      user: { role: UserRole.SUPER_ADMIN, id: '1', username: 'superadmin' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false
    } as any)

    // Act
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    )

    // Assert
    expect(screen.getByText(/Purge des données transactionnelles/i)).toBeInTheDocument()
    const purgeButton = screen.getByRole('button', { name: /🚧 Bientôt disponible/i })
    expect(purgeButton).toBeDisabled()
  })

  it('should display warning message for database export', () => {
    // Arrange
    vi.mocked(useAuth).mockReturnValue({
      user: { role: UserRole.SUPER_ADMIN, id: '1', username: 'superadmin' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false
    } as any)

    // Act
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    )

    // Assert
    expect(screen.getByText(/⚠️ Attention :/i)).toBeInTheDocument()
    expect(screen.getByText(/L'export peut prendre plusieurs minutes/i)).toBeInTheDocument()
  })

  it('should display info message for purge placeholder', () => {
    // Arrange
    vi.mocked(useAuth).mockReturnValue({
      user: { role: UserRole.SUPER_ADMIN, id: '1', username: 'superadmin' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false
    } as any)

    // Act
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    )

    // Assert
    expect(screen.getByText(/ℹ️ Information :/i)).toBeInTheDocument()
    expect(screen.getByText(/Story B25-P1/i)).toBeInTheDocument()
  })
})
