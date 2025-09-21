import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ResetPassword from '../../pages/ResetPassword';
import { useAuthStore } from '../../stores/authStore';

// Mock du store
vi.mock('../../stores/authStore');

const mockNavigate = vi.fn();
const mockUseSearchParams = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => mockUseSearchParams(),
  };
});

const mockUseAuthStore = useAuthStore as any;

describe('ResetPassword Component', () => {
  const mockResetPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      resetPassword: mockResetPassword,
      loading: false,
      error: null
    });
    // Mock par défaut avec un token valide
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?token=valid-token-123'), vi.fn()]);
  });

  const renderResetPassword = () => {
    return render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );
  };

  it('should render reset password form with all elements', () => {
    renderResetPassword();

    expect(screen.getByRole('heading', { name: 'Réinitialiser le mot de passe' })).toBeInTheDocument();
    expect(screen.getByText(/entrez votre nouveau mot de passe/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nouveau mot de passe/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmer le mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /réinitialiser le mot de passe/i })).toBeInTheDocument();
    expect(screen.getByTestId('password-guidelines')).toBeInTheDocument();
  });

  it('should submit form with valid passwords', async () => {
    mockResetPassword.mockResolvedValue({});
    renderResetPassword();

    const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /réinitialiser le mot de passe/i });

    const validPassword = 'NewPassword123!';

    fireEvent.change(newPasswordInput, { target: { value: validPassword } });
    fireEvent.change(confirmPasswordInput, { target: { value: validPassword } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('valid-token-123', validPassword);
    });
  });

  it('should show success message after successful reset', async () => {
    mockResetPassword.mockResolvedValue({});
    renderResetPassword();

    const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /réinitialiser le mot de passe/i });

    const validPassword = 'NewPassword123!';

    fireEvent.change(newPasswordInput, { target: { value: validPassword } });
    fireEvent.change(confirmPasswordInput, { target: { value: validPassword } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Mot de passe réinitialisé')).toBeInTheDocument();
      expect(screen.getByText(/votre mot de passe a été réinitialisé avec succès/i)).toBeInTheDocument();
      expect(screen.getByText(/vous allez être redirigé/i)).toBeInTheDocument();
    });

    // Vérifier la redirection après 3 secondes
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    }, { timeout: 4000 });
  });

  it('should show error when passwords do not match', () => {
    renderResetPassword();

    const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /réinitialiser le mot de passe/i });

    fireEvent.change(newPasswordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Different123!' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/les mots de passe ne correspondent pas/i)).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('should validate password strength', () => {
    renderResetPassword();

    const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /réinitialiser le mot de passe/i });

    // Mot de passe trop faible
    const weakPassword = 'weak';
    fireEvent.change(newPasswordInput, { target: { value: weakPassword } });
    fireEvent.change(confirmPasswordInput, { target: { value: weakPassword } });
    fireEvent.click(submitButton);

    expect(screen.getByTestId('password-error').textContent).toMatch(/au moins 8 caractères/i);
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('should validate password requirements individually', () => {
    renderResetPassword();

    const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /réinitialiser le mot de passe/i });

    // Test d'un mot de passe trop court
    fireEvent.change(newPasswordInput, { target: { value: 'short' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'short' } });
    fireEvent.click(submitButton);

    // Vérifier qu'il y a une erreur de validation affichée
    const error = screen.getByTestId('password-error');
    expect(error.textContent).toMatch(/au moins 8 caractères/i);
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('should show loading state during submission', () => {
    mockUseAuthStore.mockReturnValue({
      resetPassword: mockResetPassword,
      loading: true,
      error: null
    });

    renderResetPassword();

    const submitButton = screen.getByRole('button', { name: /réinitialisation/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/réinitialisation/i)).toBeInTheDocument();
  });

  it('should show error message from store', () => {
    const errorMessage = 'Token invalide ou expiré';
    mockUseAuthStore.mockReturnValue({
      resetPassword: mockResetPassword,
      loading: false,
      error: errorMessage
    });

    renderResetPassword();

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should require both password fields', () => {
    renderResetPassword();

    const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);

    expect(newPasswordInput).toHaveAttribute('required');
    expect(confirmPasswordInput).toHaveAttribute('required');
    expect(newPasswordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  it('should handle reset password error', async () => {
    const errorMessage = 'Token invalide';
    mockResetPassword.mockRejectedValue(new Error(errorMessage));

    renderResetPassword();

    const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /réinitialiser le mot de passe/i });

    const validPassword = 'ValidPassword123!';

    fireEvent.change(newPasswordInput, { target: { value: validPassword } });
    fireEvent.change(confirmPasswordInput, { target: { value: validPassword } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalled();
    });

    // L'erreur devrait être gérée dans le store
  });

  it('should prevent form submission when loading', () => {
    mockUseAuthStore.mockReturnValue({
      resetPassword: mockResetPassword,
      loading: true,
      error: null
    });

    renderResetPassword();

    const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /réinitialisation/i });

    const validPassword = 'ValidPassword123!';

    fireEvent.change(newPasswordInput, { target: { value: validPassword } });
    fireEvent.change(confirmPasswordInput, { target: { value: validPassword } });
    fireEvent.click(submitButton);

    // Ne devrait pas appeler resetPassword à cause du loading
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('should not show success message initially', () => {
    renderResetPassword();

    expect(screen.queryByText('Mot de passe réinitialisé')).not.toBeInTheDocument();
    expect(screen.queryByText(/votre mot de passe a été réinitialisé/i)).not.toBeInTheDocument();
  });

  it('should clear validation error when passwords match', () => {
    renderResetPassword();

    const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /réinitialiser le mot de passe/i });

    // D'abord créer une erreur
    fireEvent.change(newPasswordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Different123!' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/les mots de passe ne correspondent pas/i)).toBeInTheDocument();

    // Puis corriger
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitButton);

    expect(screen.queryByText(/les mots de passe ne correspondent pas/i)).not.toBeInTheDocument();
  });

  describe('Token handling', () => {
    it('should redirect to login if no token is provided', () => {
      // Mock useSearchParams pour retourner un token vide
      mockUseSearchParams.mockReturnValue([new URLSearchParams(''), vi.fn()]);

      renderResetPassword();

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should extract token from URL parameters', async () => {
      // Le token est déjà mocké dans le beforeEach
      renderResetPassword();

      const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
      const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);
      const submitButton = screen.getByRole('button', { name: /réinitialiser le mot de passe/i });

      const validPassword = 'ValidPassword123!';

      fireEvent.change(newPasswordInput, { target: { value: validPassword } });
      fireEvent.change(confirmPasswordInput, { target: { value: validPassword } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('valid-token-123', validPassword);
      });
    });
  });
});
