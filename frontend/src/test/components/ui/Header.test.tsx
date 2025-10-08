import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../../test-utils'
import Header from '../../../components/Header'
import { MemoryRouter } from 'react-router-dom'

// Mock useLocation hook
const mockUseLocation = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useLocation: () => ({ pathname: '/' }),
  }
})

// Mock authStore
const mockAuthStore = {
  isAuthenticated: false,
  currentUser: null,
  isAdmin: vi.fn(() => false),
  hasCashAccess: vi.fn(() => false),
  logout: vi.fn()
}

vi.mock('../../../stores/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockAuthStore)
    }
    return mockAuthStore
  })
}))

describe('Header Component', () => {
  beforeEach(() => {
    mockUseLocation.mockReturnValue({ pathname: '/' })
    // Reset mocks
    mockAuthStore.isAuthenticated = false
    mockAuthStore.currentUser = null
    mockAuthStore.isAdmin.mockReturnValue(false)
    mockAuthStore.hasCashAccess.mockReturnValue(false)
    mockAuthStore.logout.mockClear()
  })

  it('should render the logo with recycle icon', () => {
    render(<Header />)
    
    expect(screen.getByText('Recyclic')).toBeInTheDocument()
    // Note: The Recycle icon doesn't have a test-id, so we check for the text
  })

  it('should render minimal navigation for unauthenticated users', () => {
    render(<Header />)

    // Only "Tableau de bord" should be visible for unauthenticated users
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument()
    
    // These should NOT be visible for unauthenticated users
    expect(screen.queryByText('Réception')).not.toBeInTheDocument()
    expect(screen.queryByText('Caisse')).not.toBeInTheDocument()
    expect(screen.queryByText('Administration')).not.toBeInTheDocument()
    expect(screen.queryByText('Journal de Caisse')).not.toBeInTheDocument()
    expect(screen.queryByText('Rapports')).not.toBeInTheDocument()
  })

  it('should render cash navigation for operator-capable users', () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.hasCashAccess.mockReturnValue(true)

    render(<Header />)

    expect(screen.getByText('Caisse')).toBeInTheDocument()
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument()
    expect(screen.getByText('Réception')).toBeInTheDocument()
    // Rapports removed from main menu - now in Administration
    expect(screen.queryByText('Rapports')).not.toBeInTheDocument()
  })

  it('should render admin navigation for admin users', () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.isAdmin.mockReturnValue(true)
    mockAuthStore.hasCashAccess.mockReturnValue(true) // Admins have cash access

    render(<Header />)

    expect(screen.getByText('Administration')).toBeInTheDocument()
    expect(screen.getByText('Caisse')).toBeInTheDocument()
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument()
    expect(screen.getByText('Réception')).toBeInTheDocument()
    // Rapports removed from main menu - now in Administration
    expect(screen.queryByText('Rapports')).not.toBeInTheDocument()
    
    // Journal de Caisse is now in Administration, not in main menu
    expect(screen.queryByText('Journal de Caisse')).not.toBeInTheDocument()
  })

  it('should show logout button and username for authenticated users', () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.currentUser = { username: 'testuser', first_name: 'Test', last_name: 'User' }
    
    render(<Header />)
    
    expect(screen.getByText('Déconnexion')).toBeInTheDocument()
    expect(screen.getByText('testuser')).toBeInTheDocument()
  })

  it('should not show logout button for unauthenticated users', () => {
    mockAuthStore.isAuthenticated = false
    
    render(<Header />)
    
    expect(screen.queryByText('Déconnexion')).not.toBeInTheDocument()
  })

  it('should have correct href attributes for navigation links', () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.hasCashAccess.mockReturnValue(true)
    mockAuthStore.isAdmin.mockReturnValue(true)

    render(<Header />)

    const dashboardLink = screen.getByRole('link', { name: /tableau de bord/i })
    const cashLink = screen.getByRole('link', { name: /^Calculator Caisse$/ })
    const receptionLink = screen.getByRole('link', { name: /réception/i })
    const adminLink = screen.getByRole('link', { name: /administration/i })

    expect(dashboardLink).toHaveAttribute('href', '/')
    expect(cashLink).toHaveAttribute('href', '/caisse')
    expect(receptionLink).toHaveAttribute('href', '/reception')
    expect(adminLink).toHaveAttribute('href', '/admin')
  })

  it('should call logout when logout button is clicked', () => {
    mockAuthStore.isAuthenticated = true
    
    render(<Header />)
    
    const logoutButton = screen.getByText('Déconnexion')
    logoutButton.click()
    
    expect(mockAuthStore.logout).toHaveBeenCalledTimes(1)
  })

  it('should have proper structure with header, nav, logo and nav links', () => {
    render(<Header />)
    
    const header = screen.getByRole('banner')
    const nav = screen.getByRole('navigation')
    const logo = screen.getByText('Recyclic')
    
    expect(header).toBeInTheDocument()
    expect(nav).toBeInTheDocument()
    expect(logo).toBeInTheDocument()
  })
})

