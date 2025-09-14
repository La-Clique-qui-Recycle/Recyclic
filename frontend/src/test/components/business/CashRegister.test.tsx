import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@test/test-utils'
import { CashRegister } from '../../../components/business/CashRegister'

// Mock du composant CategorySelector
vi.mock('../../../components/business/CategorySelector', () => ({
  default: ({ onSelect, selectedCategory }: any) => (
    <div data-testid="category-selector">
      <button 
        data-testid="category-EEE-1" 
        onClick={() => onSelect('EEE-1')}
        style={{ 
          border: selectedCategory === 'EEE-1' ? '2px solid #2c5530' : '1px solid #ddd',
          background: selectedCategory === 'EEE-1' ? '#e8f5e8' : 'white'
        }}
      >
        EEE-1
      </button>
      <button 
        data-testid="category-EEE-2" 
        onClick={() => onSelect('EEE-2')}
        style={{ 
          border: selectedCategory === 'EEE-2' ? '2px solid #2c5530' : '1px solid #ddd',
          background: selectedCategory === 'EEE-2' ? '#e8f5e8' : 'white'
        }}
      >
        EEE-2
      </button>
      <button 
        data-testid="category-EEE-3" 
        onClick={() => onSelect('EEE-3')}
        style={{ 
          border: selectedCategory === 'EEE-3' ? '2px solid #2c5530' : '1px solid #ddd',
          background: selectedCategory === 'EEE-3' ? '#e8f5e8' : 'white'
        }}
      >
        EEE-3
      </button>
    </div>
  )
}))

