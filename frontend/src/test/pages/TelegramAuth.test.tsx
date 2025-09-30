import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TelegramAuth from '../../pages/TelegramAuth.jsx';
import { renderWithRouter } from '../test-utils';
import { linkTelegramAccount } from '../../services/api';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockSearchParams = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams()]
  };
});

// Mock the API service
vi.mock('../../services/api', () => ({
  linkTelegramAccount: vi.fn()
}));

// Utiliser la fonction renderWithRouter du test-utils

describe('TelegramAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue(new URLSearchParams());
    vi.mocked(linkTelegramAccount).mockClear();
  });

  it('should render the main question and buttons', () => {
    renderWithRouter(<TelegramAuth />);
    
    expect(screen.getByText('Avez-vous déjà un compte Recyclic ?')).toBeInTheDocument();
    expect(screen.getByText("S'inscrire")).toBeInTheDocument();
    expect(screen.getByText('Se connecter')).toBeInTheDocument();
  });

  it('should navigate to registration with preserved URL parameters', () => {
    const searchParams = new URLSearchParams('telegram_id=12345&source=bot');
    mockSearchParams.mockReturnValue(searchParams);
    
    renderWithRouter(<TelegramAuth />);
    
    const registerButton = screen.getByText("S'inscrire");
    fireEvent.click(registerButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/inscription?telegram_id=12345&source=bot');
  });

  it('should navigate to registration without parameters when none present', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams());
    
    renderWithRouter(<TelegramAuth />);
    
    const registerButton = screen.getByText("S'inscrire");
    fireEvent.click(registerButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/inscription');
  });

  it('should show login form when "Se connecter" is clicked', async () => {
    renderWithRouter(<TelegramAuth />);
    
    const loginButton = screen.getByText('Se connecter');
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Identifiant')).toBeInTheDocument();
      expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
      expect(screen.getByText('Lier le compte')).toBeInTheDocument();
    });
  });

  it('should handle successful account linking', async () => {
    // Mock URL parameters with telegram_id
    const searchParams = new URLSearchParams('telegram_id=12345');
    mockSearchParams.mockReturnValue(searchParams);
    
    // Mock successful API response
    vi.mocked(linkTelegramAccount).mockResolvedValue({ success: true });
    
    renderWithRouter(<TelegramAuth />);
    
    // Show login form
    const loginButton = screen.getByText('Se connecter');
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Identifiant')).toBeInTheDocument();
    });
    
    // Fill form
    const usernameInput = screen.getByLabelText('Identifiant');
    const passwordInput = screen.getByLabelText('Mot de passe');
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });
    
    // Submit form
    const submitButton = screen.getByText('Lier le compte');
    fireEvent.click(submitButton);
    
    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Liaison en cours...')).toBeInTheDocument();
    });
    
    // Check API call
    expect(linkTelegramAccount).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'testpass',
      telegram_id: '12345'
    });
    
    // Check success message
    await waitFor(() => {
      expect(screen.getByText('✅ Votre compte a été lié avec succès !')).toBeInTheDocument();
    });
  });

  it('should handle authentication error (401)', async () => {
    // Mock URL parameters with telegram_id
    const searchParams = new URLSearchParams('telegram_id=12345');
    mockSearchParams.mockReturnValue(searchParams);
    
    // Mock 401 error
    const error = new Error('Unauthorized');
    error.response = { status: 401 };
    vi.mocked(linkTelegramAccount).mockRejectedValue(error);
    
    renderWithRouter(<TelegramAuth />);
    
    // Show login form
    const loginButton = screen.getByText('Se connecter');
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Identifiant')).toBeInTheDocument();
    });
    
    // Fill form
    const usernameInput = screen.getByLabelText('Identifiant');
    const passwordInput = screen.getByLabelText('Mot de passe');
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    
    // Submit form
    const submitButton = screen.getByText('Lier le compte');
    fireEvent.click(submitButton);
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByText('Nom d\'utilisateur ou mot de passe incorrect.')).toBeInTheDocument();
    });
  });

  it('should handle conflict error (409)', async () => {
    // Mock URL parameters with telegram_id
    const searchParams = new URLSearchParams('telegram_id=12345');
    mockSearchParams.mockReturnValue(searchParams);
    
    // Mock 409 error
    const error = new Error('Conflict');
    error.response = { status: 409 };
    vi.mocked(linkTelegramAccount).mockRejectedValue(error);
    
    renderWithRouter(<TelegramAuth />);
    
    // Show login form
    const loginButton = screen.getByText('Se connecter');
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Identifiant')).toBeInTheDocument();
    });
    
    // Fill form
    const usernameInput = screen.getByLabelText('Identifiant');
    const passwordInput = screen.getByLabelText('Mot de passe');
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });
    
    // Submit form
    const submitButton = screen.getByText('Lier le compte');
    fireEvent.click(submitButton);
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByText('Ce compte Telegram est déjà lié à un autre utilisateur.')).toBeInTheDocument();
    });
  });

  it('should handle missing telegram_id parameter', async () => {
    // Mock URL parameters without telegram_id
    mockSearchParams.mockReturnValue(new URLSearchParams());
    
    renderWithRouter(<TelegramAuth />);
    
    // Show login form
    const loginButton = screen.getByText('Se connecter');
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Identifiant')).toBeInTheDocument();
    });
    
    // Fill form
    const usernameInput = screen.getByLabelText('Identifiant');
    const passwordInput = screen.getByLabelText('Mot de passe');
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });
    
    // Submit form
    const submitButton = screen.getByText('Lier le compte');
    fireEvent.click(submitButton);
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByText('Paramètre telegram_id manquant dans l\'URL.')).toBeInTheDocument();
    });
    
    // API should not be called
    expect(linkTelegramAccount).not.toHaveBeenCalled();
  });

  it('should handle generic error', async () => {
    // Mock URL parameters with telegram_id
    const searchParams = new URLSearchParams('telegram_id=12345');
    mockSearchParams.mockReturnValue(searchParams);
    
    // Mock generic error
    const error = new Error('Server Error');
    error.response = { status: 500 };
    vi.mocked(linkTelegramAccount).mockRejectedValue(error);
    
    renderWithRouter(<TelegramAuth />);
    
    // Show login form
    const loginButton = screen.getByText('Se connecter');
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Identifiant')).toBeInTheDocument();
    });
    
    // Fill form
    const usernameInput = screen.getByLabelText('Identifiant');
    const passwordInput = screen.getByLabelText('Mot de passe');
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });
    
    // Submit form
    const submitButton = screen.getByText('Lier le compte');
    fireEvent.click(submitButton);
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByText('Une erreur est survenue lors de la liaison du compte. Veuillez réessayer.')).toBeInTheDocument();
    });
  });

  it('should disable form inputs during loading', async () => {
    // Mock URL parameters with telegram_id
    const searchParams = new URLSearchParams('telegram_id=12345');
    mockSearchParams.mockReturnValue(searchParams);
    
    // Mock API that takes time to resolve
    vi.mocked(linkTelegramAccount).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );
    
    renderWithRouter(<TelegramAuth />);
    
    // Show login form
    const loginButton = screen.getByText('Se connecter');
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Identifiant')).toBeInTheDocument();
    });
    
    // Fill form
    const usernameInput = screen.getByLabelText('Identifiant');
    const passwordInput = screen.getByLabelText('Mot de passe');
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });
    
    // Submit form
    const submitButton = screen.getByText('Lier le compte');
    fireEvent.click(submitButton);
    
    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Liaison en cours...')).toBeInTheDocument();
    });
    
    // Check that inputs are disabled during loading
    expect(usernameInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('should have proper styling and layout', () => {
    renderWithRouter(<TelegramAuth />);
    
    // Check that the main container and title are present
    expect(screen.getByText('🔗 Liaison de Compte Telegram')).toBeInTheDocument();
    
    // Check that buttons are properly styled (they should be buttons)
    const registerButton = screen.getByText("S'inscrire");
    const loginButton = screen.getByText('Se connecter');
    
    expect(registerButton).toBeInTheDocument();
    expect(loginButton).toBeInTheDocument();
  });

  it('should handle empty URL parameters gracefully', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams(''));
    
    renderWithRouter(<TelegramAuth />);
    
    const registerButton = screen.getByText("S'inscrire");
    fireEvent.click(registerButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/inscription');
  });
});
