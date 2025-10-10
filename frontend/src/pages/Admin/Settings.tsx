/**
 * Page de Paramètres Admin (Story B26-P1)
 * Accessible uniquement aux Super-Admins
 * Contient les outils de gestion de la base de données
 */

import React, { useState } from 'react'
import styled from 'styled-components'
import { adminService } from '../../services/adminService'
import { useAuthStore } from '../../stores/authStore'
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

// Styles pour les modales de purge
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
  text-align: center;
`

const ModalText = styled.p`
  font-size: 1rem;
  color: #374151;
  margin: 0 0 24px 0;
  line-height: 1.5;
  text-align: center;
`

const ModalInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  margin: 16px 0;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`

const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
`

const ModalButton = styled.button<{ variant: 'primary' | 'secondary' | 'danger' }>`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
        `
      case 'secondary':
        return `
          background: #f3f4f6;
          color: #374151;
          &:hover { background: #e5e7eb; }
        `
      case 'danger':
        return `
          background: #dc2626;
          color: white;
          &:hover { background: #b91c1c; }
        `
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Settings: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser)
  const navigate = useNavigate()
  const [exportingDatabase, setExportingDatabase] = useState(false)
  const [purgingData, setPurgingData] = useState(false)
  const [showPurgeModal, setShowPurgeModal] = useState(false)
  const [purgeStep, setPurgeStep] = useState(1)
  const [confirmationText, setConfirmationText] = useState('')

  // Debug: Log user info
  console.log('Settings - User:', currentUser)
  console.log('Settings - User role:', currentUser?.role)

  // Vérifier si l'utilisateur est Super-Admin
  if (!currentUser || currentUser.role !== 'super-admin') {
    return (
      <SettingsContainer>
        <UnauthorizedContainer>
          <UnauthorizedIcon>🔒</UnauthorizedIcon>
          <UnauthorizedTitle>Accès Restreint</UnauthorizedTitle>
          <UnauthorizedText>
            Seuls les Super-Administrateurs peuvent accéder à cette page.
            <br />
            <small style={{ color: '#9ca3af' }}>
              (Votre rôle actuel: {currentUser?.role || 'non connecté'})
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

  const handlePurgeData = () => {
    setShowPurgeModal(true)
    setPurgeStep(1)
    setConfirmationText('')
  }

  const handlePurgeStep1 = () => {
    setPurgeStep(2)
  }

  const handlePurgeStep2 = () => {
    setPurgeStep(3)
  }

  const handlePurgeStep3 = async () => {
    if (confirmationText !== 'Adieu la base') {
      alert('❌ Le texte de confirmation ne correspond pas. Veuillez recopier exactement "Adieu la base".')
      return
    }

    try {
      setPurgingData(true)
      const result = await adminService.purgeTransactionalData()
      
      alert(`✅ Purge réussie !\n\nEnregistrements supprimés :\n${Object.entries(result.deleted_records)
        .map(([table, count]) => `• ${table}: ${count} enregistrements`)
        .join('\n')}`)
      
      setShowPurgeModal(false)
      setPurgeStep(1)
      setConfirmationText('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      alert(`❌ Erreur lors de la purge des données: ${errorMessage}`)
      console.error('Purge data error:', err)
    } finally {
      setPurgingData(false)
    }
  }

  const handleCancelPurge = () => {
    setShowPurgeModal(false)
    setPurgeStep(1)
    setConfirmationText('')
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

          {/* Purge des données transactionnelles */}
          <ActionCard>
            <ActionHeader>
              <ActionInfo>
                <ActionTitle>Purge des données transactionnelles</ActionTitle>
                <ActionDescription>
                  Supprime TOUTES les données de ventes, réceptions et sessions de caisse.
                  Cette opération est irréversible et ne doit être utilisée qu'avant la mise en production.
                </ActionDescription>
              </ActionInfo>
              <Button
                variant="danger"
                onClick={handlePurgeData}
                disabled={purgingData}
              >
                {purgingData ? '⏳ Purge en cours...' : '🗑️ Purger les données'}
              </Button>
            </ActionHeader>
            <WarningBox style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>
              <strong>⚠️ DANGER :</strong> Cette action supprimera définitivement toutes les données transactionnelles.
              Elle ne doit être utilisée qu'une seule fois avant le lancement officiel de l'application.
            </WarningBox>
          </ActionCard>
        </ActionGroup>
      </Section>

      {/* Modales de confirmation pour la purge */}
      {showPurgeModal && (
        <ModalOverlay>
          <ModalContent>
            {purgeStep === 1 && (
              <>
                <ModalTitle>⚠️ Confirmation de purge</ModalTitle>
                <ModalText>
                  Êtes-vous sûr de vouloir supprimer toutes les données de ventes et de réceptions ? 
                  Cette action est irréversible.
                </ModalText>
                <ModalButtons>
                  <ModalButton variant="secondary" onClick={handleCancelPurge}>
                    Annuler
                  </ModalButton>
                  <ModalButton variant="danger" onClick={handlePurgeStep1}>
                    Oui, je suis sûr
                  </ModalButton>
                </ModalButtons>
              </>
            )}

            {purgeStep === 2 && (
              <>
                <ModalTitle>🚨 Dernière chance</ModalTitle>
                <ModalText>
                  Vraiment sûr(e) ? Toutes les transactions seront définitivement perdues.
                </ModalText>
                <ModalButtons>
                  <ModalButton variant="secondary" onClick={handleCancelPurge}>
                    Annuler
                  </ModalButton>
                  <ModalButton variant="danger" onClick={handlePurgeStep2}>
                    Oui, je confirme
                  </ModalButton>
                </ModalButtons>
              </>
            )}

            {purgeStep === 3 && (
              <>
                <ModalTitle>🔐 Confirmation finale</ModalTitle>
                <ModalText>
                  Pour confirmer, veuillez recopier exactement la phrase suivante :
                  <br />
                  <strong style={{ color: '#dc2626', fontSize: '1.2rem' }}>"Adieu la base"</strong>
                </ModalText>
                <ModalInput
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Recopiez la phrase ici..."
                  disabled={purgingData}
                />
                <ModalButtons>
                  <ModalButton variant="secondary" onClick={handleCancelPurge} disabled={purgingData}>
                    Annuler
                  </ModalButton>
                  <ModalButton 
                    variant="danger" 
                    onClick={handlePurgeStep3}
                    disabled={purgingData || confirmationText !== 'Adieu la base'}
                  >
                    {purgingData ? '⏳ Suppression...' : '🗑️ Supprimer définitivement'}
                  </ModalButton>
                </ModalButtons>
              </>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
    </SettingsContainer>
  )
}

export default Settings
