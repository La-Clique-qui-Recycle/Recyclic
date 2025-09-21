import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '../test-utils'
import CashRegister from '../../pages/CashRegister'

describe('CashRegister Page', () => {
  it('should render the cash register page with title', () => {
    render(<CashRegister />)
    
    expect(screen.getByText('Interface Caisse')).toBeInTheDocument()
    expect(screen.getByText('En cours de développement')).toBeInTheDocument()
    expect(screen.getByText("L'interface de caisse sera bientôt disponible.")).toBeInTheDocument()
  })

  it('should render calculator icon', () => {
    render(<CashRegister />)
    
    expect(screen.getByTestId('calculator-icon')).toBeInTheDocument()
  })

  it('should render package icon in coming soon section', () => {
    render(<CashRegister />)
    
    expect(screen.getByTestId('package-icon')).toBeInTheDocument()
  })

  it('should have proper styling classes', () => {
    render(<CashRegister />)
    
    const container = screen.getByTestId('cashregister-container')
    expect(container).toHaveStyle({
      background: 'white',
      padding: '2rem',
      borderRadius: '8px'
    })
  })

  it('should display coming soon message with proper styling', () => {
    render(<CashRegister />)
    
    const comingSoon = screen.getByTestId('coming-soon')
    expect(comingSoon).toHaveStyle({
      textAlign: 'center',
      padding: '3rem',
      color: '#666'
    })
  })
})
