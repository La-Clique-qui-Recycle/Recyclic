/**
 * Page de Paramètres Admin (Story B26-P1)
 * Accessible uniquement aux Super-Admins
 * Contient les outils de gestion de la base de données
 */

import React, { useState } from 'react'
import styled from 'styled-components'
import { adminService } from '../../services/adminService'
import { useAuth } from '../../hooks/useAuth'
import { UserRole } from '../../generated'
import { useNavigate } from 'react-router-dom'

const SettingsContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`

const PageHeader = styled.div`
  margin-bottom: 32px;
`

const Title = styled.h1`
  margin: 0 0 8px 0;
  font-size: 2rem;
  color: #1f2937;
  font-weight: 600;
`

const Subtitle = styled.p`
  margin: 0;
  font-size: 1rem;
  color: #6b7280;
`

const Section = styled.section`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
`

const SectionHeader = styled.div`
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
`

const SectionTitle = styled.h2`
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`

const SectionDescription = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
`

const ActionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const ActionCard = styled.div`
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
`

const ActionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`

const ActionInfo = styled.div`
  flex: 1;
`

const ActionTitle = styled.h3`
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
`

const ActionDescription = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
`

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'disabled' }>`
  background: ${props => {
    switch (props.variant) {
      case 'danger': return '#dc2626'
      case 'secondary': return '#ffffff'
      case 'disabled': return '#f3f4f6'
      default: return '#1976d2'
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'disabled': return '#9ca3af'
      case 'secondary': return '#1976d2'
      default: return '#ffffff'
    }
  }};
  border: 1px solid ${props => {
    switch (props.variant) {
      case 'danger': return '#dc2626'
      case 'disabled': return '#e5e7eb'
      default: return '#1976d2'
    }
  }};
  padding: 8px 16px;
  border-radius: 6px;
  cursor: ${props => props.variant === 'disabled' ? 'not-allowed' : 'pointer'};
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 120px;

  &:hover {
    background: ${props => {
      if (props.variant === 'disabled') return '#f3f4f6'
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

const InfoBox = styled.div`
  background: #dbeafe;
  border: 1px solid #3b82f6;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 0.875rem;
  color: #1e40af;

  strong {
    color: #1e3a8a;
  }
`

const UnauthorizedContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 40px;
`

const UnauthorizedIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 16px;
`

const UnauthorizedTitle = styled.h2`
  font-size: 1.5rem;
  color: #1f2937;
  margin: 0 0 8px 0;
`

const UnauthorizedText = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 24px 0;
`

const Settings: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [exportingDatabase, setExportingDatabase] = useState(false)

  // Debug: Log user info
  console.log('Settings - User:', user)
  console.log('Settings - User role:', user?.role)
  console.log('Settings - Expected role (enum):', UserRole.SUPER_ADMIN)
  console.log('Settings - Role comparison (enum):', user?.role === UserRole.SUPER_ADMIN)
  console.log('Settings - Role comparison (string):', user?.role === 'super-admin')

  // Vérifier si l'utilisateur est Super-Admin
  // Utiliser la comparaison de string directe car user.role est string littéral
  if (!user || user.role !== 'super-admin') {
    return (
      <SettingsContainer>
        <UnauthorizedContainer>
          <UnauthorizedIcon>🔒</UnauthorizedIcon>
          <UnauthorizedTitle>Accès Restreint</UnauthorizedTitle>
          <UnauthorizedText>
            Seuls les Super-Administrateurs peuvent accéder à cette page.
            <br />
            <small style={{ color: '#9ca3af' }}>
              (Votre rôle actuel: {user?.role || 'non connecté'})
            </small>
          </UnauthorizedText>
          <Button variant="primary" onClick={() => navigate('/admin')}>
            Retour au tableau de bord
          </Button>
        </UnauthorizedContainer>
      </SettingsContainer>
    )
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

  return (
    <SettingsContainer>
      <PageHeader>
        <Title>⚙️ Paramètres</Title>
        <Subtitle>Configuration et outils de maintenance du système</Subtitle>
      </PageHeader>

      {/* Section Base de Données */}
      <Section>
        <SectionHeader>
          <SectionTitle>
            🗄️ Base de Données
          </SectionTitle>
          <SectionDescription>
            Outils de gestion et de maintenance de la base de données. Ces opérations sont critiques
            et doivent être effectuées avec précaution.
          </SectionDescription>
        </SectionHeader>

        <ActionGroup>
          {/* Export de la base de données */}
          <ActionCard>
            <ActionHeader>
              <ActionInfo>
                <ActionTitle>Export de la base de données</ActionTitle>
                <ActionDescription>
                  Génère un fichier SQL complet de sauvegarde de la base de données.
                  Utile pour les backups manuels ou avant des opérations de maintenance majeures.
                </ActionDescription>
              </ActionInfo>
              <Button
                variant="secondary"
                onClick={handleExportDatabase}
                disabled={exportingDatabase}
              >
                {exportingDatabase ? '⏳ Export en cours...' : '💾 Exporter'}
              </Button>
            </ActionHeader>
            <WarningBox>
              <strong>⚠️ Attention :</strong> L'export peut prendre plusieurs minutes selon la taille
              de la base de données et consommer des ressources système importantes.
            </WarningBox>
          </ActionCard>

          {/* Purge des données - Placeholder pour STORY-B25-P1 */}
          <ActionCard>
            <ActionHeader>
              <ActionInfo>
                <ActionTitle>Purge des données transactionnelles</ActionTitle>
                <ActionDescription>
                  Supprime les données transactionnelles anciennes (dépôts, ventes, sessions) selon
                  une période de rétention définie. Cette opération est irréversible.
                </ActionDescription>
              </ActionInfo>
              <Button
                variant="disabled"
                disabled
              >
                🚧 Bientôt disponible
              </Button>
            </ActionHeader>
            <InfoBox>
              <strong>ℹ️ Information :</strong> Cette fonctionnalité sera disponible dans une prochaine
              version (Story B25-P1). Elle permettra de nettoyer automatiquement les anciennes données
              transactionnelles pour optimiser les performances.
            </InfoBox>
          </ActionCard>
        </ActionGroup>
      </Section>
    </SettingsContainer>
  )
}

export default Settings
