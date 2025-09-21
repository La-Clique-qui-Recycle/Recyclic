import React, { useState } from 'react'
import styled from 'styled-components'
import { Calculator, Package, DollarSign } from 'lucide-react'
import CategorySelector from './CategorySelector'

const CashRegisterContainer = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  max-width: 800px;
  margin: 0 auto;
`

const Title = styled.h1`
  color: #333;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const Section = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
`

const SectionTitle = styled.h2`
  color: #333;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const InputGroup = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
`

const Label = styled.label`
  font-weight: bold;
  min-width: 100px;
`

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex: 1;
`

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  background: ${props => props.$variant === 'primary' ? '#2c5530' : '#6c757d'};
  color: white;
  cursor: pointer;
  font-weight: bold;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Summary = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1rem;
`

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  
  &:last-child {
    font-weight: bold;
    font-size: 1.2rem;
    border-top: 1px solid #ddd;
    padding-top: 0.5rem;
    margin-top: 1rem;
  }
`

interface CashRegisterProps {
  onComplete?: (sale: any) => void
}

export const CashRegister: React.FC<CashRegisterProps> = ({ onComplete }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [unitPrice, setUnitPrice] = useState<number>(0)
  const [items, setItems] = useState<Array<{category: string, quantity: number, unitPrice: number}>>([])

  const addItem = () => {
    if (selectedCategory && quantity > 0 && unitPrice > 0) {
      setItems([...items, { category: selectedCategory, quantity, unitPrice }])
      setSelectedCategory('')
      setQuantity(1)
      setUnitPrice(0)
    }
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

  const completeSale = () => {
    if (items.length > 0 && onComplete) {
      onComplete({
        items,
        totalAmount,
        timestamp: new Date().toISOString()
      })
    }
  }

  return (
    <CashRegisterContainer>
      <Title>
        <Calculator size={24} />
        Interface Caisse
      </Title>

      <Section>
        <SectionTitle>
          <Package size={20} />
          Sélection des Articles
        </SectionTitle>
        
        <CategorySelector 
          onSelect={setSelectedCategory}
          selectedCategory={selectedCategory}
        />
        
        <InputGroup>
          <Label>Quantité:</Label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            min="1"
            data-testid="quantity-input"
          />
        </InputGroup>
        
        <InputGroup>
          <Label>Prix unitaire:</Label>
          <Input
            type="number"
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value))}
            min="0"
            step="0.01"
            data-testid="price-input"
          />
        </InputGroup>
        
        <Button onClick={addItem} disabled={!selectedCategory || quantity <= 0 || unitPrice <= 0} data-testid="add-item-button">
          Ajouter l'article
        </Button>
      </Section>

      {items.length > 0 && (
        <Section>
          <SectionTitle>
            <DollarSign size={20} />
            Récapitulatif
          </SectionTitle>
          
          {items.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span>{item.category} x{item.quantity} @ {item.unitPrice}€</span>
              <div>
                <span style={{ marginRight: '1rem' }}>{(item.quantity * item.unitPrice).toFixed(2)}€</span>
                <Button $variant="secondary" onClick={() => removeItem(index)} data-testid="remove-item-button">
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
          
          <Summary>
            <SummaryRow>
              <span>Total:</span>
              <span>{totalAmount.toFixed(2)}€</span>
            </SummaryRow>
          </Summary>
          
        <Button $variant="primary" onClick={completeSale} data-testid="finalize-sale-button">
            Finaliser la vente
          </Button>
        </Section>
      )}
    </CashRegisterContainer>
  )
}

export default CashRegister