describe('CashRegister Component', () => {
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render cash register interface', () => {
    render(<CashRegister />)
    
    expect(screen.getByText('Interface Caisse')).toBeInTheDocument()
    expect(screen.getByText('Sélection des Articles')).toBeInTheDocument()
    expect(screen.getByText('Quantité:')).toBeInTheDocument()
    expect(screen.getByText('Prix unitaire:')).toBeInTheDocument()
  })

  it('should render calculator icon in title', () => {
    render(<CashRegister />)
    
    expect(screen.getByTestId('calculator-icon')).toBeInTheDocument()
  })

  it('should render category selector', () => {
    render(<CashRegister />)
    
    expect(screen.getByTestId('category-selector')).toBeInTheDocument()
    expect(screen.getByTestId('category-EEE-1')).toBeInTheDocument()
    expect(screen.getByTestId('category-EEE-2')).toBeInTheDocument()
    expect(screen.getByTestId('category-EEE-3')).toBeInTheDocument()
  })

  it('should have default values for quantity and price', () => {
    render(<CashRegister />)
    
    const quantityInput = screen.getByDisplayValue('1')
    const priceInput = screen.getByDisplayValue('0')
    
    expect(quantityInput).toBeInTheDocument()
    expect(priceInput).toBeInTheDocument()
  })

  it('should update quantity when input changes', () => {
    render(<CashRegister />)
    
    const quantityInput = screen.getByDisplayValue('1')
    fireEvent.change(quantityInput, { target: { value: '3' } })
    
    expect(quantityInput).toHaveValue(3)
  })

  it('should update unit price when input changes', () => {
    render(<CashRegister />)
    
    const priceInput = screen.getByDisplayValue('0')
    fireEvent.change(priceInput, { target: { value: '15.50' } })
    
    expect(priceInput).toHaveValue(15.50)
  })

  it('should disable add button when form is incomplete', () => {
    render(<CashRegister />)
    
    const addButton = screen.getByText('Ajouter l\'article')
    expect(addButton).toBeDisabled()
  })

  it('should enable add button when form is complete', () => {
    render(<CashRegister />)
    
    // Select category
    fireEvent.click(screen.getByTestId('category-EEE-1'))
    
    // Set quantity and price
    const quantityInput = screen.getByDisplayValue('1')
    const priceInput = screen.getByDisplayValue('0')
    fireEvent.change(quantityInput, { target: { value: '2' } })
    fireEvent.change(priceInput, { target: { value: '10' } })
    
    const addButton = screen.getByText('Ajouter l\'article')
    expect(addButton).not.toBeDisabled()
  })

  it('should add item when form is complete and button clicked', () => {
    render(<CashRegister />)
    
    // Fill form
    fireEvent.click(screen.getByTestId('category-EEE-1'))
    const quantityInput = screen.getByDisplayValue('1')
    const priceInput = screen.getByDisplayValue('0')
    fireEvent.change(quantityInput, { target: { value: '2' } })
    fireEvent.change(priceInput, { target: { value: '15.50' } })
    
    // Add item
    fireEvent.click(screen.getByText('Ajouter l\'article'))
    
    // Check item was added
    expect(screen.getByText('EEE-1 x2 @ 15.5€')).toBeInTheDocument()
    expect(screen.getByText('31.00€')).toBeInTheDocument()
  })

  it('should reset form after adding item', () => {
    render(<CashRegister />)
    
    // Fill and add item
    fireEvent.click(screen.getByTestId('category-EEE-1'))
    const quantityInput = screen.getByDisplayValue('1')
    const priceInput = screen.getByDisplayValue('0')
    fireEvent.change(quantityInput, { target: { value: '2' } })
    fireEvent.change(priceInput, { target: { value: '10' } })
    fireEvent.click(screen.getByText('Ajouter l\'article'))
    
    // Check form is reset
    expect(screen.getByDisplayValue('1')).toBeInTheDocument() // quantity reset
    expect(screen.getByDisplayValue('0')).toBeInTheDocument() // price reset
    expect(screen.getByText('Ajouter l\'article')).toBeDisabled() // button disabled
  })

  it('should show summary section when items are added', () => {
    render(<CashRegister />)
    
    // Initially no summary
    expect(screen.queryByText('Récapitulatif')).not.toBeInTheDocument()
    
    // Add item
    fireEvent.click(screen.getByTestId('category-EEE-1'))
    const quantityInput = screen.getByDisplayValue('1')
    const priceInput = screen.getByDisplayValue('0')
    fireEvent.change(quantityInput, { target: { value: '1' } })
    fireEvent.change(priceInput, { target: { value: '10' } })
    fireEvent.click(screen.getByText('Ajouter l\'article'))
    
    // Summary should appear
    expect(screen.getByText('Récapitulatif')).toBeInTheDocument()
    expect(screen.getByText('Total:')).toBeInTheDocument()
    expect(screen.getByText('10.00€')).toBeInTheDocument()
  })

  it('should calculate total correctly for multiple items', () => {
    render(<CashRegister />)
    
    // Add first item
    fireEvent.click(screen.getByTestId('category-EEE-1'))
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '2' } })
    fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '10' } })
    fireEvent.click(screen.getByText('Ajouter l\'article'))
    
    // Add second item
    fireEvent.click(screen.getByTestId('category-EEE-2'))
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '1' } })
    fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '5' } })
    fireEvent.click(screen.getByText('Ajouter l\'article'))
    
    // Check total
    expect(screen.getByText('25.00€')).toBeInTheDocument()
  })

  it('should remove item when remove button clicked', () => {
    render(<CashRegister />)
    
    // Add item
    fireEvent.click(screen.getByTestId('category-EEE-1'))
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '1' } })
    fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '10' } })
    fireEvent.click(screen.getByText('Ajouter l\'article'))
    
    // Remove item
    fireEvent.click(screen.getByText('Supprimer'))
    
    expect(screen.queryByText('EEE-1 x1 @ 10€')).not.toBeInTheDocument()
  })

  it('should call onComplete when sale is finalized', () => {
    render(<CashRegister onComplete={mockOnComplete} />)
    
    // Add item
    fireEvent.click(screen.getByTestId('category-EEE-1'))
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '1' } })
    fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '20' } })
    fireEvent.click(screen.getByText('Ajouter l\'article'))
    
    // Complete sale
    fireEvent.click(screen.getByText('Finaliser la vente'))
    
    expect(mockOnComplete).toHaveBeenCalledWith({
      items: [{ category: 'EEE-1', quantity: 1, unitPrice: 20 }],
      totalAmount: 20,
      timestamp: expect.any(String)
    })
  })

  it('should not show finalize button when no items', () => {
    render(<CashRegister />)
    
    expect(screen.queryByText('Finaliser la vente')).not.toBeInTheDocument()
  })

  it('should handle decimal prices correctly', () => {
    render(<CashRegister />)
    
    // Add item with decimal price
    fireEvent.click(screen.getByTestId('category-EEE-1'))
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '2' } })
    fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '12.75' } })
    fireEvent.click(screen.getByText('Ajouter l\'article'))
    
    // Check calculation
    expect(screen.getByText('25.50€')).toBeInTheDocument()
  })

  it('should handle zero quantity correctly', () => {
    render(<CashRegister />)
    
    // Set quantity to 0
    fireEvent.click(screen.getByTestId('category-EEE-1'))
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '0' } })
    fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '10' } })
    
    const addButton = screen.getByText('Ajouter l\'article')
    expect(addButton).toBeDisabled()
  })

  it('should handle zero price correctly', () => {
    render(<CashRegister />)
    
    // Set price to 0
    fireEvent.click(screen.getByTestId('category-EEE-1'))
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '1' } })
    fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '0' } })
    
    const addButton = screen.getByText('Ajouter l\'article')
    expect(addButton).toBeDisabled()
  })

  it('should not call onComplete when no items', () => {
    render(<CashRegister onComplete={mockOnComplete} />)
    
    // Try to complete without items (button shouldn't be visible)
    expect(screen.queryByText('Finaliser la vente')).not.toBeInTheDocument()
    expect(mockOnComplete).not.toHaveBeenCalled()
  })

  it('should maintain item order when adding multiple items', () => {
    render(<CashRegister />)
    
    // Add first item
    fireEvent.click(screen.getByTestId('category-EEE-1'))
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '1' } })
    fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '10' } })
    fireEvent.click(screen.getByText('Ajouter l\'article'))
    
    // Add second item
    fireEvent.click(screen.getByTestId('category-EEE-2'))
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '1' } })
    fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '5' } })
    fireEvent.click(screen.getByText('Ajouter l\'article'))
    
    // Check order
    const items = screen.getAllByText(/EEE-\d x\d/)
    expect(items[0]).toHaveTextContent('EEE-1 x1')
    expect(items[1]).toHaveTextContent('EEE-2 x1')
  })
})