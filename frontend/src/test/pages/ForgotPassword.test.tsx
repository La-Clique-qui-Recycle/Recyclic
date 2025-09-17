import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ForgotPassword from '../../pages/ForgotPassword';
import { useAuthStore } from '../../stores/authStore';

// Mock du store
vi.mock('../../stores/authStore');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseAuthStore = useAuthStore as any;

describe('ForgotPassword Component', () => {
  const mockForgotPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      forgotPassword: mockForgotPassword,
      loading: false,
      error: null
    });
  });

  const renderForgotPassword = () => {
    return render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );
  };

  it('should render forgot password form with all elements', () => {
    renderForgotPassword();

    expect(screen.getByText('Mot de passe oublié')).toBeInTheDocument();
    expect(screen.getByText(/entrez votre adresse email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /retour à la connexion/i })).toBeInTheDocument();
  });

  it('should submit form with valid email', async () => {
    mockForgotPassword.mockResolvedValue({});
    renderForgotPassword();

    const emailInput = screen.getByLabelText(/adresse email/i);
    const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('should show success message after successful submission', async () => {
    mockForgotPassword.mockResolvedValue({});
    renderForgotPassword();

    const emailInput = screen.getByLabelText(/adresse email/i);
    const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email envoyé')).toBeInTheDocument();
      expect(screen.getByText(/si un compte est associé à cet email/i)).toBeInTheDocument();
      expect(screen.getByText(/vérifiez votre boîte mail/i)).toBeInTheDocument();
    });

    // Vérifier que le lien de retour est présent dans la vue de succès
    expect(screen.getByRole('link', { name: /retour à la connexion/i })).toBeInTheDocument();
  });

  it('should require email field', () => {
    renderForgotPassword();

    const emailInput = screen.getByLabelText(/adresse email/i);
    const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i });

    expect(emailInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('type', 'email');

    // Tentative de soumission sans email
    fireEvent.click(submitButton);

    // La validation HTML5 devrait empêcher la soumission
    expect(mockForgotPassword).not.toHaveBeenCalled();
  });

  it('should show loading state during submission', () => {
    mockUseAuthStore.mockReturnValue({
      forgotPassword: mockForgotPassword,
      loading: true,
      error: null
    });

    renderForgotPassword();

    const submitButton = screen.getByRole('button', { name: /envoi en cours/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/envoi en cours/i)).toBeInTheDocument();
  });

  it('should show error message from store', () => {
    const errorMessage = 'Erreur lors de l\'envoi de l\'email';
    mockUseAuthStore.mockReturnValue({
      forgotPassword: mockForgotPassword,
      loading: false,
      error: errorMessage
    });

    renderForgotPassword();

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should handle forgot password error', async () => {
    const errorMessage = 'Erreur réseau';
    mockForgotPassword.mockRejectedValue(new Error(errorMessage));

    renderForgotPassword();

    const emailInput = screen.getByLabelText(/adresse email/i);
    const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalled();
    });

    // L'erreur devrait être gérée dans le store
  });

  it('should have correct link to login page', () => {
    renderForgotPassword();

    const loginLink = screen.getByRole('link', { name: /retour à la connexion/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('should not show success message initially', () => {
    renderForgotPassword();

    expect(screen.queryByText('Email envoyé')).not.toBeInTheDocument();
    expect(screen.queryByText(/vérifiez votre boîte mail/i)).not.toBeInTheDocument();
  });

  it('should persist success state after error in store', async () => {
    // D'abord un succès
    mockForgotPassword.mockResolvedValue({});
    const { rerender } = renderForgotPassword();

    const emailInput = screen.getByLabelText(/adresse email/i);
    const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email envoyé')).toBeInTheDocument();
    });

    // Simuler une erreur dans le store après le succès
    mockUseAuthStore.mockReturnValue({
      forgotPassword: mockForgotPassword,
      loading: false,
      error: 'Nouvelle erreur'
    });

    rerender(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    // L'état de succès devrait persister car c'est un état local
    expect(screen.getByText('Email envoyé')).toBeInTheDocument();
  });

  it('should validate email format', () => {
    renderForgotPassword();

    const emailInput = screen.getByLabelText(/adresse email/i);

    // Test avec un email invalide
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    // Le navigateur devrait empêcher la soumission avec un email invalide
    expect(emailInput).toHaveValue('invalid-email');
    expect(emailInput.validity.valid).toBe(false);
  });

  it('should accept valid email format', () => {
    renderForgotPassword();

    const emailInput = screen.getByLabelText(/adresse email/i);

    fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });

    expect(emailInput).toHaveValue('valid@example.com');
    expect(emailInput.validity.valid).toBe(true);
  });

  it('should prevent form submission when loading', () => {
    mockUseAuthStore.mockReturnValue({
      forgotPassword: mockForgotPassword,
      loading: true,
      error: null
    });

    renderForgotPassword();

    const emailInput = screen.getByLabelText(/adresse email/i);
    const submitButton = screen.getByRole('button', { name: /envoi en cours/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    // Ne devrait pas appeler forgotPassword à cause du loading
    expect(mockForgotPassword).not.toHaveBeenCalled();
  });
});