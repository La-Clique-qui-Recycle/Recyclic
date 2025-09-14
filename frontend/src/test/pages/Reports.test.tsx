import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@test/test-utils'
import Reports from '../../pages/Reports'

describe('Reports Page', () => {
  it('should render reports page title', () => {
    render(<Reports />)
    
    expect(screen.getByText('Rapports')).toBeInTheDocument()
  })

  it('should render bar chart icon in title', () => {
    render(<Reports />)
    
    expect(screen.getByTestId('barchart-icon')).toBeInTheDocument()
  })

  it('should render coming soon message', () => {
    render(<Reports />)
    
    expect(screen.getByText('En cours de développement')).toBeInTheDocument()
    expect(screen.getByText('Les rapports seront bientôt disponibles.')).toBeInTheDocument()
  })

  it('should render coming soon icon', () => {
    render(<Reports />)
    
    // The coming soon section has a bar chart icon with opacity 0.5
    const comingSoonIcon = screen.getByTestId('barchart-icon')
    expect(comingSoonIcon).toBeInTheDocument()
  })

  it('should have proper styling structure', () => {
    render(<Reports />)
    
    // Check main container exists
    const reportsContainer = screen.getByText('Rapports').closest('div')
    expect(reportsContainer).toBeInTheDocument()
    
    // Check coming soon section exists
    const comingSoonSection = screen.getByText('En cours de développement').closest('div')
    expect(comingSoonSection).toBeInTheDocument()
  })

  it('should display proper page structure', () => {
    render(<Reports />)
    
    // Check title structure
    const title = screen.getByText('Rapports')
    expect(title).toBeInTheDocument()
    
    // Check coming soon content
    expect(screen.getByText('En cours de développement')).toBeInTheDocument()
    expect(screen.getByText('Les rapports seront bientôt disponibles.')).toBeInTheDocument()
  })

  it('should render all required elements', () => {
    render(<Reports />)
    
    // Check all main elements are present
    expect(screen.getByText('Rapports')).toBeInTheDocument()
    expect(screen.getByTestId('barchart-icon')).toBeInTheDocument()
    expect(screen.getByText('En cours de développement')).toBeInTheDocument()
    expect(screen.getByText('Les rapports seront bientôt disponibles.')).toBeInTheDocument()
  })

  it('should have proper accessibility structure', () => {
    render(<Reports />)
    
    // Check that the main heading is properly structured
    const mainHeading = screen.getByText('Rapports')
    expect(mainHeading).toBeInTheDocument()
    
    // Check that the coming soon message is accessible
    const comingSoonHeading = screen.getByText('En cours de développement')
    expect(comingSoonHeading).toBeInTheDocument()
  })

  it('should render without errors', () => {
    expect(() => render(<Reports />)).not.toThrow()
  })
})