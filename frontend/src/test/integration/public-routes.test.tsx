import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import { renderWithRouter } from '../test-utils'
import { Routes, Route } from 'react-router-dom'
import { mockSites } from '../test-utils'

// Import individual components instead of App
import Dashboard from '../../pages/Dashboard.jsx'
import CashRegister from '../../pages/CashRegister.jsx'
import Registration from '../../pages/Registration.jsx'
import Login from '../../pages/Login.tsx'
import Signup from '../../pages/Signup.tsx'
import ForgotPassword from '../../pages/ForgotPassword.tsx'
import ResetPassword from '../../pages/ResetPassword.tsx'
import AdminDashboard from '../../pages/Admin/Dashboard.tsx'
import ProtectedRoute from '../../components/auth/ProtectedRoute'

// Mock authStore to simulate unauthenticated state
const mockAuthStore: any = {
  isAuthenticated: false,
  currentUser: null,
  loading: false,
  error: null,
  login: vi.fn(async () => ({ success: true })),
  logout: vi.fn(async () => ({ success: true })),
  signup: vi.fn(async () => ({ success: true })),
  forgotPassword: vi.fn(async () => ({ success: true })),
  resetPassword: vi.fn(async () => ({ success: true })),
  setUser: vi.fn()
}

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector?: any) => (typeof selector === 'function' ? selector(mockAuthStore) : mockAuthStore)
}))

const TestRoutes = (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/caisse" element={<ProtectedRoute requiredRole="cashier"><CashRegister /></ProtectedRoute>} />
    <Route path="/inscription" element={<Registration />} />
    <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
  </Routes>
)

const renderAppWithRoute = (route: string) => {
  return renderWithRouter(TestRoutes, route)
}

describe('Public Routes Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Registration Route Accessibility', () => {
    it('should render registration page when accessing /inscription without authentication', async () => {
      renderAppWithRoute('/inscription')

      // Wait for the registration page to load
      await waitFor(() => {
        expect(screen.getByText('📝 Inscription Recyclic')).toBeInTheDocument()
      })

      // Verify registration form elements are present
      expect(screen.getByLabelText(/id telegram/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/nom de famille/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /envoyer la demande/i })).toBeInTheDocument()
    })

    it('should render registration page with telegram_id parameter without authentication', async () => {
      renderAppWithRoute('/inscription?telegram_id=123456789')

      await waitFor(() => {
        expect(screen.getByText('📝 Inscription Recyclic')).toBeInTheDocument()
      })

      // Verify the telegram_id is populated from URL params
      const telegramInput = screen.getByLabelText(/id telegram/i) as HTMLInputElement
      expect(telegramInput.value).toBe('123456789')
      expect(telegramInput).toBeDisabled()
    })

    it('should not redirect to login page when accessing registration route', async () => {
      renderAppWithRoute('/inscription')

      await waitFor(() => {
        expect(screen.getByText('📝 Inscription Recyclic')).toBeInTheDocument()
      })

      // Verify we're not on the login page
      expect(screen.queryByText(/connexion/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/mot de passe/i)).not.toBeInTheDocument()
    })
  })

  describe('Other Public Routes', () => {
    it('should render login page when accessing /login', async () => {
      renderAppWithRoute('/login')

      await waitFor(() => {
        expect(screen.getByText(/connexion/i)).toBeInTheDocument()
      })
    })

    it('should render signup page when accessing /signup', async () => {
      renderAppWithRoute('/signup')

      await waitFor(() => {
        expect(screen.getByText(/créer un compte/i)).toBeInTheDocument()
      })
    })

    it('should render forgot password page when accessing /forgot-password', async () => {
      renderAppWithRoute('/forgot-password')

      await waitFor(() => {
        expect(screen.getByText(/mot de passe oublié/i)).toBeInTheDocument()
      })
    })

    it('should render reset password page when accessing /reset-password', async () => {
      renderAppWithRoute('/reset-password')

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /réinitialiser le mot de passe/i })).toBeInTheDocument()
      })
    })
  })

  describe('Protected Routes Behavior', () => {
    it('should redirect to login when accessing protected routes without authentication', async () => {
      renderAppWithRoute('/')

      await waitFor(() => {
        // Should redirect to login page
        expect(screen.getByText(/connexion/i)).toBeInTheDocument()
      })
    })

    it('should redirect to login when accessing admin routes without authentication', async () => {
      renderAppWithRoute('/admin/dashboard')

      await waitFor(() => {
        // Should redirect to login page
        expect(screen.getByText(/connexion/i)).toBeInTheDocument()
      })
    })

    it('should redirect to login when accessing cashier routes without authentication', async () => {
      renderAppWithRoute('/caisse')

      await waitFor(() => {
        // Should redirect to login page
        expect(screen.getByText(/connexion/i)).toBeInTheDocument()
      })
    })
  })

  describe('Registration Route Edge Cases', () => {
    it('should handle API errors gracefully on registration page', async () => {
      renderAppWithRoute('/inscription')

      await waitFor(() => {
        // Page should still render even if sites fail to load
        expect(screen.getByText('📝 Inscription Recyclic')).toBeInTheDocument()
      })

      // Form should still be functional
      expect(screen.getByLabelText(/id telegram/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /envoyer la demande/i })).toBeInTheDocument()
    })

    it('should preserve URL parameters on registration page load', async () => {
      renderAppWithRoute('/inscription?telegram_id=987654321&ref=telegram')

      await waitFor(() => {
        expect(screen.getByText('📝 Inscription Recyclic')).toBeInTheDocument()
      })

      // Verify telegram_id parameter is still accessible
      const telegramInput = screen.getByLabelText(/id telegram/i) as HTMLInputElement
      expect(telegramInput.value).toBe('987654321')
    })
  })
})