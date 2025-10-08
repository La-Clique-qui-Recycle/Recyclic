import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import CashSessionDetail from '../../../pages/Admin/CashSessionDetail'

// Mock de react-router-dom
const mockNavigate = vi.fn()
const mockParams = { id: 'test-session-id' }

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => mockParams,
    useNavigate: () => mockNavigate,
  }
})

// Mock de fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock de localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

const mockSessionData = {
  id: 'test-session-id',
  operator_id: 'operator-id',
  operator_name: 'Jean Dupont',
  site_id: 'site-id',
  site_name: 'Site Principal',
  initial_amount: 50.0,
  current_amount: 100.0,
  status: 'closed',
  opened_at: '2025-01-27T10:30:00Z',
  closed_at: '2025-01-27T18:00:00Z',
  total_sales: 50.0,
  total_items: 3,
  sales: [
    {
      id: 'sale-1',
      total_amount: 25.0,
      donation: 5.0,
      payment_method: 'cash',
      created_at: '2025-01-27T11:00:00Z',
      operator_id: 'operator-id'
    },
    {
      id: 'sale-2',
      total_amount: 20.0,
      donation: 0.0,
      payment_method: 'card',
      created_at: '2025-01-27T12:00:00Z',
      operator_id: 'operator-id'
    }
  ]
}

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('CashSessionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('mock-token')
  })

  it('should render loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    renderWithRouter(<CashSessionDetail />)
    
    expect(screen.getByText('Chargement des détails de la session...')).toBeInTheDocument()
  })

  it('should render session details when data is loaded', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSessionData,
    })

    renderWithRouter(<CashSessionDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Détail de la Session de Caisse')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    expect(screen.getByText('Site Principal')).toBeInTheDocument()
    expect(screen.getByText('50,00 €')).toBeInTheDocument() // Initial amount
    expect(screen.getByText('50,00 €')).toBeInTheDocument() // Total sales
    expect(screen.getByText('3')).toBeInTheDocument() // Total items
    expect(screen.getByText('Fermée')).toBeInTheDocument() // Status
  })

  it('should render sales table with correct data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSessionData,
    })

    renderWithRouter(<CashSessionDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Journal des Ventes (2 ventes)')).toBeInTheDocument()
    })
    
    // Vérifier les en-têtes du tableau
    expect(screen.getByText('Heure')).toBeInTheDocument()
    expect(screen.getByText('Montant')).toBeInTheDocument()
    expect(screen.getByText('Don')).toBeInTheDocument()
    expect(screen.getByText('Paiement')).toBeInTheDocument()
    expect(screen.getByText('Opérateur')).toBeInTheDocument()
    
    // Vérifier les données des ventes
    expect(screen.getByText('25,00 €')).toBeInTheDocument() // Sale 1 amount
    expect(screen.getByText('20,00 €')).toBeInTheDocument() // Sale 2 amount
    expect(screen.getByText('5,00 €')).toBeInTheDocument() // Donation
    expect(screen.getByText('cash')).toBeInTheDocument()
    expect(screen.getByText('card')).toBeInTheDocument()
  })

  it('should render empty sales state when no sales', async () => {
    const sessionWithoutSales = {
      ...mockSessionData,
      sales: []
    }
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sessionWithoutSales,
    })

    renderWithRouter(<CashSessionDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Journal des Ventes (0 vente)')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Aucune vente enregistrée pour cette session.')).toBeInTheDocument()
  })

  it('should handle session with variance', async () => {
    const sessionWithVariance = {
      ...mockSessionData,
      closing_amount: 100.0,
      actual_amount: 95.0,
      variance: -5.0,
      variance_comment: 'Manque de 5€'
    }
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sessionWithVariance,
    })

    renderWithRouter(<CashSessionDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Contrôle de caisse')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Montant théorique: 100,00 €')).toBeInTheDocument()
    expect(screen.getByText('Montant physique: 95,00 €')).toBeInTheDocument()
    expect(screen.getByText('Écart: -5,00 €')).toBeInTheDocument()
    expect(screen.getByText('Commentaire: Manque de 5€')).toBeInTheDocument()
  })

  it('should handle open session', async () => {
    const openSession = {
      ...mockSessionData,
      status: 'open',
      closed_at: null
    }
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => openSession,
    })

    renderWithRouter(<CashSessionDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Ouverte')).toBeInTheDocument()
    })
  })

  it('should handle API error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    renderWithRouter(<CashSessionDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Erreur')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('should handle 404 error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    })

    renderWithRouter(<CashSessionDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Session non trouvée')).toBeInTheDocument()
    })
  })

  it('should handle missing session ID', () => {
    // Mock useParams to return undefined id
    vi.mocked(require('react-router-dom').useParams).mockReturnValue({})

    renderWithRouter(<CashSessionDetail />)
    
    expect(screen.getByText('Erreur')).toBeInTheDocument()
    expect(screen.getByText('ID de session manquant')).toBeInTheDocument()
  })

  it('should navigate back when back button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSessionData,
    })

    renderWithRouter(<CashSessionDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Retour')).toBeInTheDocument()
    })
    
    const backButton = screen.getByText('Retour')
    backButton.click()
    
    expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard')
  })

  it('should format currency correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSessionData,
    })

    renderWithRouter(<CashSessionDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('50,00 €')).toBeInTheDocument()
    })
  })

  it('should format dates correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSessionData,
    })

    renderWithRouter(<CashSessionDetail />)
    
    await waitFor(() => {
      // Vérifier que les dates sont formatées (format français)
      expect(screen.getByText(/27\/01\/2025/)).toBeInTheDocument()
    })
  })
})
