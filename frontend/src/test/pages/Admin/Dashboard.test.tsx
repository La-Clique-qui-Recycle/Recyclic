import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import AdminDashboard from '../../../pages/Admin/Dashboard'

// Mock de react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock du service dashboard
const mockDashboardService = {
  getDashboardData: vi.fn(),
  listSites: vi.fn(),
  getAlertThresholds: vi.fn(),
  saveAlertThresholds: vi.fn(),
  calculateSessionDuration: vi.fn(),
  formatDate: vi.fn(),
  buildUserLookup: vi.fn(),
}

vi.mock('../../../services/dashboardService', () => ({
  dashboardService: mockDashboardService,
}))

// Mock du service reports
const mockReportsService = {
  listCashSessionReports: vi.fn(),
}

vi.mock('../../../services/reportsService', () => ({
  default: mockReportsService,
}))

const mockDashboardData = {
  stats: {
    totalSessions: 10,
    openSessions: 2,
    closedSessions: 8,
    totalSales: 1500.0,
    totalItems: 45,
    averageSessionDuration: 4.5,
  },
  sessions: [
    {
      id: 'session-1',
      siteId: 'site-1',
      operator: 'Jean Dupont',
      status: 'open',
      initialAmount: 50.0,
      totalSales: 25.0,
      totalItems: 3,
      openedAt: '2025-01-27T10:30:00Z',
      closedAt: null,
    },
    {
      id: 'session-2',
      siteId: 'site-1',
      operator: 'Marie Martin',
      status: 'closed',
      initialAmount: 100.0,
      totalSales: 75.0,
      totalItems: 5,
      openedAt: '2025-01-26T09:00:00Z',
      closedAt: '2025-01-26T17:00:00Z',
    },
  ],
  reports: [],
}

const mockSites = [
  { id: 'site-1', name: 'Site Principal' },
  { id: 'site-2', name: 'Site Secondaire' },
]

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('AdminDashboard - Filtres', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDashboardService.getDashboardData.mockResolvedValue(mockDashboardData)
    mockDashboardService.listSites.mockResolvedValue(mockSites)
    mockDashboardService.getAlertThresholds.mockResolvedValue({
      cashDiscrepancy: 10,
      lowInventory: 5,
    })
    mockReportsService.listCashSessionReports.mockResolvedValue({ reports: [] })
    mockDashboardService.calculateSessionDuration.mockReturnValue('2h 30m')
    mockDashboardService.formatDate.mockReturnValue('27/01/2025 10:30')
    mockDashboardService.buildUserLookup.mockReturnValue({})
  })

  it('should render all filter controls', async () => {
    renderWithRouter(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard Administrateur')).toBeInTheDocument()
    })
    
    // Vérifier la présence des filtres
    expect(screen.getByDisplayValue('all')).toBeInTheDocument() // Site filter
    expect(screen.getByPlaceholderText('Date de début')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Date de fin')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ID opérateur')).toBeInTheDocument()
  })

  it('should update site filter and reload data', async () => {
    renderWithRouter(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard Administrateur')).toBeInTheDocument()
    })
    
    const siteSelect = screen.getByDisplayValue('all')
    fireEvent.change(siteSelect, { target: { value: 'site-1' } })
    
    await waitFor(() => {
      expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith({
        siteId: 'site-1',
        dateFrom: undefined,
        dateTo: undefined,
        operatorId: undefined,
      })
    })
  })

  it('should update date filters and reload data', async () => {
    renderWithRouter(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard Administrateur')).toBeInTheDocument()
    })
    
    const dateFromInput = screen.getByPlaceholderText('Date de début')
    const dateToInput = screen.getByPlaceholderText('Date de fin')
    
    fireEvent.change(dateFromInput, { target: { value: '2025-01-01' } })
    fireEvent.change(dateToInput, { target: { value: '2025-01-31' } })
    
    await waitFor(() => {
      expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith({
        siteId: undefined,
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
        operatorId: undefined,
      })
    })
  })

  it('should update operator filter and reload data', async () => {
    renderWithRouter(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard Administrateur')).toBeInTheDocument()
    })
    
    const operatorInput = screen.getByPlaceholderText('ID opérateur')
    fireEvent.change(operatorInput, { target: { value: 'operator-123' } })
    
    await waitFor(() => {
      expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith({
        siteId: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        operatorId: 'operator-123',
      })
    })
  })

  it('should combine multiple filters', async () => {
    renderWithRouter(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard Administrateur')).toBeInTheDocument()
    })
    
    // Appliquer plusieurs filtres
    const siteSelect = screen.getByDisplayValue('all')
    const dateFromInput = screen.getByPlaceholderText('Date de début')
    const operatorInput = screen.getByPlaceholderText('ID opérateur')
    
    fireEvent.change(siteSelect, { target: { value: 'site-1' } })
    fireEvent.change(dateFromInput, { target: { value: '2025-01-01' } })
    fireEvent.change(operatorInput, { target: { value: 'operator-123' } })
    
    await waitFor(() => {
      expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith({
        siteId: 'site-1',
        dateFrom: '2025-01-01',
        dateTo: undefined,
        operatorId: 'operator-123',
      })
    })
  })

  it('should clear filters when reset', async () => {
    renderWithRouter(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard Administrateur')).toBeInTheDocument()
    })
    
    // Appliquer des filtres
    const siteSelect = screen.getByDisplayValue('all')
    const dateFromInput = screen.getByPlaceholderText('Date de début')
    
    fireEvent.change(siteSelect, { target: { value: 'site-1' } })
    fireEvent.change(dateFromInput, { target: { value: '2025-01-01' } })
    
    // Réinitialiser
    fireEvent.change(siteSelect, { target: { value: 'all' } })
    fireEvent.change(dateFromInput, { target: { value: '' } })
    
    await waitFor(() => {
      expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith({
        siteId: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        operatorId: undefined,
      })
    })
  })

  it('should handle filter errors gracefully', async () => {
    mockDashboardService.getDashboardData.mockRejectedValueOnce(new Error('Filter error'))
    
    renderWithRouter(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des données du dashboard')).toBeInTheDocument()
    })
  })

  it('should maintain filter state during refresh', async () => {
    renderWithRouter(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard Administrateur')).toBeInTheDocument()
    })
    
    // Appliquer un filtre
    const siteSelect = screen.getByDisplayValue('all')
    fireEvent.change(siteSelect, { target: { value: 'site-1' } })
    
    // Cliquer sur actualiser
    const refreshButton = screen.getByText('🔄 Actualiser')
    fireEvent.click(refreshButton)
    
    await waitFor(() => {
      // Vérifier que les filtres sont maintenus
      expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith({
        siteId: 'site-1',
        dateFrom: undefined,
        dateTo: undefined,
        operatorId: undefined,
      })
    })
  })
})
