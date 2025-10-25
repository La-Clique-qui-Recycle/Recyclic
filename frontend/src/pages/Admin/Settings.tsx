/**
 * Page de Paramètres Admin (Story B26-P1)
 * Accessible uniquement aux Super-Admins
 * Contient les outils de gestion de la base de données
 */

import React, { useState, useEffect } from 'react'
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

// Styles pour les paramètres de session
const FormGroup = styled.div`
  margin-bottom: 20px;
`

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
  }
`

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 8px;
`

const SuccessMessage = styled.div`
  color: #059669;
  font-size: 0.875rem;
  margin-top: 8px;
`

const Settings: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser)
  const navigate = useNavigate()
  const isSuperAdmin = currentUser?.role === 'super-admin'
  const [exportingDatabase, setExportingDatabase] = useState(false)
  const [purgingData, setPurgingData] = useState(false)
  const [showPurgeModal, setShowPurgeModal] = useState(false)
  const [purgeStep, setPurgeStep] = useState(1)
  const [confirmationText, setConfirmationText] = useState('')
  
  // États pour l'import de base de données
  const [importingDatabase, setImportingDatabase] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importConfirmationText, setImportConfirmationText] = useState('')
  
  // États pour le seuil d'activité "En ligne"
  const [activityThreshold, setActivityThreshold] = useState(15)
  const [loadingActivityThreshold, setLoadingActivityThreshold] = useState(false)
  const [savingActivityThreshold, setSavingActivityThreshold] = useState(false)
  const [activityThresholdError, setActivityThresholdError] = useState<string | null>(null)

  // États pour les paramètres de session
  const [sessionSettings, setSessionSettings] = useState({ token_expiration_minutes: 480 })
  const [loadingSessionSettings, setLoadingSessionSettings] = useState(false)
  const [savingSessionSettings, setSavingSessionSettings] = useState(false)
  const [sessionSettingsError, setSessionSettingsError] = useState<string | null>(null)

  // États pour les paramètres email
  const [emailSettings, setEmailSettings] = useState({
    from_name: '',
    from_address: '',
    default_recipient: '',
    has_api_key: false,
    webhook_secret_configured: false
  })
  const [loadingEmailSettings, setLoadingEmailSettings] = useState(false)
  const [savingEmailSettings, setSavingEmailSettings] = useState(false)
  const [emailSettingsError, setEmailSettingsError] = useState<string | null>(null)
  const [emailSettingsSuccess, setEmailSettingsSuccess] = useState<string | null>(null)
  const [sendingTestEmail, setSendingTestEmail] = useState(false)
  const [testEmailAddress, setTestEmailAddress] = useState('')
  const [testEmailError, setTestEmailError] = useState<string | null>(null)
  const [testEmailSuccess, setTestEmailSuccess] = useState<string | null>(null)
  const [emailSettingsChanged, setEmailSettingsChanged] = useState(false)
  const [originalEmailSettings, setOriginalEmailSettings] = useState({
    from_name: '',
    from_address: '',
    default_recipient: ''
  })

  useEffect(() => {
    if (!isSuperAdmin) {
      return
    }

    let isCancelled = false

    const loadSessionSettings = async () => {
      try {
        setLoadingSessionSettings(true)
        setSessionSettingsError(null)
        const settings = await adminService.getSessionSettings()
        if (!isCancelled) {
          setSessionSettings(settings)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres de session:', error)
        if (!isCancelled) {
          setSessionSettingsError('Erreur lors du chargement des paramètres')
        }
      } finally {
        if (!isCancelled) {
          setLoadingSessionSettings(false)
        }
      }
    }

    const loadActivityThreshold = async () => {
      try {
        setLoadingActivityThreshold(true)
        setActivityThresholdError(null)
        const response = await adminService.getActivityThreshold()
        const minutes = response?.activity_threshold_minutes
        if (!isCancelled && typeof minutes === 'number' && !Number.isNaN(minutes)) {
          setActivityThreshold(minutes)
        }
      } catch (error) {
        console.error("Erreur lors du chargement du seuil d'activité:", error)
        if (!isCancelled) {
          setActivityThresholdError("Erreur lors du chargement du seuil d'activité")
        }
      } finally {
        if (!isCancelled) {
          setLoadingActivityThreshold(false)
        }
      }
    }

    const loadEmailSettings = async () => {
      try {
        setLoadingEmailSettings(true)
        setEmailSettingsError(null)
        const settings = await adminService.getEmailSettings()
        if (!isCancelled) {
          setEmailSettings(settings)
          setOriginalEmailSettings({
            from_name: settings.from_name,
            from_address: settings.from_address,
            default_recipient: settings.default_recipient || ''
          })
          if (settings.default_recipient) {
            setTestEmailAddress(settings.default_recipient)
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres email:', error)
        if (!isCancelled) {
          setEmailSettingsError('Erreur lors du chargement des paramètres email')
        }
      } finally {
        if (!isCancelled) {
          setLoadingEmailSettings(false)
        }
      }
    }

    loadSessionSettings()
    loadActivityThreshold()
    loadEmailSettings()

    return () => {
      isCancelled = true
    }
  }, [isSuperAdmin])

  // Vérifier si l'utilisateur est Super-Admin
  if (!isSuperAdmin) {
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

  // Fonctions pour l'import de base de données
  const handleImportDatabase = () => {
    setShowImportModal(true)
    setSelectedFile(null)
    setImportConfirmationText('')
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Vérifier que c'est un fichier SQL
      if (!file.name.toLowerCase().endsWith('.sql')) {
        alert('❌ Veuillez sélectionner un fichier SQL (.sql)')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleImportStep1 = () => {
    if (!selectedFile) {
      alert('❌ Veuillez sélectionner un fichier SQL')
      return
    }
    // Passer à l'étape de confirmation
  }

  const handleImportStep2 = async () => {
    if (importConfirmationText !== 'RESTAURER') {
      alert('❌ Le texte de confirmation ne correspond pas. Veuillez recopier exactement "RESTAURER".')
      return
    }

    if (!selectedFile) {
      alert('❌ Aucun fichier sélectionné')
      return
    }

    try {
      setImportingDatabase(true)
      const result = await adminService.importDatabase(selectedFile)
      
      alert(`✅ Import réussi !\n\nFichier importé: ${result.imported_file}\nSauvegarde créée: ${result.backup_created}\n\n⚠️ La base de données a été remplacée par le contenu du fichier.`)
      
      setShowImportModal(false)
      setSelectedFile(null)
      setImportConfirmationText('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      alert(`❌ Erreur lors de l'import de la base de données: ${errorMessage}`)
      console.error('Import database error:', err)
    } finally {
      setImportingDatabase(false)
    }
  }

  const handleCancelImport = () => {
    setShowImportModal(false)
    setSelectedFile(null)
    setImportConfirmationText('')
  }

  // Fonctions pour les paramètres de session
  const handleSessionSettingsChange = (field: string, value: number) => {
    // Validation côté client
    if (value < 1) {
      setSessionSettingsError('La durée doit être d\'au moins 1 minute')
      return
    }
    if (value > 10080) {
      setSessionSettingsError('La durée ne peut pas dépasser 7 jours (10080 minutes)')
      return
    }
    
    setSessionSettingsError(null)
    setSessionSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveSessionSettings = async () => {
    try {
      setSavingSessionSettings(true)
      setSessionSettingsError(null)

      // Validation finale avant envoi
      if (sessionSettings.token_expiration_minutes < 1 || sessionSettings.token_expiration_minutes > 10080) {
        setSessionSettingsError('Valeur invalide. La durée doit être entre 1 et 10080 minutes.')
        return
      }

      await adminService.updateSessionSettings(sessionSettings.token_expiration_minutes)
      alert('✅ Paramètres de session sauvegardés avec succès !')
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde des paramètres de session:', error)

      // Gestion d'erreur plus spécifique
      if (error.response?.status === 400) {
        setSessionSettingsError(error.response.data.detail || 'Données invalides')
      } else if (error.response?.status === 403) {
        setSessionSettingsError('Accès refusé. Seuls les Super-Administrateurs peuvent modifier ces paramètres.')
      } else if (error.response?.status === 401) {
        setSessionSettingsError('Session expirée. Veuillez vous reconnecter.')
      } else {
        setSessionSettingsError('Erreur lors de la sauvegarde des paramètres')
      }
    } finally {
      setSavingSessionSettings(false)
    }
  }

  const handleActivityThresholdChange = (value: number) => {
    const clamped = Math.max(0, value)
    setActivityThreshold(clamped)
    if (activityThresholdError) {
      setActivityThresholdError(null)
    }
  }

  const handleSaveActivityThreshold = async () => {
    if (activityThreshold < 1 || activityThreshold > 1440) {
      setActivityThresholdError("Le seuil doit être compris entre 1 et 1440 minutes")
      return
    }

    try {
      setSavingActivityThreshold(true)
      setActivityThresholdError(null)
      await adminService.updateActivityThreshold(activityThreshold)
      alert("✅ Seuil d'activité mis à jour !")
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du seuil d'activité:", error)
      setActivityThresholdError("Erreur lors de l'enregistrement du seuil d'activité")
    } finally {
      setSavingActivityThreshold(false)
    }
  }

  // Fonctions pour les paramètres email
  const handleEmailSettingsChange = (field: string, value: string) => {
    setEmailSettingsError(null)
    setEmailSettingsSuccess(null)

    const newSettings = {
      ...emailSettings,
      [field]: value
    }
    setEmailSettings(newSettings)

    // Vérifier si les paramètres ont changé
    const changed =
      newSettings.from_name !== originalEmailSettings.from_name ||
      newSettings.from_address !== originalEmailSettings.from_address ||
      (newSettings.default_recipient || '') !== originalEmailSettings.default_recipient

    setEmailSettingsChanged(changed)
  }

  const handleSaveEmailSettings = async () => {
    try {
      setSavingEmailSettings(true)
      setEmailSettingsError(null)
      setEmailSettingsSuccess(null)

      // Validation email format
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailSettings.from_address || !emailPattern.test(emailSettings.from_address)) {
        setEmailSettingsError('L\'adresse email de l\'expéditeur est invalide')
        return
      }

      if (emailSettings.default_recipient && !emailPattern.test(emailSettings.default_recipient)) {
        setEmailSettingsError('L\'adresse email du destinataire est invalide')
        return
      }

      if (!emailSettings.from_name || emailSettings.from_name.trim().length === 0) {
        setEmailSettingsError('Le nom de l\'expéditeur ne peut pas être vide')
        return
      }

      const updatedSettings = await adminService.updateEmailSettings({
        from_name: emailSettings.from_name,
        from_address: emailSettings.from_address,
        default_recipient: emailSettings.default_recipient || undefined
      })

      setEmailSettings(updatedSettings)
      setOriginalEmailSettings({
        from_name: updatedSettings.from_name,
        from_address: updatedSettings.from_address,
        default_recipient: updatedSettings.default_recipient || ''
      })
      setEmailSettingsChanged(false)
      setEmailSettingsSuccess('✅ Paramètres email sauvegardés avec succès !')

      // Effacer le message de succès après 5 secondes
      setTimeout(() => setEmailSettingsSuccess(null), 5000)
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde des paramètres email:', error)

      if (error.response?.status === 400) {
        setEmailSettingsError(error.response.data.detail || 'Données invalides')
      } else if (error.response?.status === 403) {
        setEmailSettingsError('Accès refusé. Seuls les Super-Administrateurs peuvent modifier ces paramètres.')
      } else if (error.response?.status === 401) {
        setEmailSettingsError('Session expirée. Veuillez vous reconnecter.')
      } else {
        setEmailSettingsError('Erreur lors de la sauvegarde des paramètres email')
      }
    } finally {
      setSavingEmailSettings(false)
    }
  }

  const handleSendTestEmail = async () => {
    try {
      setSendingTestEmail(true)
      setTestEmailError(null)
      setTestEmailSuccess(null)

      // Validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!testEmailAddress || !emailPattern.test(testEmailAddress)) {
        setTestEmailError('Veuillez saisir une adresse email valide')
        return
      }

      const result = await adminService.sendTestEmail(testEmailAddress)

      setTestEmailSuccess(`✅ ${result.message}`)

      // Effacer le message de succès après 10 secondes
      setTimeout(() => setTestEmailSuccess(null), 10000)
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de l\'email de test:', error)

      if (error.response?.status === 400) {
        setTestEmailError(error.response.data.detail || 'Configuration email invalide')
      } else if (error.response?.status === 500) {
        setTestEmailError('Erreur lors de l\'envoi de l\'email. Vérifiez la configuration Brevo.')
      } else {
        setTestEmailError('Erreur lors de l\'envoi de l\'email de test')
      }
    } finally {
      setSendingTestEmail(false)
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

          {/* Import de la base de données */}
          <ActionCard>
            <ActionHeader>
              <ActionInfo>
                <ActionTitle>Import de sauvegarde</ActionTitle>
                <ActionDescription>
                  Importe un fichier SQL de sauvegarde et remplace la base de données existante.
                  Une sauvegarde automatique est créée avant l'import.
                </ActionDescription>
              </ActionInfo>
              <Button
                variant="danger"
                onClick={handleImportDatabase}
                disabled={true}
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              >
                🚧 Fonctionnalité en développement
              </Button>
            </ActionHeader>
            <WarningBox style={{ backgroundColor: '#fef3cd', borderColor: '#fde68a', color: '#92400e' }}>
              <strong>🚧 FONCTIONNALITÉ EN DÉVELOPPEMENT :</strong> L'import de sauvegarde est temporairement désactivé 
              en raison de problèmes techniques avec les fichiers de sauvegarde PostgreSQL. 
              Cette fonctionnalité sera bientôt disponible.
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
          <ActionCard>
            <ActionHeader>
              <ActionInfo>
                <ActionTitle>Seuil d'activité « En ligne »</ActionTitle>
                <ActionDescription>
                  Définit le temps pendant lequel un utilisateur reste affiché comme en ligne après son dernier ping.
                </ActionDescription>
              </ActionInfo>
            </ActionHeader>
            {loadingActivityThreshold ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                Chargement du seuil...
              </div>
            ) : (
              <div>
                <FormGroup>
                  <Label htmlFor="activity-threshold">Seuil en minutes</Label>
                  <Input
                    id="activity-threshold"
                    type="number"
                    min="1"
                    max="1440"
                    value={activityThreshold}
                    onChange={(e) => {
                      const nextValue = parseInt(e.target.value ?? '0', 10)
                      const clamped = Number.isNaN(nextValue) ? 0 : Math.min(1440, Math.max(0, nextValue))
                      handleActivityThresholdChange(clamped)
                    }}
                    disabled={savingActivityThreshold}
                  />
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
                    Valeur par défaut : 15 minutes (modifiable depuis ce panneau).
                  </div>
                </FormGroup>

                {activityThresholdError && (
                  <ErrorMessage>
                    {activityThresholdError}
                  </ErrorMessage>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <Button
                    variant="primary"
                    onClick={handleSaveActivityThreshold}
                    disabled={savingActivityThreshold}
                  >
                    {savingActivityThreshold ? 'Sauvegarde...' : 'Enregistrer'}
                  </Button>
                </div>
              </div>
            )}
          </ActionCard>
        </ActionGroup>
      </Section>

      {/* Section Sécurité */}
      <Section>
        <SectionHeader>
          <SectionTitle>
            🔒 Sécurité
          </SectionTitle>
          <SectionDescription>
            Configuration des paramètres de sécurité et d'authentification du système.
          </SectionDescription>
        </SectionHeader>

        <ActionGroup>
          {/* Paramètres de session */}
          <ActionCard>
            <ActionHeader>
              <ActionInfo>
                <ActionTitle>Durée de session</ActionTitle>
                <ActionDescription>
                  Configurez la durée d'expiration des tokens d'authentification. 
                  Une durée plus longue améliore l'expérience utilisateur mais réduit la sécurité.
                </ActionDescription>
              </ActionInfo>
            </ActionHeader>
            
            {loadingSessionSettings ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                ⏳ Chargement des paramètres...
              </div>
            ) : (
              <div>
                <FormGroup>
                  <Label htmlFor="token-expiration">
                    Durée de la session (en minutes)
                  </Label>
                  <Input
                    id="token-expiration"
                    type="number"
                    min="1"
                    max="10080"
                    value={sessionSettings.token_expiration_minutes}
                    onChange={(e) => handleSessionSettingsChange('token_expiration_minutes', parseInt(e.target.value) || 480)}
                    disabled={savingSessionSettings}
                    placeholder="480"
                  />
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
                    Valeur recommandée : 480 minutes (8 heures) pour une utilisation en boutique
                  </div>
                </FormGroup>

                {sessionSettingsError && (
                  <ErrorMessage>
                    ❌ {sessionSettingsError}
                  </ErrorMessage>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <Button
                    variant="primary"
                    onClick={handleSaveSessionSettings}
                    disabled={savingSessionSettings}
                  >
                    {savingSessionSettings ? '⏳ Sauvegarde...' : '💾 Enregistrer'}
                  </Button>
                </div>

                <InfoBox style={{ marginTop: '16px' }}>
                  <strong>ℹ️ Information :</strong> Les nouveaux tokens créés après la sauvegarde 
                  utiliseront cette durée d'expiration. Les tokens existants conservent leur durée d'origine.
                </InfoBox>
              </div>
            )}
          </ActionCard>
        </ActionGroup>
      </Section>

      {/* Section Email (Brevo) */}
      <Section>
        <SectionHeader>
          <SectionTitle>
            📧 Configuration Email (Brevo)
          </SectionTitle>
          <SectionDescription>
            Paramètres d'envoi d'emails pour les notifications système (rapports de caisse, réinitialisation de mot de passe, etc.)
          </SectionDescription>
        </SectionHeader>

        <ActionGroup>
          <ActionCard>
            <ActionHeader>
              <ActionInfo>
                <ActionTitle>Paramètres d'expédition</ActionTitle>
                <ActionDescription>
                  Configurez l'identité de l'expéditeur pour tous les emails envoyés par le système.
                </ActionDescription>
              </ActionInfo>
              {/* Badge de statut */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {emailSettings.has_api_key ? (
                  <div style={{
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    ✅ API configurée
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    ⚠️ API manquante
                  </div>
                )}
              </div>
            </ActionHeader>

            {!emailSettings.has_api_key && (
              <WarningBox style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#991b1b', marginBottom: '16px' }}>
                <strong>⚠️ Configuration incomplète :</strong> La clé API Brevo n'est pas configurée.
                Pour activer l'envoi d'emails, définissez les variables d'environnement suivantes dans le fichier <code>.env</code> :
                <ul style={{ marginTop: '8px', marginBottom: '0' }}>
                  <li><code>BREVO_API_KEY</code> - Clé API Brevo (obligatoire)</li>
                  <li><code>BREVO_WEBHOOK_SECRET</code> - Secret webhook (optionnel)</li>
                </ul>
                Consultez le guide de configuration Brevo pour plus d'informations.
              </WarningBox>
            )}

            {loadingEmailSettings ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                ⏳ Chargement des paramètres email...
              </div>
            ) : (
              <div>
                <FormGroup>
                  <Label htmlFor="email-from-name">
                    Nom de l'expéditeur <span style={{ color: '#dc2626' }}>*</span>
                  </Label>
                  <Input
                    id="email-from-name"
                    type="text"
                    value={emailSettings.from_name}
                    onChange={(e) => handleEmailSettingsChange('from_name', e.target.value)}
                    disabled={savingEmailSettings}
                    placeholder="Recyclic"
                  />
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
                    Le nom qui apparaîtra comme expéditeur des emails
                  </div>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="email-from-address">
                    Adresse email de l'expéditeur <span style={{ color: '#dc2626' }}>*</span>
                  </Label>
                  <Input
                    id="email-from-address"
                    type="email"
                    value={emailSettings.from_address}
                    onChange={(e) => handleEmailSettingsChange('from_address', e.target.value)}
                    disabled={savingEmailSettings}
                    placeholder="noreply@recyclic.fr"
                  />
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
                    Cette adresse doit être vérifiée dans Brevo
                  </div>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="email-default-recipient">
                    Email de test par défaut (optionnel)
                  </Label>
                  <Input
                    id="email-default-recipient"
                    type="email"
                    value={emailSettings.default_recipient || ''}
                    onChange={(e) => handleEmailSettingsChange('default_recipient', e.target.value)}
                    disabled={savingEmailSettings}
                    placeholder="admin@votreressourcerie.fr"
                  />
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
                    Adresse utilisée par défaut pour les tests d'envoi
                  </div>
                </FormGroup>

                {emailSettingsError && (
                  <ErrorMessage>
                    ❌ {emailSettingsError}
                  </ErrorMessage>
                )}

                {emailSettingsSuccess && (
                  <SuccessMessage>
                    {emailSettingsSuccess}
                  </SuccessMessage>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <Button
                    variant="primary"
                    onClick={handleSaveEmailSettings}
                    disabled={savingEmailSettings || !emailSettingsChanged}
                  >
                    {savingEmailSettings ? '⏳ Sauvegarde...' : '💾 Enregistrer'}
                  </Button>
                  {emailSettingsChanged && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEmailSettings({
                          ...emailSettings,
                          from_name: originalEmailSettings.from_name,
                          from_address: originalEmailSettings.from_address,
                          default_recipient: originalEmailSettings.default_recipient
                        })
                        setEmailSettingsChanged(false)
                        setEmailSettingsError(null)
                        setEmailSettingsSuccess(null)
                      }}
                      disabled={savingEmailSettings}
                    >
                      ↩️ Annuler
                    </Button>
                  )}
                </div>

                <InfoBox style={{ marginTop: '16px' }}>
                  <strong>ℹ️ Information :</strong> Les modifications n'affectent que les nouveaux emails envoyés.
                  Les emails en cours de traitement utilisent les paramètres précédents.
                </InfoBox>
              </div>
            )}
          </ActionCard>

          {/* Test d'envoi d'email */}
          <ActionCard>
            <ActionHeader>
              <ActionInfo>
                <ActionTitle>Test d'envoi d'email</ActionTitle>
                <ActionDescription>
                  Envoyez un email de test pour vérifier que la configuration Brevo fonctionne correctement.
                </ActionDescription>
              </ActionInfo>
            </ActionHeader>

            <div>
              <FormGroup>
                <Label htmlFor="test-email-address">
                  Adresse email destinataire
                </Label>
                <Input
                  id="test-email-address"
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => {
                    setTestEmailAddress(e.target.value)
                    setTestEmailError(null)
                    setTestEmailSuccess(null)
                  }}
                  disabled={sendingTestEmail || !emailSettings.has_api_key}
                  placeholder="votre-email@example.com"
                />
              </FormGroup>

              {testEmailError && (
                <ErrorMessage>
                  ❌ {testEmailError}
                </ErrorMessage>
              )}

              {testEmailSuccess && (
                <SuccessMessage>
                  {testEmailSuccess}
                </SuccessMessage>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <Button
                  variant="primary"
                  onClick={handleSendTestEmail}
                  disabled={sendingTestEmail || !emailSettings.has_api_key || !testEmailAddress}
                >
                  {sendingTestEmail ? '⏳ Envoi en cours...' : '📧 Envoyer un email de test'}
                </Button>
              </div>

              {!emailSettings.has_api_key && (
                <InfoBox style={{ marginTop: '16px', backgroundColor: '#fef3c7', borderColor: '#f59e0b' }}>
                  <strong>⚠️ Test désactivé :</strong> Configurez d'abord la clé API Brevo pour activer l'envoi d'emails de test.
                </InfoBox>
              )}
            </div>
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

      {/* Modale d'import de base de données */}
      {showImportModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>📥 Import de sauvegarde</ModalTitle>
            <ModalText>
              Sélectionnez un fichier SQL de sauvegarde à importer. Cette action remplacera
              complètement la base de données existante.
            </ModalText>
            
            <div style={{ margin: '20px 0' }}>
              <input
                type="file"
                accept=".sql"
                onChange={handleFileSelect}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb',
                  cursor: 'pointer'
                }}
                disabled={importingDatabase}
              />
              {selectedFile && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#dbeafe', borderRadius: '6px' }}>
                  <strong>Fichier sélectionné :</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <ModalText style={{ color: '#dc2626', fontWeight: 'bold' }}>
              ⚠️ ATTENTION : Cette opération est irréversible et remplacera toutes les données existantes.
            </ModalText>

            <ModalButtons>
              <ModalButton variant="secondary" onClick={handleCancelImport} disabled={importingDatabase}>
                Annuler
              </ModalButton>
              <ModalButton 
                variant="danger" 
                onClick={handleImportStep2}
                disabled={importingDatabase || !selectedFile}
              >
                {importingDatabase ? '⏳ Import en cours...' : '📥 Importer'}
              </ModalButton>
            </ModalButtons>

            <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '0.875rem' }}>
              <strong>Confirmation requise :</strong> Pour confirmer, veuillez recopier exactement le mot suivant :
              <br />
              <strong style={{ color: '#dc2626', fontSize: '1.2rem' }}>"RESTAURER"</strong>
            </div>
            
            <ModalInput
              type="text"
              value={importConfirmationText}
              onChange={(e) => setImportConfirmationText(e.target.value)}
              placeholder="Recopiez 'RESTAURER' ici..."
              disabled={importingDatabase}
            />
            
            <ModalButtons>
              <ModalButton variant="secondary" onClick={handleCancelImport} disabled={importingDatabase}>
                Annuler
              </ModalButton>
              <ModalButton 
                variant="danger" 
                onClick={handleImportStep2}
                disabled={importingDatabase || !selectedFile || importConfirmationText !== 'RESTAURER'}
              >
                {importingDatabase ? '⏳ Import en cours...' : '🗄️ Remplacer la base de données'}
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}
    </SettingsContainer>
  )
}

export default Settings
