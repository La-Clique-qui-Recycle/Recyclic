import React from 'react'
import styled from 'styled-components'
import { Receipt, Package, DollarSign, Calendar } from 'lucide-react'

const TicketContainer = styled.div`
  background: white;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 400px;
  margin: 0 auto;
  font-family: 'Courier New', monospace;
`

const TicketHeader = styled.div`
  text-align: center;
  border-bottom: 2px dashed #333;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
`

const TicketTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #333;
`

const TicketSubtitle = styled.p`
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
`

const TicketSection = styled.div`
  margin-bottom: 1rem;
`

const SectionTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const ItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
`

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  font-size: 1.1rem;
  border-top: 1px solid #333;
  padding-top: 0.5rem;
  margin-top: 1rem;
`

const TicketFooter = styled.div`
  text-align: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px dashed #333;
  font-size: 0.8rem;
  color: #666;
`

interface TicketItem {
  category: string
  quantity: number
  unitPrice: number
  total: number
}

interface TicketDisplayProps {
  items: TicketItem[]
  totalAmount: number
  timestamp: string
  siteName?: string
}

export const TicketDisplay: React.FC<TicketDisplayProps> = ({
  items,
  totalAmount,
  timestamp,
  siteName = 'Ressourcerie Recyclic'
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <TicketContainer>
      <TicketHeader>
        <TicketTitle>
          <Receipt size={20} />
          TICKET DE VENTE
        </TicketTitle>
        <TicketSubtitle>{siteName}</TicketSubtitle>
      </TicketHeader>

      <TicketSection>
        <SectionTitle>
          <Calendar size={16} />
          Date et Heure
        </SectionTitle>
        <div>{formatDate(timestamp)}</div>
      </TicketSection>

      <TicketSection>
        <SectionTitle>
          <Package size={16} />
          Articles
        </SectionTitle>
        {items.map((item, index) => (
          <ItemRow key={index}>
            <span>{item.category} x{item.quantity}</span>
            <span>{item.total.toFixed(2)}€</span>
          </ItemRow>
        ))}
      </TicketSection>

      <TotalRow>
        <span>
          <DollarSign size={16} />
          TOTAL
        </span>
        <span>{totalAmount.toFixed(2)}€</span>
      </TotalRow>

      <TicketFooter>
        <div>Merci pour votre achat !</div>
        <div>Recyclage responsable</div>
      </TicketFooter>
    </TicketContainer>
  )
}

export default TicketDisplay
