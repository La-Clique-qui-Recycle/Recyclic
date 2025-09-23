import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { vi } from 'vitest';
import { UserDetailView } from '../UserDetailView';
import { AdminUser, UserRole, UserStatus } from '../../../services/adminService';

// Mock des icônes Tabler pour éviter le rendu réel
vi.mock('@tabler/icons-react', () => ({
  IconUser: () => <div data-testid="icon-user">IconUser</div>,
  IconHistory: () => <div data-testid="icon-history">IconHistory</div>,
}));

// Spy pour fetchUserHistory via le store
const fetchUserHistorySpy = vi.fn();

vi.mock('../../../stores/adminStore', () => ({
  useAdminStore: () => ({
    userHistory: [],
    historyLoading: false,
    historyError: null,
    fetchUserHistory: fetchUserHistorySpy,
  }),
}));

const mockUser: AdminUser = {
  id: '1',
  telegram_id: 123456789,
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  full_name: 'Test User',
  email: 'test@example.com',
  role: UserRole.USER,
  status: UserStatus.APPROVED,
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(<MantineProvider>{component}</MantineProvider>);
};

describe('UserDetailView - Onglet Historique (intégration)', () => {
  beforeEach(() => {
    fetchUserHistorySpy.mockClear();
  });

  it('déclenche fetchUserHistory quand on ouvre l’onglet Historique', () => {
    renderWithProvider(<UserDetailView user={mockUser} />);

    // Ouvrir l’onglet Historique
    const historyTab = screen.getByText('Historique');
    fireEvent.click(historyTab);

    // L’ouverture monte UserHistoryTab, son useEffect doit appeler fetchUserHistory(user.id)
    expect(fetchUserHistorySpy).toHaveBeenCalled();
    expect(fetchUserHistorySpy).toHaveBeenCalledWith('1');
  });
});


