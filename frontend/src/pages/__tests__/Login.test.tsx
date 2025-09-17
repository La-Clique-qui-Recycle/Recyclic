import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';
import { useAuthStore } from '../../stores/authStore';

// Mock du store d'authentification
vi.mock('../../stores/authStore');

// Mock de useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock du store
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      loading: false,
      error: null,
    } as any);
  });

  it('devrait afficher les champs username et password', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Nom d\'utilisateur')).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
  });

  it('devrait appeler la fonction login avec les bonnes données', async () => {
    mockLogin.mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText('Nom d\'utilisateur');
    const passwordInput = screen.getByLabelText('Mot de passe');
    const submitButton = screen.getByRole('button', { name: 'Se connecter' });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'testpass');
    });
  });

  it('devrait afficher un message d\'erreur si fourni par le store', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      loading: false,
      error: 'Nom d\'utilisateur ou mot de passe invalide',
    } as any);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText('Nom d\'utilisateur ou mot de passe invalide')).toBeInTheDocument();
  });

  it('devrait désactiver le bouton et afficher "Connexion..." pendant le chargement', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      loading: true,
      error: null,
    } as any);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const submitButton = screen.getByRole('button', { name: 'Connexion...' });
    expect(submitButton).toBeDisabled();
  });

  it('devrait rediriger vers la page d\'accueil après une connexion réussie', async () => {
    mockLogin.mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText('Nom d\'utilisateur');
    const passwordInput = screen.getByLabelText('Mot de passe');
    const submitButton = screen.getByRole('button', { name: 'Se connecter' });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
