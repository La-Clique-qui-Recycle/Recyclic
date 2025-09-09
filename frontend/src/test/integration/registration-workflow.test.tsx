import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test-utils'
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

// Mock useSearchParams
const mockSearchParams = vi.fn()
const mockSetSearchParams = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useSearchParams: () => [mockSearchParams(), mockSetSearchParams]
  }
})

describe('Registration Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams.mockReturnValue(new URLSearchParams())
    vi.mocked(api).get.mockResolvedValue({ data: mockSites })
  })

  describe('Complete Registration Flow', () => {
    it('should complete full registration workflow successfully', async () => {
      vi.mocked(api).post.mockResolvedValue(mockApiResponses.registrationSuccess)
      render(<Registration />)

      // 1. Wait for sites to load
      await waitFor(() => {
        expect(screen.getByText('Ressourcerie Test')).toBeInTheDocument()
      })

      // 2. Fill in all form fields
      fireEvent.change(screen.getByLabelText(/id telegram/i), { 
        target: { value: '123456789' } 
      })
      fireEvent.change(screen.getByLabelText(/nom d'utilisateur telegram/i), { 
        target: { value: '@testuser' } 
      })
      fireEvent.change(screen.getByLabelText(/prénom/i), { 
        target: { value: 'John' } 
      })
      fireEvent.change(screen.getByLabelText(/nom de famille/i), { 
        target: { value: 'Doe' } 
      })
      fireEvent.change(screen.getByLabelText(/email/i), { 
        target: { value: 'john.doe@example.com' } 
      })
      fireEvent.change(screen.getByLabelText(/téléphone/i), { 
        target: { value: '06 12 34 56 78' } 
      })
      fireEvent.change(screen.getByLabelText(/ressourcerie/i), { 
        target: { value: '1' } 
      })
      fireEvent.change(screen.getByLabelText(/notes additionnelles/i), { 
        target: { value: 'Motivé pour rejoindre l\'équipe !' } 
      })

      // 3. Verify form data is correctly filled
      expect(screen.getByDisplayValue('123456789')).toBeInTheDocument()
      expect(screen.getByDisplayValue('@testuser')).toBeInTheDocument()
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('06 12 34 56 78')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Ressourcerie Test')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Motivé pour rejoindre l\'équipe !')).toBeInTheDocument()

      // 4. Submit the form
      fireEvent.click(screen.getByRole('button', { name: /envoyer la demande/i }))

      // 5. Verify loading state
      expect(screen.getByText(/envoi en cours/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /envoi en cours/i })).toBeDisabled()

      // 6. Wait for success response
      await waitFor(() => {
        expect(screen.getByText(/votre demande d'inscription a été envoyée avec succès/i)).toBeInTheDocument()
      })

      // 7. Verify API call was made with correct data
      expect(vi.mocked(api).post).toHaveBeenCalledWith('/users/registration-requests', {
        telegram_id: '123456789',
        username: '@testuser',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '06 12 34 56 78',
        site_id: '1',
        notes: 'Motivé pour rejoindre l\'équipe !'
      })

      // 8. Verify form was reset
      await waitFor(() => {
        expect(screen.getByLabelText(/prénom/i)).toHaveValue('')
        expect(screen.getByLabelText(/nom de famille/i)).toHaveValue('')
        expect(screen.getByLabelText(/email/i)).toHaveValue('')
        expect(screen.getByLabelText(/téléphone/i)).toHaveValue('')
        expect(screen.getByLabelText(/notes additionnelles/i)).toHaveValue('')
      })
    })

    it('should handle registration with Telegram ID from URL', async () => {
      mockSearchParams.mockReturnValue(new URLSearchParams('telegram_id=987654321'))
      vi.mocked(api).post.mockResolvedValue(mockApiResponses.registrationSuccess)
      render(<Registration />)

      // Verify telegram_id is pre-filled and disabled
      const telegramInput = screen.getByLabelText(/id telegram/i)
      expect(telegramInput).toHaveValue('987654321')
      expect(telegramInput).toBeDisabled()

      // Fill other required fields
      fireEvent.change(screen.getByLabelText(/prénom/i), { 
        target: { value: 'Jane' } 
      })
      fireEvent.change(screen.getByLabelText(/nom de famille/i), { 
        target: { value: 'Smith' } 
      })

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /envoyer la demande/i }))

      // Verify API call includes the pre-filled telegram_id
      await waitFor(() => {
        expect(vi.mocked(api).post).toHaveBeenCalledWith('/users/registration-requests', 
          expect.objectContaining({
            telegram_id: '987654321'
          })
        )
      })
    })

    it('should handle registration error gracefully', async () => {
      vi.mocked(api).post.mockRejectedValue(mockApiResponses.registrationError)
      render(<Registration />)

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/id telegram/i), { 
        target: { value: '123456789' } 
      })
      fireEvent.change(screen.getByLabelText(/prénom/i), { 
        target: { value: 'John' } 
      })
      fireEvent.change(screen.getByLabelText(/nom de famille/i), { 
        target: { value: 'Doe' } 
      })

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /envoyer la demande/i }))

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/validation error/i)).toBeInTheDocument()
      })

      // Verify form is not reset on error
      expect(screen.getByDisplayValue('123456789')).toBeInTheDocument()
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
    })

    it('should handle sites loading error', async () => {
      vi.mocked(api).get.mockRejectedValue(new Error('Failed to load sites'))
      vi.mocked(api).post.mockResolvedValue(mockApiResponses.registrationSuccess)
      render(<Registration />)

      // Form should still be functional even if sites fail to load
      expect(screen.getByText('📝 Inscription Recyclic')).toBeInTheDocument()
      expect(screen.getByLabelText(/ressourcerie/i)).toBeInTheDocument()

      // Should still be able to submit with empty site selection
      fireEvent.change(screen.getByLabelText(/id telegram/i), { 
        target: { value: '123456789' } 
      })
      fireEvent.change(screen.getByLabelText(/prénom/i), { 
        target: { value: 'John' } 
      })
      fireEvent.change(screen.getByLabelText(/nom de famille/i), { 
        target: { value: 'Doe' } 
      })

      fireEvent.click(screen.getByRole('button', { name: /envoyer la demande/i }))

      await waitFor(() => {
        expect(vi.mocked(api).post).toHaveBeenCalledWith('/users/registration-requests', 
          expect.objectContaining({
            site_id: ''
          })
        )
      })
    })
  })

  describe('Form Validation Integration', () => {
    it('should prevent submission with invalid data', async () => {
      render(<Registration />)

      // Try to submit with invalid telegram_id
      fireEvent.change(screen.getByLabelText(/id telegram/i), { 
        target: { value: '123' } // Too short
      })
      fireEvent.change(screen.getByLabelText(/prénom/i), { 
        target: { value: 'John' } 
      })
      fireEvent.change(screen.getByLabelText(/nom de famille/i), { 
        target: { value: 'Doe' } 
      })

      // Submit should be prevented by HTML5 validation
      fireEvent.click(screen.getByRole('button', { name: /envoyer la demande/i }))

      // API should not be called
      expect(vi.mocked(api).post).not.toHaveBeenCalled()
    })

    it('should handle multiple validation errors', async () => {
      render(<Registration />)

      // Fill with invalid data
      fireEvent.change(screen.getByLabelText(/id telegram/i), { 
        target: { value: '123' } 
      })
      fireEvent.change(screen.getByLabelText(/email/i), { 
        target: { value: 'invalid-email' } 
      })
      fireEvent.change(screen.getByLabelText(/téléphone/i), { 
        target: { value: 'invalid-phone' } 
      })

      // Submit should be prevented
      fireEvent.click(screen.getByRole('button', { name: /envoyer la demande/i }))

      expect(vi.mocked(api).post).not.toHaveBeenCalled()
    })
  })

  describe('User Experience', () => {
    it('should provide clear feedback during loading states', async () => {
      vi.mocked(api).post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      render(<Registration />)

      // Fill form
      fireEvent.change(screen.getByLabelText(/id telegram/i), { 
        target: { value: '123456789' } 
      })
      fireEvent.change(screen.getByLabelText(/prénom/i), { 
        target: { value: 'John' } 
      })
      fireEvent.change(screen.getByLabelText(/nom de famille/i), { 
        target: { value: 'Doe' } 
      })

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /envoyer la demande/i }))

      // Should show loading state
      expect(screen.getByText(/envoi en cours/i)).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText(/votre demande d'inscription a été envoyée avec succès/i)).toBeInTheDocument()
      })
    })

    it('should maintain form state during errors', async () => {
      vi.mocked(api).post.mockRejectedValue(mockApiResponses.registrationError)
      render(<Registration />)

      // Fill form with specific data
      fireEvent.change(screen.getByLabelText(/id telegram/i), { 
        target: { value: '123456789' } 
      })
      fireEvent.change(screen.getByLabelText(/prénom/i), { 
        target: { value: 'John' } 
      })
      fireEvent.change(screen.getByLabelText(/nom de famille/i), { 
        target: { value: 'Doe' } 
      })
      fireEvent.change(screen.getByLabelText(/notes additionnelles/i), { 
        target: { value: 'Important notes' } 
      })

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /envoyer la demande/i }))

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/validation error/i)).toBeInTheDocument()
      })

      // Form data should be preserved
      expect(screen.getByDisplayValue('123456789')).toBeInTheDocument()
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Important notes')).toBeInTheDocument()
    })
  })
})
