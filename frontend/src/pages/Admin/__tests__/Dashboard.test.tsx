import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import AdminDashboard from '../Dashboard'
import { dashboardService } from '../../../services/dashboardService'
import reportsService from '../../../services/reportsService'

vi.mock('../../../services/dashboardService', () => ({
  dashboardService: {
    getDashboardData: vi.fn(),
    getAlertThresholds: vi.fn(),
    saveAlertThresholds: vi.fn(),
    listSites: vi.fn(),
    formatDate: vi.fn((date: string) => new Date(date).toLocaleString('fr-FR')),
    calculateSessionDuration: vi.fn((session: any) => {
      if (session.status === 'open') return '2h 30m'
      return '1h 45m'
    }),
  },
}))

vi.mock('../../../services/reportsService', () => ({
  default: {
    listCashSessionReports: vi.fn(),
  },
}))

const mockDashboardData = {
  stats: {
    totalSessions: 10,
    openSessions: 3,
    closedSessions: 7,
    totalSales: 1500,
    totalItems: 25,
    averageSessionDuration: 4,
  },
  cashSessions: [
    {
      id: 'session-1',
      operator_id: 'user-1',
      site_id: 'site-1',
      status: 'open',
      initial_amount: 100,
      total_sales: 250,
      total_items: 5,
      opened_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 'session-2',
      operator_id: 'user-2',
      site_id: 'site-1',
      status: 'closed',
      initial_amount: 100,
      total_sales: 300,
      total_items: 8,
      opened_at: '2024-01-15T09:00:00Z',
      closed_at: '2024-01-15T17:00:00Z',
    },
  ],
  users: [
    { id: 'user-1', full_name: 'John Doe', username: 'john' },
    { id: 'user-2', full_name: 'Jane Smith', username: 'jane' },
  ],
}

const mockAlertThresholds = {
  cashDiscrepancy: 10,
  lowInventory: 5,
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(dashboardService.getDashboardData as any).mockResolvedValue(mockDashboardData)
    ;(dashboardService.getAlertThresholds as any).mockResolvedValue(mockAlertThresholds)
    ;(dashboardService.saveAlertThresholds as any).mockResolvedValue(mockAlertThresholds)
    ;(dashboardService.listSites as any).mockResolvedValue([])
    ;(reportsService.listCashSessionReports as any).mockResolvedValue({ reports: [] })
  })

  it('affiche un loader de chargement initial', () => {
    ;(dashboardService.getDashboardData as any).mockImplementation(() => new Promise(() => {}))

    render(<AdminDashboard />)

    expect(screen.getByText('Chargement...')).toBeInTheDocument()
  })

  it('affiche les données du dashboard une fois chargées', async () => {
    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard Administrateur')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText(/1.*500/)).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument()
    })
  })

  it("affiche l'historique des sessions", async () => {
    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Historique des Sessions de Caisse')).toBeInTheDocument()
      expect(screen.getAllByText(/session-/)).toHaveLength(2)
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  it('affiche les sessions avec le bon statut', async () => {
    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Ouverte')).toBeInTheDocument()
      expect(screen.getByText('Fermée')).toBeInTheDocument()
    })
  })

  it('ouvre le modal de configuration des seuils', async () => {
    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('?? Configuration')).toBeInTheDocument()
    })

    const configButton = screen.getByText('?? Configuration')
    fireEvent.click(configButton)

    expect(screen.getByText("Configuration des seuils d'alerte")).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
  })

  it("permet de mettre à jour les seuils d'alerte", async () => {
    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('?? Configuration')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('?? Configuration'))

    const cashInput = screen.getByDisplayValue('10') as HTMLInputElement
    fireEvent.change(cashInput, { target: { value: '15' } })

    const saveButton = screen.getByText('Sauvegarder')
    fireEvent.click(saveButton)

    expect(dashboardService.saveAlertThresholds).toHaveBeenCalledWith(
      {
        cashDiscrepancy: 15,
        lowInventory: 5,
      },
      undefined,
    )
  })

  it("affiche une erreur en cas d'échec du chargement", async () => {
    ;(dashboardService.getDashboardData as any).mockRejectedValue(new Error('Erreur de chargement'))

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des données du dashboard')).toBeInTheDocument()
      expect(screen.getByText('Réessayer')).toBeInTheDocument()
    })
  })

  it('permet de rafraîchir les données', async () => {
    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('?? Actualiser')).toBeInTheDocument()
    })

    const refreshButton = screen.getByText('?? Actualiser')
    fireEvent.click(refreshButton)

    expect(dashboardService.getDashboardData).toHaveBeenCalledTimes(2)
  })
})
