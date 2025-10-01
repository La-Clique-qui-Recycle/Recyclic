import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Reception from './Reception';
import { ReceptionProvider } from '../contexts/ReceptionContext';
import { useAuthStore } from '../stores/authStore';

// Mock the auth store
vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn()
}));

// Mock the reception service
vi.mock('../services/receptionService', () => ({
  receptionService: {
    openPoste: vi.fn(),
    closePoste: vi.fn(),
    createTicket: vi.fn()
  }
}));

const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'user'
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <ReceptionProvider>
      {children}
    </ReceptionProvider>
  </MemoryRouter>
);

describe('Reception Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue(mockUser);
  });

  it('should display loading message when opening poste', () => {
    render(
      <TestWrapper>
        <Reception />
      </TestWrapper>
    );

    expect(screen.getByText('Ouverture du poste de réception...')).toBeInTheDocument();
  });

  it('should not create infinite loop when openPoste fails', async () => {
    const { receptionService } = await import('../services/receptionService');
    (receptionService.openPoste as any).mockRejectedValue(new Error('API Error'));

    render(
      <TestWrapper>
        <Reception />
      </TestWrapper>
    );

    // Wait for the error to be handled
    await waitFor(() => {
      expect(receptionService.openPoste).toHaveBeenCalledTimes(1);
    });

    // Verify it doesn't keep calling openPoste
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(receptionService.openPoste).toHaveBeenCalledTimes(1);
  });
});
