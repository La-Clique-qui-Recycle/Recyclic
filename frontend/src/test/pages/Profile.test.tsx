import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Profile from '../../pages/Profile';

vi.stubGlobal('fetch', vi.fn());

describe('Profile page', () => {
  beforeEach(() => {
    (global.fetch as any).mockReset();
    // minimal auth store mock
    (window as any).useAuthStore = {
      getState: () => ({
        currentUser: { id: 'u1', username: 'john', first_name: 'John', last_name: 'Doe', role: 'user', is_active: true },
        setCurrentUser: vi.fn(),
      })
    };
  });

  it('updates profile info', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'u1', username: 'jane', first_name: 'Jane', last_name: 'Doe', role: 'user', is_active: true }) });

    render(
      <MemoryRouter initialEntries={[{ pathname: '/profil' }] }>
        <Routes>
          <Route path="/profil" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText('Identifiant'), { target: { value: 'jane' } });
    fireEvent.click(screen.getByText('Enregistrer les modifications'));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  it('updates password', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(
      <MemoryRouter initialEntries={[{ pathname: '/profil' }] }>
        <Routes>
          <Route path="/profil" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Nouveau mot de passe'), { target: { value: 'StrongP@ssw0rd' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmer le nouveau mot de passe'), { target: { value: 'StrongP@ssw0rd' } });
    fireEvent.click(screen.getByText('Mettre à jour le mot de passe'));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });
});


