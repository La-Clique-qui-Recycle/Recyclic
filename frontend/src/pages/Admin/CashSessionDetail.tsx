import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { ArrowLeft, Calendar, User, DollarSign, Package, Clock } from 'lucide-react'

// Types pour les données de la session
interface SaleDetail {
  id: string
  total_amount: number
  donation?: number
  payment_method?: string
  created_at: string
  operator_id?: string
}

interface CashSessionDetail {
  id: string
  operator_id: string
  operator_name?: string
  site_id: string
  site_name?: string
  initial_amount: number
  current_amount: number
  status: string
  opened_at: string
  closed_at?: string
  total_sales: number
  total_items: number
  closing_amount?: number
  actual_amount?: number
  variance?: number
  variance_comment?: string
  sales: SaleDetail[]
}

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
`

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #374151;
  transition: all 0.2s ease;

  &:hover {
    background: #e5e7eb;
    border-color: #9ca3af;
  }
`

const Title = styled.h1`
  margin: 0;
  font-size: 1.8rem;
  color: #1f2937;
`

const LoadingState = styled.div`
  padding: 60px 0;
  text-align: center;
  color: #4b5563;
  font-size: 1.1rem;
`

const ErrorState = styled.div`
  padding: 24px;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 10px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const SessionInfo = styled.div`
  background: white;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.06);
  border: 1px solid #e5e7eb;
  margin-bottom: 24px;
`

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`

const InfoIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #dbeafe;
  border-radius: 8px;
  color: #1d4ed8;
`

const InfoContent = styled.div`
  flex: 1;
`

const InfoLabel = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 4px;
`

const InfoValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
`

const StatusBadge = styled.span<{ variant?: 'open' | 'closed' }>`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${(props) => (props.variant === 'open' ? '#dcfce7' : '#fee2e2')};
  color: ${(props) => (props.variant === 'open' ? '#166534' : '#991b1b')};
`

const SalesSection = styled.div`
  background: white;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.06);
  border: 1px solid #e5e7eb;
`

const SectionTitle = styled.h2`
  margin: 0 0 20px 0;
  font-size: 1.3rem;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 12px;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const Th = styled.th`
  text-align: left;
  padding: 12px;
  background: #f9fafb;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #4b5563;
  border-bottom: 1px solid #e5e7eb;
`

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.95rem;
  color: #1f2937;
`

const EmptyState = styled.div`
  padding: 32px;
  text-align: center;
  color: #6b7280;
  font-size: 0.95rem;
`

/**
 * Formate un montant en devise EUR
 * @param value - Montant à formater
 * @returns Montant formaté
 */
const formatCurrency = (value: number) => {
  return value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

/**
 * Formate une date ISO en format français localisé
 * @param dateString - Chaîne de date ISO
 * @returns Date formatée ou "N/A" si invalide
 */
const formatDate = (dateString: string) => {
  if (!dateString) {
    return 'N/A'
  }
  
  const date = new Date(dateString)
  
  // Vérifier que la date est valide
  if (isNaN(date.getTime())) {
    return 'N/A'
  }
  
  return date.toLocaleString('fr-FR')
}

/**
 * Calcule et formate la durée entre deux dates
 * @param openedAt - Date d'ouverture (ISO string)
 * @param closedAt - Date de fermeture (ISO string, optionnel)
 * @returns Durée formatée (ex: "2h 30m") ou "N/A" si invalide
 */
const formatDuration = (openedAt: string, closedAt?: string) => {
  if (!openedAt) {
    return 'N/A'
  }
  
  const start = new Date(openedAt)
  
  // Vérifier que la date de début est valide
  if (isNaN(start.getTime())) {
    return 'N/A'
  }
  
  const end = closedAt ? new Date(closedAt) : new Date()
  
  // Vérifier que la date de fin est valide
  if (closedAt && isNaN(end.getTime())) {
    return 'N/A'
  }
  
  const diffMs = end.getTime() - start.getTime()
  
  if (diffMs <= 0 || isNaN(diffMs)) return '0h 00m'
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  // Vérifier que les valeurs sont valides
  if (isNaN(hours) || isNaN(minutes)) {
    return 'N/A'
  }
  
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`
}

const CashSessionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<CashSessionDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('ID de session manquant')
      setLoading(false)
      return
    }

    const fetchSessionDetail = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // TODO: Remplacer par l'appel API réel
        const response = await fetch(`/api/v1/cash-sessions/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        setSession(data)
      } catch (err) {
        console.error('Erreur lors du chargement de la session:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchSessionDetail()
  }, [id])

  const handleBack = () => {
    navigate('/admin/dashboard')
  }

  if (loading) {
    return (
      <Container>
        <LoadingState>Chargement des détails de la session...</LoadingState>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Header>
          <BackButton onClick={handleBack}>
            <ArrowLeft size={16} />
            Retour
          </BackButton>
          <Title>Erreur</Title>
        </Header>
        <ErrorState>
          <div>{error}</div>
          <BackButton onClick={handleBack}>
            Retour au dashboard
          </BackButton>
        </ErrorState>
      </Container>
    )
  }

  if (!session) {
    return (
      <Container>
        <Header>
          <BackButton onClick={handleBack}>
            <ArrowLeft size={16} />
            Retour
          </BackButton>
          <Title>Session non trouvée</Title>
        </Header>
        <ErrorState>
          <div>La session demandée n'a pas été trouvée.</div>
          <BackButton onClick={handleBack}>
            Retour au dashboard
          </BackButton>
        </ErrorState>
      </Container>
    )
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={handleBack}>
          <ArrowLeft size={16} />
          Retour
        </BackButton>
        <Title>Détail de la Session de Caisse</Title>
      </Header>

      <SessionInfo>
        <InfoGrid>
          <InfoItem>
            <InfoIcon>
              <User size={20} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Opérateur</InfoLabel>
              <InfoValue>{session.operator_name || 'Inconnu'}</InfoValue>
            </InfoContent>
          </InfoItem>

          <InfoItem>
            <InfoIcon>
              <Calendar size={20} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Ouverture</InfoLabel>
              <InfoValue>{formatDate(session.opened_at)}</InfoValue>
            </InfoContent>
          </InfoItem>

          {session.closed_at && (
            <InfoItem>
              <InfoIcon>
                <Clock size={20} />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Fermeture</InfoLabel>
                <InfoValue>{formatDate(session.closed_at)}</InfoValue>
              </InfoContent>
            </InfoItem>
          )}

          <InfoItem>
            <InfoIcon>
              <DollarSign size={20} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Montant initial</InfoLabel>
              <InfoValue>{formatCurrency(session.initial_amount)}</InfoValue>
            </InfoContent>
          </InfoItem>

          <InfoItem>
            <InfoIcon>
              <DollarSign size={20} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Total des ventes</InfoLabel>
              <InfoValue>{formatCurrency(session.total_sales)}</InfoValue>
            </InfoContent>
          </InfoItem>

          <InfoItem>
            <InfoIcon>
              <Package size={20} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Articles vendus</InfoLabel>
              <InfoValue>{session.total_items}</InfoValue>
            </InfoContent>
          </InfoItem>
        </InfoGrid>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <InfoLabel>Statut:</InfoLabel>
          <StatusBadge variant={session.status === 'open' ? 'open' : 'closed'}>
            {session.status === 'open' ? 'Ouverte' : 'Fermée'}
          </StatusBadge>
        </div>

        {session.variance !== undefined && (
          <div style={{ 
            padding: '16px', 
            background: session.variance === 0 ? '#f0fdf4' : '#fef2f2', 
            border: `1px solid ${session.variance === 0 ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '8px',
            marginTop: '16px'
          }}>
            <InfoLabel>Contrôle de caisse</InfoLabel>
            <div style={{ marginTop: '8px' }}>
              <div>Montant théorique: {formatCurrency(session.closing_amount || 0)}</div>
              <div>Montant physique: {formatCurrency(session.actual_amount || 0)}</div>
              <div style={{ 
                fontWeight: '600', 
                color: session.variance === 0 ? '#166534' : '#991b1b' 
              }}>
                Écart: {formatCurrency(session.variance)}
              </div>
              {session.variance_comment && (
                <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
                  Commentaire: {session.variance_comment}
                </div>
              )}
            </div>
          </div>
        )}
      </SessionInfo>

      <SalesSection>
        <SectionTitle>
          <Package size={20} />
          Journal des Ventes ({session.sales.length} vente{session.sales.length > 1 ? 's' : ''})
        </SectionTitle>
        
        {session.sales.length === 0 ? (
          <EmptyState>Aucune vente enregistrée pour cette session.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Heure</Th>
                <Th>Montant</Th>
                <Th>Don</Th>
                <Th>Paiement</Th>
                <Th>Opérateur</Th>
              </tr>
            </thead>
            <tbody>
              {session.sales.map((sale) => (
                <tr key={sale.id}>
                  <Td>{formatDate(sale.created_at)}</Td>
                  <Td>{formatCurrency(sale.total_amount)}</Td>
                  <Td>{sale.donation ? formatCurrency(sale.donation) : '-'}</Td>
                  <Td>{sale.payment_method || 'Non spécifié'}</Td>
                  <Td>{sale.operator_id || '-'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </SalesSection>
    </Container>
  )
}

export default CashSessionDetail
