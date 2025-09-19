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
  isAdmin: vi.fn(() => false),
  isCashier: vi.fn(() => false),
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
    mockAuthStore.isAdmin.mockReturnValue(false)
    mockAuthStore.isCashier.mockReturnValue(false)
    mockAuthStore.logout.mockClear()
  })

  it('should render the logo with recycle icon', () => {
    render(<Header />)
    
    expect(screen.getByText('Recyclic')).toBeInTheDocument()
    // Note: The Recycle icon doesn't have a test-id, so we check for the text
  })

  it('should render basic navigation links for unauthenticated users', () => {
    render(<Header />)
    
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument()
    expect(screen.getByText('Dépôts')).toBeInTheDocument()
    expect(screen.getByText('Rapports')).toBeInTheDocument()
    
    // These should NOT be visible for unauthenticated users
    expect(screen.queryByText('Caisse')).not.toBeInTheDocument()
    expect(screen.queryByText('Administration')).not.toBeInTheDocument()
  })

  it('should render cashier navigation for cashier users', () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.isCashier.mockReturnValue(true)
    
    render(<Header />)
    
    expect(screen.getByText('Caisse')).toBeInTheDocument()
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument()
    expect(screen.getByText('Dépôts')).toBeInTheDocument()
    expect(screen.getByText('Rapports')).toBeInTheDocument()
  })

  it('should render admin navigation for admin users', () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.isAdmin.mockReturnValue(true)
    mockAuthStore.isCashier.mockReturnValue(true) // Admins are also cashiers
    
    render(<Header />)
    
    expect(screen.getByText('Administration')).toBeInTheDocument()
    expect(screen.getByText('Caisse')).toBeInTheDocument()
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument()
  })

  it('should show logout button for authenticated users', () => {
    mockAuthStore.isAuthenticated = true
    
    render(<Header />)
    
    expect(screen.getByText('Déconnexion')).toBeInTheDocument()
  })

  it('should not show logout button for unauthenticated users', () => {
    mockAuthStore.isAuthenticated = false
    
    render(<Header />)
    
    expect(screen.queryByText('Déconnexion')).not.toBeInTheDocument()
  })

  it('should have correct href attributes for navigation links', () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.isCashier.mockReturnValue(true)
    mockAuthStore.isAdmin.mockReturnValue(true)
    
    render(<Header />)
    
    const dashboardLink = screen.getByRole('link', { name: /tableau de bord/i })
    const cashLink = screen.getByRole('link', { name: /caisse/i })
    const depositsLink = screen.getByRole('link', { name: /dépôts/i })
    const reportsLink = screen.getByRole('link', { name: /rapports/i })
    const adminLink = screen.getByRole('link', { name: /administration/i })
    
    expect(dashboardLink).toHaveAttribute('href', '/')
    expect(cashLink).toHaveAttribute('href', '/caisse')
    expect(depositsLink).toHaveAttribute('href', '/depots')
    expect(reportsLink).toHaveAttribute('href', '/rapports')
    expect(adminLink).toHaveAttribute('href', '/admin/users')
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

