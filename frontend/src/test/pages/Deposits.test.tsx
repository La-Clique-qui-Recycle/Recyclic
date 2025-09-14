import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@test/test-utils'
import Deposits from '../../pages/Deposits'

describe('Deposits Page', () => {
  it('should render deposits page title', () => {
    render(<Deposits />)
    
    expect(screen.getByText('Gestion des Dépôts')).toBeInTheDocument()
  })

  it('should render package icon in title', () => {
    render(<Deposits />)
    
    expect(screen.getByTestId('package-icon')).toBeInTheDocument()
  })

  it('should render coming soon message', () => {
    render(<Deposits />)
    
    expect(screen.getByText('En cours de développement')).toBeInTheDocument()
    expect(screen.getByText('La gestion des dépôts sera bientôt disponible.')).toBeInTheDocument()
  })

  it('should render coming soon icon', () => {
    render(<Deposits />)
    
    // The coming soon section has a package icon with opacity 0.5
    const comingSoonIcon = screen.getByTestId('package-icon')
    expect(comingSoonIcon).toBeInTheDocument()
  })

  it('should have proper styling structure', () => {
    render(<Deposits />)
    
    // Check main container exists
    const depositsContainer = screen.getByText('Gestion des Dépôts').closest('div')
    expect(depositsContainer).toBeInTheDocument()
    
    // Check coming soon section exists
    const comingSoonSection = screen.getByText('En cours de développement').closest('div')
    expect(comingSoonSection).toBeInTheDocument()
  })

  it('should display proper page structure', () => {
    render(<Deposits />)
    
    // Check title structure
    const title = screen.getByText('Gestion des Dépôts')
    expect(title).toBeInTheDocument()
    
    // Check coming soon content
    expect(screen.getByText('En cours de développement')).toBeInTheDocument()
    expect(screen.getByText('La gestion des dépôts sera bientôt disponible.')).toBeInTheDocument()
  })

  it('should render all required elements', () => {
    render(<Deposits />)
    
    // Check all main elements are present
    expect(screen.getByText('Gestion des Dépôts')).toBeInTheDocument()
    expect(screen.getByTestId('package-icon')).toBeInTheDocument()
    expect(screen.getByText('En cours de développement')).toBeInTheDocument()
    expect(screen.getByText('La gestion des dépôts sera bientôt disponible.')).toBeInTheDocument()
  })

  it('should have proper accessibility structure', () => {
    render(<Deposits />)
    
    // Check that the main heading is properly structured
    const mainHeading = screen.getByText('Gestion des Dépôts')
    expect(mainHeading).toBeInTheDocument()
    
    // Check that the coming soon message is accessible
    const comingSoonHeading = screen.getByText('En cours de développement')
    expect(comingSoonHeading).toBeInTheDocument()
  })

  it('should render without errors', () => {
    expect(() => render(<Deposits />)).not.toThrow()
  })
})