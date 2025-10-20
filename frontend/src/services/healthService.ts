/**
 * Service pour les métriques de santé du système
 */

import api from './api'

export interface Anomaly {
  type: string
  severity: 'high' | 'medium' | 'low' | 'critical'
  description: string
  details: Record<string, any>
}

export interface HealthMetrics {
  overall_status: 'healthy' | 'degraded' | 'critical'
  anomalies_detected: number
  critical_anomalies: number
  scheduler_running: boolean
  active_tasks: number
  timestamp: string
}

export interface SystemHealth {
  status: string
  system_health: HealthMetrics
  anomalies: Record<string, Anomaly[]>
  recommendations: Recommendation[]
  scheduler_status: SchedulerStatus
}

export interface Recommendation {
  type: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actions: string[]
}

export interface SchedulerStatus {
  running: boolean
  tasks: SchedulerTask[]
  total_tasks: number
}

export interface SchedulerTask {
  name: string
  enabled: boolean
  last_run: string | null
  next_run: string | null
  running: boolean
  interval_minutes: number
}

export interface AnomalySummary {
  status: string
  anomalies: Record<string, Anomaly[]>
  summary: {
    total_anomalies: number
    critical_anomalies: number
  }
  timestamp: string
}

class HealthService {
  /**
   * Récupère les métriques de santé du système
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await api.get('/v1/admin/health')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques de santé:', error)
      throw new Error('Impossible de récupérer les métriques de santé')
    }
  }

  /**
   * Récupère uniquement les anomalies détectées
   */
  async getAnomalies(): Promise<AnomalySummary> {
    try {
      const response = await api.get('/v1/admin/health/anomalies')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des anomalies:', error)
      throw new Error('Impossible de récupérer les anomalies')
    }
  }

  /**
   * Récupère le statut du scheduler
   */
  async getSchedulerStatus(): Promise<SchedulerStatus> {
    try {
      const response = await api.get('/v1/admin/health/scheduler')
      return response.data.scheduler
    } catch (error) {
      console.error('Erreur lors de la récupération du statut du scheduler:', error)
      throw new Error('Impossible de récupérer le statut du scheduler')
    }
  }

  /**
   * Envoie une notification de test
   */
  async sendTestNotification(): Promise<{ status: string; message: string }> {
    try {
      const response = await api.post('/v1/admin/health/test-notifications')
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de test:', error)
      throw new Error('Impossible d\'envoyer la notification de test')
    }
  }
}

export const healthService = new HealthService()
