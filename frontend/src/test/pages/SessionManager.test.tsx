import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import SessionManager from '../../pages/Admin/SessionManager'

vi.mock('../../api/axiosClient', () => {
  return {
    default: {
      get: vi.fn((url: string) => {
        if (url.includes('/v1/cash-sessions/stats/summary')) {
          return Promise.resolve({ data: {
            total_sessions: 1,
            open_sessions: 0,
            closed_sessions: 1,
            total_sales: 100,
            total_items: 3,
            number_of_sales: 2,
            total_donations: 5,
            total_weight_sold: 1.5,
            average_session_duration: 2
          } })
        }
        if (url.includes('/v1/cash-sessions/')) {
          return Promise.resolve({ data: { data: [], total: 0, skip: 0, limit: 20 } })
        }
        if (url.includes('/v1/admin/reports/cash-sessions')) {
          return Promise.resolve({ data: { reports: [] } })
        }
        return Promise.resolve({ data: [] })
      })
    }
  }
})

describe('SessionManager', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders KPI cards', async () => {
    render(<SessionManager />)
    await waitFor(() => {
      expect(screen.getByText("Chiffre d'Affaires Total")).toBeInTheDocument()
      expect(screen.getByText('Nombre de Ventes')).toBeInTheDocument()
      expect(screen.getByText('Poids Total Vendu')).toBeInTheDocument()
      expect(screen.getByText('Total des Dons')).toBeInTheDocument()
      expect(screen.getByText('Nombre de Sessions')).toBeInTheDocument()
    })
  })
})


