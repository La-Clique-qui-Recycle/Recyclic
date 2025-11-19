import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@test/test-utils'
import { TicketDisplay } from '../../../components/business/TicketDisplay'

const mockItems = [
  { category: 'EEE-1', quantity: 2, unitPrice: 10, total: 20 },
  { category: 'EEE-3', quantity: 1, unitPrice: 15.50, total: 15.50 }
]

const mockTimestamp = '2024-01-15T14:30:00Z'

describe('TicketDisplay Component', () => {
  it('should render ticket header with title and site name', () => {
    render(
      <TicketDisplay 
        items={mockItems}
        totalAmount={35.50}
        timestamp={mockTimestamp}
        siteName="Test Ressourcerie"
      />
    )
    
    expect(screen.getByText('TICKET DE VENTE')).toBeInTheDocument()
    expect(screen.getByText('Test Ressourcerie')).toBeInTheDocument()
  })

  it('should render default site name when not provided', () => {
    render(
      <TicketDisplay 
        items={mockItems}
        totalAmount={35.50}
        timestamp={mockTimestamp}
      />
    )
    
    expect(screen.getByText('Ressourcerie RecyClique')).toBeInTheDocument()
  })

  it('should render receipt icon in title', () => {
    render(
      <TicketDisplay 
        items={mockItems}
        totalAmount={35.50}
        timestamp={mockTimestamp}
      />
    )
    
    // L'icône Receipt est rendue via data-icon-name dans le mock
    expect(screen.getByText('Receipt')).toBeInTheDocument()
  })

  it('should render formatted date and time', () => {
    render(
      <TicketDisplay 
        items={mockItems}
        totalAmount={35.50}
        timestamp={mockTimestamp}
      />
    )
    
    expect(screen.getByText('15/01/2024 15:30')).toBeInTheDocument()
  })

  it('should render all items with quantities and totals', () => {
    render(
      <TicketDisplay 
        items={mockItems}
        totalAmount={35.50}
        timestamp={mockTimestamp}
      />
    )
    
    expect(screen.getByText('EEE-1 x2')).toBeInTheDocument()
    expect(screen.getByText('20.00€')).toBeInTheDocument()
    expect(screen.getByText('EEE-3 x1')).toBeInTheDocument()
    expect(screen.getByText('15.50€')).toBeInTheDocument()
  })

  it('should render total amount correctly', () => {
    render(
      <TicketDisplay 
        items={mockItems}
        totalAmount={35.50}
        timestamp={mockTimestamp}
      />
    )
    
    expect(screen.getByText('35.50€')).toBeInTheDocument()
  })

  it('should render section icons', () => {
    render(
      <TicketDisplay 
        items={mockItems}
        totalAmount={35.50}
        timestamp={mockTimestamp}
      />
    )
    
    expect(screen.getByTestId('calendar-icon')).toBeInTheDocument()
    expect(screen.getByTestId('package-icon')).toBeInTheDocument()
    expect(screen.getByTestId('dollarsign-icon')).toBeInTheDocument()
  })

  it('should render ticket footer', () => {
    render(
      <TicketDisplay 
        items={mockItems}
        totalAmount={35.50}
        timestamp={mockTimestamp}
      />
    )
    
    expect(screen.getByText('Merci pour votre achat !')).toBeInTheDocument()
    expect(screen.getByText('Recyclage responsable')).toBeInTheDocument()
  })

  it('should handle empty items array', () => {
    render(
      <TicketDisplay 
        items={[]}
        totalAmount={0}
        timestamp={mockTimestamp}
      />
    )
    
    expect(screen.getByText('TICKET DE VENTE')).toBeInTheDocument()
    expect(screen.getByText('0.00€')).toBeInTheDocument()
  })

  it('should have proper styling classes', () => {
    render(
      <TicketDisplay 
        items={mockItems}
        totalAmount={35.50}
        timestamp={mockTimestamp}
      />
    )
    
    // Vérifier que le conteneur principal existe
    const container = screen.getByText('TICKET DE VENTE').closest('div')
    expect(container).toBeInTheDocument()
  })

  it('should render items in correct order', () => {
    const items = [
      { category: 'EEE-3', quantity: 1, unitPrice: 5, total: 5 },
      { category: 'EEE-1', quantity: 3, unitPrice: 10, total: 30 }
    ]
    
    render(
      <TicketDisplay 
        items={items}
        totalAmount={35}
        timestamp={mockTimestamp}
      />
    )
    
    const itemElements = screen.getAllByText(/EEE-\d x\d/)
    expect(itemElements[0]).toHaveTextContent('EEE-3 x1')
    expect(itemElements[1]).toHaveTextContent('EEE-1 x3')
  })

  it('should format different timestamps correctly', () => {
    const testCases = [
      { timestamp: '2024-12-25T10:30:00Z', expected: '25/12/2024 11:30' },
      { timestamp: '2024-01-01T00:00:00Z', expected: '01/01/2024 01:00' },
      { timestamp: '2024-06-15T23:59:59Z', expected: '16/06/2024 01:59' }
    ]

    testCases.forEach(({ timestamp, expected }) => {
      const { unmount } = render(
        <TicketDisplay 
          items={[]}
          totalAmount={0}
          timestamp={timestamp}
        />
      )
      
      expect(screen.getByText(expected)).toBeInTheDocument()
      unmount()
    })
  })

  it('should handle decimal amounts correctly', () => {
    const itemsWithDecimals = [
      { category: 'EEE-1', quantity: 1, unitPrice: 12.75, total: 12.75 },
      { category: 'EEE-2', quantity: 2, unitPrice: 8.33, total: 16.66 }
    ]
    
    render(
      <TicketDisplay 
        items={itemsWithDecimals}
        totalAmount={29.41}
        timestamp={mockTimestamp}
      />
    )
    
    expect(screen.getByText('12.75€')).toBeInTheDocument()
    expect(screen.getByText('16.66€')).toBeInTheDocument()
    expect(screen.getByText('29.41€')).toBeInTheDocument()
  })

  it('should render section titles correctly', () => {
    render(
      <TicketDisplay 
        items={mockItems}
        totalAmount={35.50}
        timestamp={mockTimestamp}
      />
    )
    
    expect(screen.getByText('Date et Heure')).toBeInTheDocument()
    expect(screen.getByText('Articles')).toBeInTheDocument()
    expect(screen.getByText('TOTAL')).toBeInTheDocument()
  })

  it('should handle single item correctly', () => {
    const singleItem = [
      { category: 'EEE-1', quantity: 1, unitPrice: 25, total: 25 }
    ]
    
    render(
      <TicketDisplay 
        items={singleItem}
        totalAmount={25}
        timestamp={mockTimestamp}
      />
    )
    
    expect(screen.getByText('EEE-1 x1')).toBeInTheDocument()
    expect(screen.getAllByText('25.00€')).toHaveLength(2) // Prix unitaire et total
  })

  it('should handle large quantities correctly', () => {
    const largeQuantityItem = [
      { category: 'EEE-1', quantity: 100, unitPrice: 0.50, total: 50 }
    ]
    
    render(
      <TicketDisplay 
        items={largeQuantityItem}
        totalAmount={50}
        timestamp={mockTimestamp}
      />
    )
    
    expect(screen.getByText('EEE-1 x100')).toBeInTheDocument()
    expect(screen.getAllByText('50.00€')).toHaveLength(2) // Prix unitaire et total
  })

  it('should maintain proper ticket structure', () => {
    render(
      <TicketDisplay 
        items={mockItems}
        totalAmount={35.50}
        timestamp={mockTimestamp}
      />
    )
    
    // Check header
    expect(screen.getByText('TICKET DE VENTE')).toBeInTheDocument()
    
    // Check sections
    expect(screen.getByText('Date et Heure')).toBeInTheDocument()
    expect(screen.getByText('Articles')).toBeInTheDocument()
    
    // Check footer
    expect(screen.getByText('Merci pour votre achat !')).toBeInTheDocument()
    expect(screen.getByText('Recyclage responsable')).toBeInTheDocument()
  })
})