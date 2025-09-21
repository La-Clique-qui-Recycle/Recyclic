import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test-utils'
import CashRegister from '../../components/business/CashRegister'
import TicketDisplay from '../../components/business/TicketDisplay'

describe('Cash Register Integration Workflow', () => {
  it('should complete full cash register workflow', async () => {
    const onComplete = vi.fn()
    render(<CashRegister onComplete={onComplete} />)
    
    // Step 1: Select first item
    fireEvent.click(screen.getByTestId('category-EEE-1'))
    fireEvent.change(screen.getByTestId('quantity-input'), { target: { value: '2' } })
    fireEvent.change(screen.getByTestId('price-input'), { target: { value: '10' } })
    fireEvent.click(screen.getByTestId('add-item-button'))
    
    // Step 2: Select second item
    fireEvent.click(screen.getByTestId('category-EEE-3'))
    fireEvent.change(screen.getByTestId('quantity-input'), { target: { value: '1' } })
    fireEvent.change(screen.getByTestId('price-input'), { target: { value: '25' } })
    fireEvent.click(screen.getByTestId('add-item-button'))
    
    // Step 3: Verify items are displayed
    expect(screen.getByText('EEE-1 x2 @ 10€')).toBeInTheDocument()
    // Montant de la première ligne (côté item)
    expect(screen.getAllByText('20.00€')[0]).toBeInTheDocument()
    expect(screen.getByText('EEE-3 x1 @ 25€')).toBeInTheDocument()
    expect(screen.getByText('25.00€')).toBeInTheDocument()
    
    // Step 4: Verify total
    expect(screen.getByText('45.00€')).toBeInTheDocument()
    
    // Step 5: Complete sale
    fireEvent.click(screen.getByTestId('finalize-sale-button'))
    
    // Step 6: Verify onComplete was called with correct data
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith({
        items: [
          { category: 'EEE-1', quantity: 2, unitPrice: 10 },
          { category: 'EEE-3', quantity: 1, unitPrice: 25 }
        ],
        totalAmount: 45,
        timestamp: expect.any(String)
      })
    })
  })

  it('should handle item removal in workflow', () => {
    render(<CashRegister />)
    
    // Add two items
    fireEvent.click(screen.getByTestId('category-EEE-1'))
    fireEvent.change(screen.getByTestId('quantity-input'), { target: { value: '1' } })
    fireEvent.change(screen.getByTestId('price-input'), { target: { value: '10' } })
    fireEvent.click(screen.getByTestId('add-item-button'))
    
    fireEvent.click(screen.getByTestId('category-EEE-2'))
    fireEvent.change(screen.getByTestId('quantity-input'), { target: { value: '2' } })
    fireEvent.change(screen.getByTestId('price-input'), { target: { value: '5' } })
    fireEvent.click(screen.getByTestId('add-item-button'))
    
    // Verify both items are there
    expect(screen.getByText('EEE-1 x1 @ 10€')).toBeInTheDocument()
    expect(screen.getByText('EEE-2 x2 @ 5€')).toBeInTheDocument()
    expect(screen.getByText('20.00€')).toBeInTheDocument()
    
    // Remove first item
    const removeButtons = screen.getAllByTestId('remove-item-button')
    fireEvent.click(removeButtons[0])
    
    // Verify only second item remains
    expect(screen.queryByText('EEE-1 x1 @ 10€')).not.toBeInTheDocument()
    expect(screen.getByText('EEE-2 x2 @ 5€')).toBeInTheDocument()
    // Après suppression: vérifier le total restant en ciblant l’occurrence unique attendue
    expect(screen.getAllByText('10.00€')[0]).toBeInTheDocument()
  })

  it('should reset form after each item addition', () => {
    render(<CashRegister />)
    
    // Add first item
    fireEvent.click(screen.getByTestId('category-EEE-1'))
    fireEvent.change(screen.getByTestId('quantity-input'), { target: { value: '3' } })
    fireEvent.change(screen.getByTestId('price-input'), { target: { value: '15' } })
    fireEvent.click(screen.getByTestId('add-item-button'))
    
    // Verify form is reset
    expect(screen.getByTestId('quantity-input')).toHaveValue(1) // quantity reset
    expect(screen.getByTestId('price-input')).toHaveValue(0) // price reset
    
    // Add second item
    fireEvent.click(screen.getByTestId('category-EEE-2'))
    fireEvent.change(screen.getByTestId('quantity-input'), { target: { value: '2' } })
    fireEvent.change(screen.getByTestId('price-input'), { target: { value: '8' } })
    fireEvent.click(screen.getByTestId('add-item-button'))
    
    // Verify both items are added
    expect(screen.getByText('EEE-1 x3 @ 15€')).toBeInTheDocument()
    expect(screen.getByText('EEE-2 x2 @ 8€')).toBeInTheDocument()
  })

  it('should not allow adding incomplete items', () => {
    render(<CashRegister />)
    
    // Try to add without selecting category
    fireEvent.change(screen.getByTestId('quantity-input'), { target: { value: '2' } })
    fireEvent.change(screen.getByTestId('price-input'), { target: { value: '10' } })
    
    const addButton = screen.getByTestId('add-item-button')
    expect(addButton).toBeDisabled()
    
    // Select category but keep quantity 0
    fireEvent.click(screen.getByTestId('category-EEE-1'))
    fireEvent.change(screen.getByTestId('quantity-input'), { target: { value: '0' } })
    
    expect(addButton).toBeDisabled()
    
    // Set quantity but keep price 0
    fireEvent.change(screen.getByTestId('quantity-input'), { target: { value: '1' } })
    fireEvent.change(screen.getByTestId('price-input'), { target: { value: '0' } })
    
    expect(addButton).toBeDisabled()
  })

  it('should display correct total calculation', () => {
    render(<CashRegister />)
    
    // Add multiple items with different quantities and prices
    const items = [
      { category: 'EEE-1', quantity: 2, price: 10 },
      { category: 'EEE-3', quantity: 1, price: 25.50 },
      { category: 'EEE-5', quantity: 3, price: 5.25 }
    ]
    
    items.forEach((item, index) => {
      fireEvent.click(screen.getByTestId(`category-${item.category}`))
      fireEvent.change(screen.getByTestId('quantity-input'), { target: { value: item.quantity.toString() } })
      fireEvent.change(screen.getByTestId('price-input'), { target: { value: item.price.toString() } })
      fireEvent.click(screen.getByTestId('add-item-button'))
    })
    
    // Calculate expected total: (2*10) + (1*25.50) + (3*5.25) = 20 + 25.50 + 15.75 = 61.25
    expect(screen.getByText('61.25€')).toBeInTheDocument()
  })
})
