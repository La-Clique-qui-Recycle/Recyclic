import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import React from 'react'
import SessionManager from '../../pages/Admin/SessionManager'

vi.mock('../../api/axiosClient', () => {
  const get = vi.fn((url: string, opts?: any) => {
    if (url.includes('/v1/cash-sessions/stats/summary')) {
      return Promise.resolve({ data: {
        total_sessions: 1,
        open_sessions: 0,
        closed_sessions: 1,
        total_sales: 70,
        total_items: 3,
        number_of_sales: 2,
        total_donations: 5,
        total_weight_sold: 1.5,
        average_session_duration: 2
      } })
    }
    if (url.includes('/v1/cash-sessions/')) {
      const params = opts?.params || {}
      if (params.status === 'closed' && params.search === 'combo' && params.operator_id && params.site_id && params.date_from && params.date_to) {
        return Promise.resolve({ data: { data: [
          { id: 'sess-1', operator_id: params.operator_id, site_id: params.site_id, initial_amount: 10, current_amount: 10, status: 'closed', opened_at: new Date().toISOString(), total_sales: 70, total_items: 3 }
        ], total: 1, skip: 0, limit: 20 } })
      }
      return Promise.resolve({ data: { data: [], total: 0, skip: 0, limit: 20 } })
    }
    if (url.includes('/v1/admin/reports/cash-sessions')) {
      return Promise.resolve({ data: { reports: [] } })
    }
    if (url.includes('/v1/users/active-operators') || url.includes('/v1/sites')) {
      return Promise.resolve({ data: [] })
    }
    return Promise.resolve({ data: [] })
  })
  return { default: { get } }
})

describe('SessionManager filters combined', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('applies combined filters and updates list/KPIs', async () => {
    render(<SessionManager />)

    // set filters
    const dateFrom = screen.getAllByRole('textbox')[0]
    const dateTo = screen.getAllByRole('textbox')[1]
    fireEvent.change(dateFrom, { target: { value: '2025-01-01' } })
    fireEvent.change(dateTo, { target: { value: '2025-01-31' } })

    const statusSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(statusSelect, { target: { value: 'closed' } })

    const operatorSelect = screen.getAllByRole('combobox')[1]
    fireEvent.change(operatorSelect, { target: { value: 'op-1' } })

    const siteSelect = screen.getAllByRole('combobox')[2]
    fireEvent.change(siteSelect, { target: { value: 'site-1' } })

    const searchInput = screen.getAllByRole('textbox')[2]
    fireEvent.change(searchInput, { target: { value: 'combo' } })

    // apply
    fireEvent.click(screen.getByText('Appliquer les filtres'))

    await waitFor(() => {
      expect(screen.getByText("Chiffre d'Affaires Total")).toBeInTheDocument()
      expect(screen.getByText('70,00 €')).toBeInTheDocument()
    })

    // row appears
    await waitFor(() => {
      expect(screen.getByText('Fermée')).toBeInTheDocument()
    })
  })
})




