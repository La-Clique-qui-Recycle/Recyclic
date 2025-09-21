import ApiClient from '../generated/api'
import { getAuthHeader } from './authService'

export interface DashboardStats {
  totalSessions: number
  openSessions: number
  closedSessions: number
  totalSales: number
  totalItems: number
  averageSessionDuration: number
}

export interface DashboardFilters {
  siteId?: string
  dateFrom?: string
  dateTo?: string
}

export interface DashboardSessionSummary {
  id: string
  siteId: string
  operator: string
  status: string
  initialAmount: number
  currentAmount: number
  totalSales: number
  totalItems: number
  openedAt: string
  closedAt?: string | null
}

export interface SiteOption {
  id: string
  name: string
}

export interface RecentReportSummary {
  filename: string
  downloadUrl: string
  generatedAt: string
  sizeBytes: number
}

export interface DashboardAggregate {
  stats: DashboardStats
  sessions: DashboardSessionSummary[]
  reports: RecentReportSummary[]
  encryptedMetrics?: string
}

export interface AlertThresholds {
  cashDiscrepancy: number
  lowInventory: number
}

const ADMIN_ALERT_THRESHOLD_KEY = 'admin_alert_thresholds'
const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  cashDiscrepancy: 10,
  lowInventory: 5,
}

const DASHBOARD_ENDPOINT = '/api/v1/admin/dashboard/stats'

const applyAuthHeaders = () => {
  const headers = getAuthHeader()
  const client = ApiClient?.client

  if (!headers) {
    return undefined
  }

  if (client?.defaults) {
    client.defaults.headers.common = {
      ...client.defaults.headers.common,
      ...headers,
    }
  }

  return headers
}

const normaliseNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const buildQueryParams = (filters?: DashboardFilters) => {
  if (!filters) {
    return ''
  }

  const params = new URLSearchParams()

  if (filters.siteId) {
    params.append('site_id', filters.siteId)
  }

  if (filters.dateFrom) {
    params.append('date_from', filters.dateFrom)
  }

  if (filters.dateTo) {
    params.append('date_to', filters.dateTo)
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

const mapSession = (session: any): DashboardSessionSummary | null => {
  if (!session) {
    return null
  }

  const id = String(session.sessionId ?? session.id ?? '')
  if (!id) {
    return null
  }

  return {
    id,
    siteId: String(session.siteId ?? session.site_id ?? ''),
    operator: String(session.operator ?? session.operatorName ?? 'Opérateur inconnu'),
    status: String(session.status ?? 'unknown'),
    initialAmount: normaliseNumber(session.initialAmount ?? session.initial_amount),
    currentAmount: normaliseNumber(session.currentAmount ?? session.current_amount),
    totalSales: normaliseNumber(session.totalSales ?? session.total_sales),
    totalItems: normaliseNumber(session.totalItems ?? session.total_items),
    openedAt: session.openedAt ?? session.opened_at ?? new Date().toISOString(),
    closedAt: session.closedAt ?? session.closed_at ?? null,
  }
}

const mapReport = (report: any): RecentReportSummary | null => {
  if (!report?.filename) {
    return null
  }

  return {
    filename: String(report.filename),
    downloadUrl: String(report.downloadUrl ?? report.download_url ?? ''),
    generatedAt: String(report.generatedAt ?? report.generated_at ?? ''),
    sizeBytes: normaliseNumber(report.sizeBytes ?? report.size_bytes),
  }
}

const mapStats = (metrics: any): DashboardStats => {
  if (!metrics) {
    return {
      totalSessions: 0,
      openSessions: 0,
      closedSessions: 0,
      totalSales: 0,
      totalItems: 0,
      averageSessionDuration: 0,
    }
  }

  return {
    totalSessions: normaliseNumber(metrics.totalSessions ?? metrics.total_sessions),
    openSessions: normaliseNumber(metrics.openSessions ?? metrics.open_sessions),
    closedSessions: normaliseNumber(metrics.closedSessions ?? metrics.closed_sessions),
    totalSales: normaliseNumber(metrics.totalSales ?? metrics.total_sales),
    totalItems: normaliseNumber(metrics.totalItems ?? metrics.total_items),
    averageSessionDuration: normaliseNumber(
      metrics.averageSessionDuration ?? metrics.average_session_duration,
    ),
  }
}

const parseDashboardPayload = (payload: any): DashboardAggregate => {
  const stats = mapStats(payload?.metrics)
  const encryptedMetrics = typeof payload?.encryptedMetrics === 'string' ? payload.encryptedMetrics : undefined

  const sessions = Array.isArray(payload?.recentSessions ?? payload?.cashSessions)
    ? (payload.recentSessions ?? payload.cashSessions)
        .map(mapSession)
        .filter((session): session is DashboardSessionSummary => Boolean(session))
    : []

  const reports = Array.isArray(payload?.recentReports ?? payload?.reports)
    ? (payload.recentReports ?? payload.reports)
        .map(mapReport)
        .filter((report): report is RecentReportSummary => Boolean(report))
    : []

  return {
    stats,
    sessions,
    reports,
    encryptedMetrics,
  }
}

export const dashboardService = {
  async listSites(): Promise<SiteOption[]> {
    try {
      const response = await ApiClient.client.get('/api/v1/admin/sites')
      return Array.isArray(response.data?.sites) ? response.data.sites : []
    } catch (error: any) {
      console.warn('Failed to load sites:', error?.message)
      return []
    }
  },

  async getDashboardData(filters: DashboardFilters = {}): Promise<DashboardAggregate> {
    const headers = applyAuthHeaders()

    try {
      const query = buildQueryParams(filters)
      const response = await ApiClient.client.get(DASHBOARD_ENDPOINT + query, headers ? { headers } : undefined)
      return parseDashboardPayload(response.data)
    } catch (error: any) {
      throw new Error(error?.message ?? 'Impossible de charger les données du dashboard')
    }
  },

  async saveAlertThresholds(thresholds: AlertThresholds, siteId?: string): Promise<AlertThresholds> {
    const payload = {
      site_id: siteId ?? null,
      thresholds,
    }

    localStorage.setItem(ADMIN_ALERT_THRESHOLD_KEY, JSON.stringify(payload))
    return thresholds
  },

  async getAlertThresholds(siteId?: string): Promise<AlertThresholds> {
    try {
      const stored = localStorage.getItem(ADMIN_ALERT_THRESHOLD_KEY)
      if (!stored) {
        return DEFAULT_ALERT_THRESHOLDS
      }

      const parsed = JSON.parse(stored)

      if (!parsed) {
        return DEFAULT_ALERT_THRESHOLDS
      }

      if (!siteId || parsed.site_id === siteId) {
        return parsed.thresholds ?? DEFAULT_ALERT_THRESHOLDS
      }

      return DEFAULT_ALERT_THRESHOLDS
    } catch (error) {
      return DEFAULT_ALERT_THRESHOLDS
    }
  },

  calculateSessionDuration(openedAt: string, closedAt?: string | null, status?: string): string {
    const opened = new Date(openedAt)

    if (status === 'open' || (!closedAt && status !== 'closed')) {
      const now = new Date()
      const diffMs = now.getTime() - opened.getTime()
      if (diffMs <= 0) {
        return '0h 00m'
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours}h ${minutes.toString().padStart(2, '0')}m`
    }

    if (closedAt) {
      const closed = new Date(closedAt)
      const diffMs = closed.getTime() - opened.getTime()
      if (diffMs <= 0) {
        return '0h 00m'
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours}h ${minutes.toString().padStart(2, '0')}m`
    }

    return 'N/A'
  },

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('fr-FR')
  },

  buildUserLookup(data: DashboardAggregate | undefined): Record<string, string> {
    if (!data?.sessions) {
      return {}
    }

    return data.sessions.reduce((acc, session) => {
      if (session.operator && !acc[session.operator]) {
        acc[session.operator] = session.operator
      }
      return acc
    }, {} as Record<string, string>)
  },
}

export default dashboardService

