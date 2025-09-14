import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import Registration from '../../pages/Registration'
import { mockSites, mockApiResponses } from '../test-utils'
import api from '../../services/api'

// Mock du service API
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

// Mock useSearchParams - utiliser le mock global
const mockSearchParams = vi.fn()
const mockSetSearchParams = vi.fn()

// Override du mock global pour ce test spécifique
vi.doMock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useSearchParams: () => [mockSearchParams(), mockSetSearchParams]
  }
})

describe('Registration Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams.mockReturnValue(new URLSearchParams())
    vi.mocked(api.get).mockResolvedValue({ data: mockSites })
    vi.mocked(api.post).mockResolvedValue({ data: { id: 1, ...mockApiResponses.user } })
  })

  it('should render registration form with all required fields', () => {
    render(<Registration />)
    
    expect(screen.getByText('📝 Inscription Recyclic')).toBeInTheDocument()
    expect(screen.getByLabelText(/id telegram/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nom de famille/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/téléphone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ressourcerie/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notes additionnelles/i)).toBeInTheDocument()
  })

  it('should show required field indicators', () => {
    render(<Registration />)
    
    expect(screen.getByText(/id telegram \*/i)).toBeInTheDocument()
    expect(screen.getByText(/prénom \*/i)).toBeInTheDocument()
    expect(screen.getByText(/nom de famille \*/i)).toBeInTheDocument()
  })

  it('should load sites on component mount', async () => {
    render(<Registration />)
    
    await waitFor(() => {
      expect(vi.mocked(api).get).toHaveBeenCalledWith('/sites')
    })
  })

  it('should populate site dropdown with loaded sites', async () => {
    render(<Registration />)
    
    await waitFor(() => {
      expect(screen.getByText('Ressourcerie Test')).toBeInTheDocument()
      expect(screen.getByText('Ressourcerie Test 2')).toBeInTheDocument()
    })
  })

  it('should handle form input changes', async () => {
    render(<Registration />)
    
    const telegramInput = screen.getByLabelText(/id telegram/i)
    const firstNameInput = screen.getByLabelText(/prénom/i)
    const lastNameInput = screen.getByLabelText(/nom de famille/i)
    
    fireEvent.change(telegramInput, { target: { value: '123456789' } })
    fireEvent.change(firstNameInput, { target: { value: 'John' } })
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
    
    expect(telegramInput).toHaveValue('123456789')
    expect(firstNameInput).toHaveValue('John')
    expect(lastNameInput).toHaveValue('Doe')
  })

  it('should pre-fill telegram_id from URL params', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams('telegram_id=123456789'))
    render(<Registration />)
    
    const telegramInput = screen.getByLabelText(/id telegram/i)
    expect(telegramInput).toHaveValue('123456789')
    expect(telegramInput).toBeDisabled()
  })

  it('should submit form with correct data', async () => {
    const user = userEvent.setup()
    vi.mocked(api).post.mockResolvedValue(mockApiResponses.registrationSuccess)
    render(<Registration />)
    
    // Remplir le formulaire
    await user.type(screen.getByLabelText(/id telegram/i), '123456789')
    await user.type(screen.getByLabelText(/prénom/i), 'John')
    await user.type(screen.getByLabelText(/nom de famille/i), 'Doe')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/téléphone/i), '+33123456789')
    
    // Sélectionner un site
    await user.selectOptions(screen.getByLabelText(/ressourcerie/i), '1')
    
    // Soumettre le formulaire
    await user.click(screen.getByRole('button', { name: /envoyer la demande/i }))
    
    await waitFor(() => {
      expect(vi.mocked(api).post).toHaveBeenCalledWith('/users/registration-requests', {
        telegram_id: '123456789',
        username: '',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+33123456789',
        site_id: '1',
        notes: ''
      })
    })
  })

  it('should show success message after successful submission', async () => {
    vi.mocked(api).post.mockResolvedValue(mockApiResponses.registrationSuccess)
    render(<Registration />)
    
    // Remplir et soumettre le formulaire
    fireEvent.change(screen.getByLabelText(/id telegram/i), { target: { value: '123456789' } })
    fireEvent.change(screen.getByLabelText(/prénom/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/nom de famille/i), { target: { value: 'Doe' } })
    
    fireEvent.click(screen.getByRole('button', { name: /envoyer la demande/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/votre demande d'inscription a été envoyée avec succès/i)).toBeInTheDocument()
    })
  })

  it('should reset form after successful submission', async () => {
    const user = userEvent.setup()
    vi.mocked(api).post.mockResolvedValue(mockApiResponses.registrationSuccess)
    render(<Registration />)
    
    // Remplir et soumettre le formulaire (avec tous les champs requis)
    await user.type(screen.getByLabelText(/id telegram/i), '123456789')
    await user.type(screen.getByLabelText(/prénom/i), 'John')
    await user.type(screen.getByLabelText(/nom de famille/i), 'Doe')
    
    await user.click(screen.getByRole('button', { name: /envoyer la demande/i }))
    
    // Attendre que le message de succès apparaisse
    await waitFor(() => {
      expect(screen.getByText(/votre demande d'inscription a été envoyée avec succès/i)).toBeInTheDocument()
    })
    
    // Attendre que le formulaire soit reset
    await waitFor(() => {
      expect(screen.getByLabelText(/prénom/i)).toHaveValue('')
      expect(screen.getByLabelText(/nom de famille/i)).toHaveValue('')
    })
  })

  it('should show error message on submission failure', async () => {
    vi.mocked(api).post.mockRejectedValue(mockApiResponses.registrationError)
    render(<Registration />)
    
    // Remplir et soumettre le formulaire
    fireEvent.change(screen.getByLabelText(/id telegram/i), { target: { value: '123456789' } })
    fireEvent.change(screen.getByLabelText(/prénom/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/nom de famille/i), { target: { value: 'Doe' } })
    
    fireEvent.click(screen.getByRole('button', { name: /envoyer la demande/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/validation error/i)).toBeInTheDocument()
    })
  })

  it('should show loading state during submission', async () => {
    vi.mocked(api).post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    render(<Registration />)
    
    // Remplir et soumettre le formulaire
    fireEvent.change(screen.getByLabelText(/id telegram/i), { target: { value: '123456789' } })
    fireEvent.change(screen.getByLabelText(/prénom/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/nom de famille/i), { target: { value: 'Doe' } })
    
    fireEvent.click(screen.getByRole('button', { name: /envoyer la demande/i }))
    
    expect(screen.getByText(/envoi en cours/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /envoi en cours/i })).toBeDisabled()
  })

  it('should handle sites loading error gracefully', async () => {
    vi.mocked(api).get.mockRejectedValue(new Error('Failed to load sites'))
    render(<Registration />)
    
    // Le composant devrait toujours s'afficher même si les sites ne se chargent pas
    expect(screen.getByText('📝 Inscription Recyclic')).toBeInTheDocument()
    expect(screen.getByLabelText(/ressourcerie/i)).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    render(<Registration />)
    
    // Essayer de soumettre sans remplir les champs requis
    fireEvent.click(screen.getByRole('button', { name: /envoyer la demande/i }))
    
    // Le formulaire HTML5 devrait empêcher la soumission
    expect(vi.mocked(api).post).not.toHaveBeenCalled()
  })

  it('should display placeholder text correctly', () => {
    render(<Registration />)
    
    expect(screen.getByPlaceholderText(/votre id telegram/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/@votre_nom_utilisateur/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/votre prénom/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/votre nom de famille/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/votre@email.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/\+33 6 12 34 56 78/i)).toBeInTheDocument()
  })
})
