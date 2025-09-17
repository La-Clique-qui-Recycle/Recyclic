import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Signup from '../../pages/Signup';
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

describe('Signup Component', () => {
  const mockSignup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      signup: mockSignup,
      loading: false,
      error: null
    });
  });

  const renderSignup = () => {
    return render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );
  };

  it('should render signup form with all fields', () => {
    renderSignup();

    expect(screen.getByText('Créer un compte')).toBeInTheDocument();
    expect(screen.getByLabelText(/nom d'utilisateur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe.*\*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmer le mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /créer le compte/i })).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    mockSignup.mockResolvedValue({});
    renderSignup();

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/mot de passe.*\*/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /créer le compte/i });

    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('newuser', 'password123', 'test@example.com');
    });
  });

  it('should submit form without email', async () => {
    mockSignup.mockResolvedValue({});
    renderSignup();

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/mot de passe.*\*/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /créer le compte/i });

    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('newuser', 'password123', undefined);
    });
  });

  it('should show success message after successful signup', async () => {
    mockSignup.mockResolvedValue({});
    renderSignup();

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/mot de passe.*\*/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /créer le compte/i });

    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/compte créé avec succès/i)).toBeInTheDocument();
      expect(screen.getByText(/en attente de validation/i)).toBeInTheDocument();
    });

    // Les champs doivent être réinitialisés
    expect(usernameInput).toHaveValue('');
    expect(passwordInput).toHaveValue('');
    expect(confirmPasswordInput).toHaveValue('');
  });

  it('should show password mismatch error', () => {
    renderSignup();

    const passwordInput = screen.getByLabelText(/mot de passe.*\*/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
    fireEvent.blur(confirmPasswordInput);

    expect(screen.getByText(/les mots de passe ne correspondent pas/i)).toBeInTheDocument();
  });

  it('should disable submit button when passwords do not match', () => {
    renderSignup();

    const passwordInput = screen.getByLabelText(/mot de passe.*\*/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /créer le compte/i });

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
    fireEvent.blur(confirmPasswordInput);

    expect(submitButton).toBeDisabled();
  });

  it('should show loading state', () => {
    mockUseAuthStore.mockReturnValue({
      signup: mockSignup,
      loading: true,
      error: null
    });

    renderSignup();

    const submitButton = screen.getByRole('button', { name: /création du compte/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/création du compte/i)).toBeInTheDocument();
  });

  it('should show error message from store', () => {
    const errorMessage = 'Ce nom d\'utilisateur est déjà pris';
    mockUseAuthStore.mockReturnValue({
      signup: mockSignup,
      loading: false,
      error: errorMessage
    });

    renderSignup();

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should handle signup error', async () => {
    const errorMessage = 'Erreur lors de l\'inscription';
    mockSignup.mockRejectedValue(new Error(errorMessage));

    renderSignup();

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/mot de passe.*\*/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /créer le compte/i });

    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalled();
    });

    // L'erreur devrait être gérée dans le store, pas dans le composant
  });

  it('should navigate to login when login link is clicked', () => {
    renderSignup();

    const loginLink = screen.getByRole('button', { name: /se connecter/i });
    fireEvent.click(loginLink);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should validate required fields', () => {
    renderSignup();

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/mot de passe.*\*/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);

    expect(usernameInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
    expect(confirmPasswordInput).toHaveAttribute('required');
  });

  it('should have correct input constraints', () => {
    renderSignup();

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/mot de passe.*\*/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);

    expect(usernameInput).toHaveAttribute('minLength', '3');
    expect(usernameInput).toHaveAttribute('maxLength', '50');
    expect(passwordInput).toHaveAttribute('minLength', '8');
    expect(confirmPasswordInput).toHaveAttribute('minLength', '8');
  });

  it('should clear password error when passwords match', () => {
    renderSignup();

    const passwordInput = screen.getByLabelText(/mot de passe.*\*/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);

    // D'abord créer une erreur
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
    fireEvent.blur(confirmPasswordInput);

    expect(screen.getByText(/les mots de passe ne correspondent pas/i)).toBeInTheDocument();

    // Puis corriger
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.blur(confirmPasswordInput);

    expect(screen.queryByText(/les mots de passe ne correspondent pas/i)).not.toBeInTheDocument();
  });

  it('should prevent form submission when validation fails', async () => {
    renderSignup();

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/mot de passe.*\*/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /créer le compte/i });

    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });

    fireEvent.click(submitButton);

    // signup ne devrait pas être appelé à cause de l'erreur de validation
    expect(mockSignup).not.toHaveBeenCalled();
  });
});