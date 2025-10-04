import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@test/test-utils'
import CategorySelector from '../../../components/business/CategorySelector'
import { useCategoryStore } from '../../../stores/categoryStore'

// Mock the category store
vi.mock('../../../stores/categoryStore')

const mockCategories = [
  {
    id: 'EEE-1',
    name: 'Gros électroménager',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'EEE-2',
    name: 'Petit électroménager',
    is_active: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 'EEE-3',
    name: 'Informatique et télécommunications',
    is_active: true,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
  {
    id: 'EEE-4',
    name: 'Matériel grand public',
    is_active: true,
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
  },
  {
    id: 'EEE-5',
    name: 'Éclairage',
    is_active: true,
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z',
  },
  {
    id: 'EEE-6',
    name: 'Outils électriques et électroniques',
    is_active: true,
    created_at: '2024-01-06T00:00:00Z',
    updated_at: '2024-01-06T00:00:00Z',
  },
  {
    id: 'EEE-7',
    name: 'Jouets, loisirs et sports',
    is_active: true,
    created_at: '2024-01-07T00:00:00Z',
    updated_at: '2024-01-07T00:00:00Z',
  },
  {
    id: 'EEE-8',
    name: 'Dispositifs médicaux',
    is_active: true,
    created_at: '2024-01-08T00:00:00Z',
    updated_at: '2024-01-08T00:00:00Z',
  },
]

const mockFetchCategories = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useCategoryStore).mockReturnValue({
    activeCategories: mockCategories,
    categories: mockCategories,
    loading: false,
    error: null,
    lastFetchTime: Date.now(),
    fetchCategories: mockFetchCategories,
    getActiveCategories: () => mockCategories,
    getCategoryById: (id: string) => mockCategories.find((c) => c.id === id),
    clearError: vi.fn(),
  })
})

describe('CategorySelector', () => {
  it('should render all EEE categories', async () => {
    const onSelect = vi.fn()
    render(<CategorySelector onSelect={onSelect} />)
    
    await waitFor(() => {
      expect(screen.getByText('Gros électroménager')).toBeInTheDocument()
      expect(screen.getByText('Petit électroménager')).toBeInTheDocument()
      expect(screen.getByText('Informatique et télécommunications')).toBeInTheDocument()
      expect(screen.getByText('Matériel grand public')).toBeInTheDocument()
      expect(screen.getByText('Éclairage')).toBeInTheDocument()
      expect(screen.getByText('Outils électriques et électroniques')).toBeInTheDocument()
      expect(screen.getByText('Jouets, loisirs et sports')).toBeInTheDocument()
      expect(screen.getByText('Dispositifs médicaux')).toBeInTheDocument()
    })
  })

  it('should fetch categories on mount', async () => {
    const onSelect = vi.fn()
    render(<CategorySelector onSelect={onSelect} />)
    
    await waitFor(() => {
      expect(mockFetchCategories).toHaveBeenCalledOnce()
    })
  })

  it('should call onSelect when category clicked', async () => {
    const onSelect = vi.fn()
    render(<CategorySelector onSelect={onSelect} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('category-EEE-3')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByTestId('category-EEE-3'))
    
    expect(onSelect).toHaveBeenCalledWith('EEE-3')
  })

  it('should highlight selected category', async () => {
    const onSelect = vi.fn()
    render(<CategorySelector onSelect={onSelect} selectedCategory="EEE-3" />)
    
    await waitFor(() => {
      expect(screen.getByTestId('category-EEE-3')).toBeInTheDocument()
    })
    
    const selectedButton = screen.getByTestId('category-EEE-3')
    // Vérifier que le bouton a la classe ou l'attribut de sélection
    expect(selectedButton).toHaveAttribute('data-selected', 'true')
  })

  it('should not highlight unselected categories', async () => {
    const onSelect = vi.fn()
    render(<CategorySelector onSelect={onSelect} selectedCategory="EEE-3" />)
    
    await waitFor(() => {
      expect(screen.getByTestId('category-EEE-1')).toBeInTheDocument()
    })
    
    const unselectedButton = screen.getByTestId('category-EEE-1')
    expect(unselectedButton).toHaveAttribute('data-selected', 'false')
  })

  it('should have proper grid layout', async () => {
    const onSelect = vi.fn()
    render(<CategorySelector onSelect={onSelect} />)
    
    await waitFor(() => {
      expect(screen.getByText('Gros électroménager')).toBeInTheDocument()
    })
    
    const container = screen.getByText('Gros électroménager').closest('div')?.parentElement
    expect(container).toBeTruthy()
  })

  it('should handle multiple category selections', async () => {
    const onSelect = vi.fn()
    render(<CategorySelector onSelect={onSelect} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('category-EEE-1')).toBeInTheDocument()
      expect(screen.getByTestId('category-EEE-5')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByTestId('category-EEE-1'))
    fireEvent.click(screen.getByTestId('category-EEE-5'))
    
    expect(onSelect).toHaveBeenCalledTimes(2)
    expect(onSelect).toHaveBeenNthCalledWith(1, 'EEE-1')
    expect(onSelect).toHaveBeenNthCalledWith(2, 'EEE-5')
  })

  it('should render all 8 EEE categories', async () => {
    const onSelect = vi.fn()
    render(<CategorySelector onSelect={onSelect} />)
    
    await waitFor(() => {
      const categoryButtons = screen.getAllByRole('button')
      expect(categoryButtons).toHaveLength(8)
    })
  })
})
