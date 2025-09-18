import { describe, it, expect, vi } from 'vitest'
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

describe('Header Component', () => {
  beforeEach(() => {
    mockUseLocation.mockReturnValue({ pathname: '/' })
  })

  it('should render the logo with recycle icon', () => {
    render(<Header />)
    
    expect(screen.getByText('Recyclic')).toBeInTheDocument()
    expect(screen.getByTestId('recycle-icon')).toBeInTheDocument()
  })

  it('should render all navigation links', () => {
    render(<Header />)
    
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument()
    expect(screen.getByText('Caisse')).toBeInTheDocument()
    expect(screen.getByText('Dépôts')).toBeInTheDocument()
    expect(screen.getByText('Rapports')).toBeInTheDocument()
  })

  it('should render navigation icons', () => {
    render(<Header />)
    
    expect(screen.getByTestId('home-icon')).toBeInTheDocument()
    expect(screen.getByTestId('calculator-icon')).toBeInTheDocument()
    expect(screen.getByTestId('package-icon')).toBeInTheDocument()
    expect(screen.getByTestId('barchart-icon')).toBeInTheDocument()
  })

  it('should have correct href attributes for navigation links', () => {
    render(<Header />)
    
    const dashboardLink = screen.getByRole('link', { name: /tableau de bord/i })
    const cashLink = screen.getByRole('link', { name: /caisse/i })
    const depositsLink = screen.getByRole('link', { name: /dépôts/i })
    const reportsLink = screen.getByRole('link', { name: /rapports/i })
    
    expect(dashboardLink).toHaveAttribute('href', '/')
    expect(cashLink).toHaveAttribute('href', '/caisse')
    expect(depositsLink).toHaveAttribute('href', '/depots')
    expect(reportsLink).toHaveAttribute('href', '/rapports')
  })

  it('should highlight active navigation link', () => {
    render(<Header />)
    
    const dashboardLink = screen.getByRole('link', { name: /tableau de bord|dashboard/i })
    const isActive = dashboardLink.getAttribute('data-active') === 'true' || dashboardLink.getAttribute('aria-current') === 'page'
    expect(isActive).toBe(true)
  })

  it('should not highlight inactive navigation links', () => {
    render(<Header />)
    
    const depositsLink = screen.getByRole('link', { name: /dépôts|deposits/i })
    const cashLink = screen.getByRole('link', { name: /caisse|cash/i })
    const reportsLink = screen.getByRole('link', { name: /rapports|reports/i })
    
    const isDepositsActive = depositsLink.getAttribute('data-active') === 'true' || depositsLink.getAttribute('aria-current') === 'page'
    const isCashActive = cashLink.getAttribute('data-active') === 'true' || cashLink.getAttribute('aria-current') === 'page'
    const isReportsActive = reportsLink.getAttribute('data-active') === 'true' || reportsLink.getAttribute('aria-current') === 'page'

    expect(isDepositsActive).toBe(false)
    expect(isCashActive).toBe(false)
    expect(isReportsActive).toBe(false)
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
