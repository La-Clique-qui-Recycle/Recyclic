import axiosClient from '../api/axiosClient'

export interface CashSessionListItem {
  id: string
  operator_id: string
  site_id: string
  register_id?: string
  initial_amount: number
  current_amount: number
  status: 'open' | 'closed'
  opened_at: string
  closed_at?: string
  total_sales?: number
  total_items?: number
  number_of_sales?: number
  total_donations?: number
  closing_amount?: number
  actual_amount?: number
  variance?: number
  variance_comment?: string
}

export interface CashSessionListResponse {
  data: CashSessionListItem[]
  total: number
  skip: number
  limit: number
}

export interface CashSessionKPIs {
  total_sessions: number
  open_sessions: number
  closed_sessions: number
  total_sales: number
  total_items: number
  number_of_sales: number
  total_donations: number
  total_weight_sold: number
  average_session_duration?: number | null
}

export interface CashSessionFilters {
  skip?: number
  limit?: number
  status?: 'open' | 'closed'
  operator_id?: string
  site_id?: string
  date_from?: string
  date_to?: string
  search?: string
}

export const cashSessionsService = {
  async getKPIs(params: Partial<Pick<CashSessionFilters, 'date_from' | 'date_to' | 'site_id'>> = {}): Promise<CashSessionKPIs> {
    const response = await axiosClient.get('/v1/cash-sessions/stats/summary', { params })
    return response.data
  },

  async list(params: CashSessionFilters = {}): Promise<CashSessionListResponse> {
    const response = await axiosClient.get('/v1/cash-sessions/', { params })
    return response.data
  },
}

export interface CashSessionReportEntry {
  filename: string
  size_bytes: number
  modified_at: string
  download_url: string
}

export const cashSessionReportHelper = {
  async findReportForSession(sessionId: string): Promise<CashSessionReportEntry | null> {
    try {
      const res = await axiosClient.get('/v1/admin/reports/cash-sessions')
      const list: { reports: CashSessionReportEntry[] } = res.data
      const match = list.reports.find(r => r.filename.includes(sessionId))
      return match || null
    } catch (e) {
      return null
    }
  },

  async downloadReport(downloadUrl: string): Promise<Blob> {
    const res = await axiosClient.get(downloadUrl, { responseType: 'blob' })
    return res.data as Blob
  }
}


