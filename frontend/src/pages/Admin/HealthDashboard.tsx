import React, { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { healthService, SystemHealth, Anomaly, Recommendation } from '../../services/healthService'
import { adminService } from '../../services/adminService'
import { useAuth } from '../../hooks/useAuth'
import { UserRole } from '../../generated'

const HealthDashboardContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`

const Title = styled.h1`
  margin: 0;
  font-size: 2rem;
  color: #1f2937;
  font-weight: 600;
`

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${props => {
    switch (props.variant) {
      case 'danger': return '#dc2626'
      case 'secondary': return '#ffffff'
      default: return '#1976d2'
    }
  }};
  color: ${props => props.variant === 'secondary' ? '#1976d2' : '#ffffff'};
  border: 1px solid ${props => props.variant === 'danger' ? '#dc2626' : '#1976d2'};
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;

  &:hover {
    background: ${props => {
      switch (props.variant) {
        case 'danger': return '#b91c1c'
        case 'secondary': return '#f3f4f6'
        default: return '#1565c0'
      }
    }};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const StatusCard = styled.div<{ status: 'healthy' | 'degraded' | 'critical' }>`
  background: ${props => {
    switch (props.status) {
      case 'healthy': return '#d1fae5'
      case 'degraded': return '#fef3c7'
      case 'critical': return '#fecaca'
      default: return '#f3f4f6'
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'healthy': return '#10b981'
      case 'degraded': return '#f59e0b'
      case 'critical': return '#ef4444'
      default: return '#d1d5db'
    }
  }};
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
`

const StatusIndicator = styled.div<{ status: 'healthy' | 'degraded' | 'critical' }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: ${props => {
    switch (props.status) {
      case 'healthy': return '#059669'
      case 'degraded': return '#d97706'
      case 'critical': return '#dc2626'
      default: return '#6b7280'
    }
  }};

  &::before {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${props => {
      switch (props.status) {
        case 'healthy': return '#10b981'
        case 'degraded': return '#f59e0b'
        case 'critical': return '#ef4444'
        default: return '#d1d5db'
      }
    }};
  }
`

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`

const MetricCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
`

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
`

const MetricLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
`

const Section = styled.section`
  margin-bottom: 32px;
`

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
`

const AnomalyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const AnomalyItem = styled.div<{ severity: 'high' | 'medium' | 'low' | 'critical' }>`
  background: ${props => {
    switch (props.severity) {
      case 'critical': return '#fef2f2'
      case 'high': return '#fef3c7'
      case 'medium': return '#f0f9ff'
      case 'low': return '#f9fafb'
      default: return '#f9fafb'
    }
  }};
  border: 1px solid ${props => {
    switch (props.severity) {
      case 'critical': return '#fecaca'
      case 'high': return '#fcd34d'
      case 'medium': return '#60a5fa'
      case 'low': return '#d1d5db'
      default: return '#d1d5db'
    }
  }};
  border-radius: 6px;
  padding: 16px;
`

const AnomalySeverity = styled.span<{ severity: 'high' | 'medium' | 'low' | 'critical' }>`
  background: ${props => {
    switch (props.severity) {
      case 'critical': return '#dc2626'
      case 'high': return '#f59e0b'
      case 'medium': return '#3b82f6'
      case 'low': return '#6b7280'
      default: return '#6b7280'
    }
  }};
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
`

const RecommendationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const RecommendationItem = styled.div<{ priority: 'high' | 'medium' | 'low' }>`
  background: ${props => {
    switch (props.priority) {
      case 'high': return '#fef2f2'
      case 'medium': return '#fffbeb'
      case 'low': return '#f9fafb'
      default: return '#f9fafb'
    }
  }};
  border: 1px solid ${props => {
    switch (props.priority) {
      case 'high': return '#fecaca'
      case 'medium': return '#fcd34d'
      case 'low': return '#d1d5db'
      default: return '#d1d5db'
    }
  }};
  border-radius: 8px;
  padding: 20px;
`

const RecommendationPriority = styled.div<{ priority: 'high' | 'medium' | 'low' }>`
  background: ${props => {
    switch (props.priority) {
      case 'high': return '#dc2626'
      case 'medium': return '#f59e0b'
      case 'low': return '#6b7280'
      default: return '#6b7280'
    }
  }};
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  display: inline-block;
  margin-bottom: 12px;
`

const ActionsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 12px 0 0 0;
`

const ActionItem = styled.li`
  background: #f3f4f6;
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 8px;
  font-size: 0.875rem;
`

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;
`

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  color: #dc2626;
`

const SchedulerStatus = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
`

const SchedulerTask = styled.div<{ enabled: boolean; running: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: ${props => props.enabled ? '#f9fafb' : '#f3f4f6'};
  border-radius: 6px;
  margin-bottom: 8px;
  opacity: ${props => props.enabled ? 1 : 0.5};
`

const TaskName = styled.span`
  font-weight: 500;
  color: #1f2937;
`

const TaskStatus = styled.span<{ running: boolean }>`
  font-size: 0.75rem;
  color: ${props => props.running ? '#059669' : '#6b7280'};
  font-weight: ${props => props.running ? 600 : 400};
`

const RefreshButton = styled(Button)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`

const WarningBox = styled.div`
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 0.875rem;
  color: #92400e;

  strong {
    color: #78350f;
  }
`

const HealthDashboard: React.FC = () => {
  const { user } = useAuth()
  const [healthData, setHealthData] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [testingNotifications, setTestingNotifications] = useState(false)
  const [exportingDatabase, setExportingDatabase] = useState(false)

  const loadHealthData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await healthService.getSystemHealth()
      setHealthData(data)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleTestNotifications = async () => {
    try {
      setTestingNotifications(true)
      await healthService.sendTestNotification()
      alert('Notification de test envoyée avec succès !')
    } catch (err) {
      alert(`Erreur lors de l'envoi de la notification de test: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    } finally {
      setTestingNotifications(false)
    }
  }

  const handleExportDatabase = async () => {
    if (!confirm('⚠️ Voulez-vous vraiment exporter la base de données ? Cette opération peut prendre plusieurs minutes.')) {
      return
    }

    try {
      setExportingDatabase(true)
      await adminService.exportDatabase()
      alert('✅ Export de la base de données réussi ! Le fichier a été téléchargé.')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      alert(`❌ Erreur lors de l'export de la base de données: ${errorMessage}`)
      console.error('Export database error:', err)
    } finally {
      setExportingDatabase(false)
    }
  }

  useEffect(() => {
    loadHealthData()

    // Actualiser automatiquement toutes les 30 secondes
    const interval = setInterval(loadHealthData, 30000)
    return () => clearInterval(interval)
  }, [loadHealthData])


  const renderAnomalies = (anomalies: Record<string, Anomaly[]>) => {
    const allAnomalies = Object.values(anomalies).flat()

    if (allAnomalies.length === 0) {
      return <p style={{ color: '#059669', fontStyle: 'italic' }}>Aucune anomalie détectée</p>
    }

    return (
      <AnomalyList>
        {allAnomalies.map((anomaly, index) => (
          <AnomalyItem key={index} severity={anomaly.severity}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <strong>{anomaly.description}</strong>
              <AnomalySeverity severity={anomaly.severity}>
                {anomaly.severity}
              </AnomalySeverity>
            </div>
            <details>
              <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '0.875rem' }}>
                Détails
              </summary>
              <pre style={{ marginTop: '8px', fontSize: '0.75rem', background: '#f9fafb', padding: '8px', borderRadius: '4px' }}>
                {JSON.stringify(anomaly.details, null, 2)}
              </pre>
            </details>
          </AnomalyItem>
        ))}
      </AnomalyList>
    )
  }

  const renderRecommendations = (recommendations: Recommendation[]) => {
    if (recommendations.length === 0) {
      return <p style={{ color: '#059669', fontStyle: 'italic' }}>Aucune recommandation</p>
    }

    return (
      <RecommendationsList>
        {recommendations.map((rec, index) => (
          <RecommendationItem key={index} priority={rec.priority}>
            <RecommendationPriority priority={rec.priority}>
              {rec.priority}
            </RecommendationPriority>
            <h4 style={{ margin: '0 0 12px 0', color: '#1f2937' }}>{rec.title}</h4>
            <p style={{ margin: '0 0 12px 0', color: '#4b5563', lineHeight: '1.5' }}>
              {rec.description}
            </p>
            <ActionsList>
              {rec.actions.map((action, actionIndex) => (
                <ActionItem key={actionIndex}>• {action}</ActionItem>
              ))}
            </ActionsList>
          </RecommendationItem>
        ))}
      </RecommendationsList>
    )
  }

  const renderSchedulerStatus = (schedulerStatus: any) => {
    return (
      <SchedulerStatus>
        <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>Statut du Scheduler</h3>
        <div style={{ marginBottom: '16px' }}>
          <strong>État:</strong>{' '}
          <span style={{ color: schedulerStatus.running ? '#059669' : '#dc2626' }}>
            {schedulerStatus.running ? 'En cours d\'exécution' : 'Arrêté'}
          </span>
        </div>
        <div>
          <strong>Tâches ({schedulerStatus.total_tasks}):</strong>
          <div style={{ marginTop: '8px' }}>
            {schedulerStatus.tasks.map((task: any, index: number) => (
              <SchedulerTask
                key={index}
                enabled={task.enabled}
                running={task.running}
              >
                <TaskName>{task.name}</TaskName>
                <TaskStatus running={task.running}>
                  {task.running ? 'En cours' : 'Inactif'}
                </TaskStatus>
              </SchedulerTask>
            ))}
          </div>
        </div>
      </SchedulerStatus>
    )
  }

  if (loading) {
    return (
      <HealthDashboardContainer>
        <LoadingMessage>
          <div>Chargement des métriques de santé...</div>
        </LoadingMessage>
      </HealthDashboardContainer>
    )
  }

  if (error || !healthData) {
    return (
      <HealthDashboardContainer>
        <ErrorMessage>
          <strong>Erreur:</strong> {error}
        </ErrorMessage>
        <Button onClick={loadHealthData}>Réessayer</Button>
      </HealthDashboardContainer>
    )
  }

  const { system_health, anomalies, recommendations, scheduler_status } = healthData

  return (
    <HealthDashboardContainer>
      <Header>
        <Title>Tableau de Bord - Santé du Système</Title>
        <ButtonGroup>
          <RefreshButton
            variant="secondary"
            onClick={loadHealthData}
            disabled={loading}
          >
            🔄 Actualiser
          </RefreshButton>
          <Button
            variant="secondary"
            onClick={handleTestNotifications}
            disabled={testingNotifications}
          >
            {testingNotifications ? '⏳' : '🔔'} Test Notifications
          </Button>
        </ButtonGroup>
      </Header>

      {lastRefresh && (
        <div style={{ marginBottom: '16px', color: '#6b7280', fontSize: '0.875rem' }}>
          Dernière mise à jour: {lastRefresh.toLocaleString('fr-FR')}
        </div>
      )}

      <StatusCard status={system_health.overall_status}>
        <h2 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>
          État Global du Système
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <StatusIndicator status={system_health.overall_status}>
            {system_health.overall_status === 'healthy' && '✅ Système sain'}
            {system_health.overall_status === 'degraded' && '⚠️ Système dégradé'}
            {system_health.overall_status === 'critical' && '🚨 Système critique'}
          </StatusIndicator>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Anomalies: {system_health.anomalies_detected}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Critiques: {system_health.critical_anomalies}
            </div>
          </div>
        </div>
      </StatusCard>

      <MetricsGrid>
        <MetricCard>
          <MetricValue>{system_health.anomalies_detected}</MetricValue>
          <MetricLabel>Anomalies Totales</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{system_health.critical_anomalies}</MetricValue>
          <MetricLabel>Anomalies Critiques</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{system_health.active_tasks}</MetricValue>
          <MetricLabel>Tâches Actives</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue style={{ color: system_health.scheduler_running ? '#059669' : '#dc2626' }}>
            {system_health.scheduler_running ? '✅' : '❌'}
          </MetricValue>
          <MetricLabel>Scheduler</MetricLabel>
        </MetricCard>
      </MetricsGrid>

      <Section>
        <SectionTitle>📊 Anomalies Détectées</SectionTitle>
        {renderAnomalies(anomalies)}
      </Section>

      <Section>
        <SectionTitle>🔧 Recommandations</SectionTitle>
        {renderRecommendations(recommendations)}
      </Section>

      <Section>
        <SectionTitle>⚙️ Statut du Scheduler</SectionTitle>
        {renderSchedulerStatus(scheduler_status)}
      </Section>

      {user?.role === UserRole.SUPER_ADMIN && (
        <Section>
          <SectionTitle>🗄️ Maintenance de la Base de Données</SectionTitle>
          <WarningBox>
            <strong>⚠️ Attention :</strong> L'export de la base de données peut prendre plusieurs minutes
            et consommer des ressources système importantes. Cette opération est réservée aux Super-Admins.
          </WarningBox>
          <Button
            variant="secondary"
            onClick={handleExportDatabase}
            disabled={exportingDatabase}
          >
            {exportingDatabase ? '⏳ Export en cours...' : '💾 Exporter la base de données'}
          </Button>
        </Section>
      )}

    </HealthDashboardContainer>
  )
}

export default HealthDashboard
