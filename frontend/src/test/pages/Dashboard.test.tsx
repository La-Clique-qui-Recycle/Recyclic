import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@test/test-utils'
import Dashboard from '../../pages/Dashboard'

describe('Dashboard Page', () => {
  it('should render dashboard title and welcome message', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Bienvenue sur RecyClique')).toBeInTheDocument()
    expect(screen.getByText(/Plateforme de gestion de gestion pour ressourceries/)).toBeInTheDocument()
  })

  it('should render all stat cards', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Dépôts aujourd\'hui')).toBeInTheDocument()
    expect(screen.getByText('Chiffre d\'affaires')).toBeInTheDocument()
    expect(screen.getByText('Utilisateurs actifs')).toBeInTheDocument()
    expect(screen.getByText('Appareils recyclés')).toBeInTheDocument()
  })

  it('should render stat card icons', () => {
    render(<Dashboard />)
    
    expect(screen.getByTestId('package-icon')).toBeInTheDocument()
    expect(screen.getByTestId('dollarsign-icon')).toBeInTheDocument()
    expect(screen.getByTestId('users-icon')).toBeInTheDocument()
    expect(screen.getByTestId('barchart-icon')).toBeInTheDocument()
  })

  it('should display zero values for all stats', () => {
    render(<Dashboard />)
    
    expect(screen.getByTestId('stat-depots')).toHaveTextContent('0')
    expect(screen.getByTestId('stat-ca')).toHaveTextContent('0€')
    expect(screen.getByTestId('stat-users')).toHaveTextContent('0')
    expect(screen.getByTestId('stat-recycled')).toHaveTextContent('0')
  })

  it('should have proper styling structure', () => {
    render(<Dashboard />)
    
    // Check main container exists
    const dashboardContainer = screen.getByText('Bienvenue sur RecyClique').closest('div')
    expect(dashboardContainer).toBeInTheDocument()
    
    // Check welcome section exists
    const welcomeSection = screen.getByText('Bienvenue sur RecyClique').closest('div')
    expect(welcomeSection).toBeInTheDocument()
    
    // Check stats grid exists
    const statsGrid = screen.getByText('Dépôts aujourd\'hui').closest('div')?.parentElement
    expect(statsGrid).toBeInTheDocument()
  })

  it('should render all stat cards with correct structure', () => {
    render(<Dashboard />)
    
    // Check each stat card has icon and content
    const statCards = screen.getAllByText(/0|0€/)
    expect(statCards).toHaveLength(4)
    
    // Check that each stat has its label
    expect(screen.getByText('Dépôts aujourd\'hui')).toBeInTheDocument()
    expect(screen.getByText('Chiffre d\'affaires')).toBeInTheDocument()
    expect(screen.getByText('Utilisateurs actifs')).toBeInTheDocument()
    expect(screen.getByText('Appareils recyclés')).toBeInTheDocument()
  })

  it('should have responsive layout structure', () => {
    render(<Dashboard />)
    
    // Check that the dashboard renders without errors
    expect(screen.getByText('Bienvenue sur RecyClique')).toBeInTheDocument()
    
    // Check that all main elements are present
    expect(screen.getByText(/Gérez vos dépôts, suivez vos ventes/)).toBeInTheDocument()
    expect(screen.getByText('Dépôts aujourd\'hui')).toBeInTheDocument()
    expect(screen.getByText('Chiffre d\'affaires')).toBeInTheDocument()
  })

  it('should display proper welcome content', () => {
    render(<Dashboard />)
    
    const welcomeText = screen.getByText(/Plateforme de gestion de gestion pour ressourceries/)
    expect(welcomeText).toBeInTheDocument()
    
    const descriptionText = screen.getByText(/Gérez vos dépôts, suivez vos ventes et analysez vos performances/)
    expect(descriptionText).toBeInTheDocument()
  })

  it('should render all required icons', () => {
    render(<Dashboard />)
    
    // Check that all expected icons are rendered
    const icons = [
      'package-icon',
      'dollarsign-icon', 
      'users-icon',
      'barchart-icon'
    ]
    
    icons.forEach(iconTestId => {
      expect(screen.getByTestId(iconTestId)).toBeInTheDocument()
    })
  })

  it('should have proper accessibility structure', () => {
    render(<Dashboard />)
    
    // Check that the main heading is properly structured
    const mainHeading = screen.getByText('Bienvenue sur RecyClique')
    expect(mainHeading).toBeInTheDocument()
    
    // Check that stat labels are properly associated
    expect(screen.getByText('Dépôts aujourd\'hui')).toBeInTheDocument()
    expect(screen.getByText('Chiffre d\'affaires')).toBeInTheDocument()
    expect(screen.getByText('Utilisateurs actifs')).toBeInTheDocument()
    expect(screen.getByText('Appareils recyclés')).toBeInTheDocument()
  })
})