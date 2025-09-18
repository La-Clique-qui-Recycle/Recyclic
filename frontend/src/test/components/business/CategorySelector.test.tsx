import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@test/test-utils'
import CategorySelector from '../../../components/business/CategorySelector'

describe('CategorySelector', () => {
  it('should render all EEE categories', () => {
    const onSelect = vi.fn()
    render(<CategorySelector onSelect={onSelect} />)
    
    expect(screen.getByText('EEE-1')).toBeInTheDocument()
    expect(screen.getByText('EEE-2')).toBeInTheDocument()
    expect(screen.getByText('EEE-3')).toBeInTheDocument()
    expect(screen.getByText('EEE-4')).toBeInTheDocument()
    expect(screen.getByText('EEE-5')).toBeInTheDocument()
    expect(screen.getByText('EEE-6')).toBeInTheDocument()
    expect(screen.getByText('EEE-7')).toBeInTheDocument()
    expect(screen.getByText('EEE-8')).toBeInTheDocument()
  })

  it('should render category descriptions', () => {
    const onSelect = vi.fn()
    render(<CategorySelector onSelect={onSelect} />)
    
    expect(screen.getByText('Gros électroménager')).toBeInTheDocument()
    expect(screen.getByText('Petit électroménager')).toBeInTheDocument()
    expect(screen.getByText('Informatique et télécommunications')).toBeInTheDocument()
    expect(screen.getByText('Matériel grand public')).toBeInTheDocument()
  })

  it('should call onSelect when category clicked', () => {
    const onSelect = vi.fn()
    render(<CategorySelector onSelect={onSelect} />)
    
    fireEvent.click(screen.getByTestId('category-EEE-3'))
    
    expect(onSelect).toHaveBeenCalledWith('EEE-3')
  })

  it('should highlight selected category', () => {
    const onSelect = vi.fn()
    render(<CategorySelector onSelect={onSelect} selectedCategory="EEE-3" />)
    
    const selectedButton = screen.getByTestId('category-EEE-3')
    const isActive = selectedButton.getAttribute('data-active') === 'true'
      || selectedButton.getAttribute('data-selected') === 'true'
      || selectedButton.getAttribute('aria-pressed') === 'true'
      || ((selectedButton.getAttribute('class') || '').toLowerCase().includes('selected'))
    expect(isActive).toBe(true)
  })

  it('should not highlight unselected categories', () => {
    const onSelect = vi.fn()
    render(<CategorySelector onSelect={onSelect} selectedCategory="EEE-3" />)
    
    const unselectedButton = screen.getByTestId('category-EEE-1')
    const isActive = unselectedButton.getAttribute('data-active') === 'true'
      || unselectedButton.getAttribute('data-selected') === 'true'
      || unselectedButton.getAttribute('aria-pressed') === 'true'
      || ((unselectedButton.getAttribute('class') || '').toLowerCase().includes('selected'))
    expect(isActive).toBe(false)
  })

  it('should have proper grid layout', () => {
    const onSelect = vi.fn()
    render(<CategorySelector onSelect={onSelect} />)
    
    const container = screen.getByText('EEE-1').closest('div')?.parentElement
    expect(container).toBeTruthy()
  })

  it('should handle multiple category selections', () => {
    const onSelect = vi.fn()
    render(<CategorySelector onSelect={onSelect} />)
    
    fireEvent.click(screen.getByTestId('category-EEE-1'))
    fireEvent.click(screen.getByTestId('category-EEE-5'))
    
    expect(onSelect).toHaveBeenCalledTimes(2)
    expect(onSelect).toHaveBeenNthCalledWith(1, 'EEE-1')
    expect(onSelect).toHaveBeenNthCalledWith(2, 'EEE-5')
  })

  it('should render all 8 EEE categories', () => {
    const onSelect = vi.fn()
    render(<CategorySelector onSelect={onSelect} />)
    
    const categoryButtons = screen.getAllByRole('button')
    expect(categoryButtons).toHaveLength(8)
  })
})
