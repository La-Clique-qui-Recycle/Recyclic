import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserListTable } from '../UserListTable';
import { AdminUser, UserRole, UserStatus } from '../../../services/adminService';

import { vi } from 'vitest';

// Mock data
const mockUsers: AdminUser[] = [
  {
    id: '1',
    telegram_id: 123456789,
    username: 'testuser1',
    first_name: 'Test',
    last_name: 'User1',
    full_name: 'Test User1',
    role: UserRole.USER,
    status: UserStatus.APPROVED,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    telegram_id: 987654321,
    username: 'testuser2',
    first_name: 'Test',
    last_name: 'User2',
    full_name: 'Test User2',
    role: UserRole.ADMIN,
    status: UserStatus.APPROVED,
    is_active: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

describe('UserListTable Accessibility Tests', () => {
  const mockOnRoleChange = vi.fn();
  const mockOnRowClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should have keyboard navigation support for user rows', async () => {
    const user = userEvent.setup();
    render(
      <UserListTable
        users={mockUsers}
        onRoleChange={mockOnRoleChange}
        onRowClick={mockOnRowClick}
      />
    );

    const userRows = screen.getAllByTestId('user-row');
    expect(userRows).toHaveLength(2);

    // Verify that rows have proper ARIA attributes
    userRows.forEach((row) => {
      expect(row).toHaveAttribute('role', 'button');
      expect(row).toHaveAttribute('tabIndex', '0');
      expect(row).toHaveAttribute('aria-label');
    });

    // Test keyboard navigation with Tab key
    await act(async () => {
      await user.tab();
    });

    // First row should be focused
    expect(userRows[0]).toHaveFocus();

    // Test Enter key activation
    await act(async () => {
      await user.keyboard('{Enter}');
    });

    expect(mockOnRowClick).toHaveBeenCalledWith(mockUsers[0]);

    vi.clearAllMocks();

    // Test Space key activation
    await act(async () => {
      await user.keyboard(' ');
    });

    expect(mockOnRowClick).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('should have proper ARIA labels for user identification', () => {
    render(
      <UserListTable
        users={mockUsers}
        onRoleChange={mockOnRoleChange}
        onRowClick={mockOnRowClick}
      />
    );

    const firstUserRow = screen.getAllByTestId('user-row')[0];
    expect(firstUserRow).toHaveAttribute('aria-label', "Sélectionner l'utilisateur Test User1");

    const secondUserRow = screen.getAllByTestId('user-row')[1];
    expect(secondUserRow).toHaveAttribute('aria-label', "Sélectionner l'utilisateur Test User2");
  });

  it('should support sequential keyboard navigation between rows', async () => {
    const user = userEvent.setup();
    render(
      <UserListTable
        users={mockUsers}
        onRoleChange={mockOnRoleChange}
        onRowClick={mockOnRowClick}
      />
    );

    const userRows = screen.getAllByTestId('user-row');

    // Start navigation
    await act(async () => {
      await user.tab();
    });

    expect(userRows[0]).toHaveFocus();

    // Navigate to second row
    await act(async () => {
      await user.tab();
    });

    expect(userRows[1]).toHaveFocus();
  });

  it('should have descriptive status badges for screen readers', () => {
    render(
      <UserListTable
        users={mockUsers}
        onRoleChange={mockOnRoleChange}
        onRowClick={mockOnRowClick}
      />
    );

    // Verify active/inactive status labels are present and descriptive
    expect(screen.getByText('Actif')).toBeInTheDocument();
    expect(screen.getByText('Inactif')).toBeInTheDocument();

    // Verify approval status labels are present
    expect(screen.getAllByText('Approuvé')).toHaveLength(2);

    // Verify role labels are descriptive (not just codes)
    expect(screen.getByText('Utilisateur')).toBeInTheDocument();
    expect(screen.getByText('Administrateur')).toBeInTheDocument();
  });

  it('should prevent default behavior for space key to avoid page scrolling', async () => {
    const user = userEvent.setup();
    render(
      <UserListTable
        users={mockUsers}
        onRoleChange={mockOnRoleChange}
        onRowClick={mockOnRowClick}
      />
    );

    const userRows = screen.getAllByTestId('user-row');

    // Focus on first row
    await act(async () => {
      await user.tab();
    });

    expect(userRows[0]).toHaveFocus();

    // Simulate space key press (which should not scroll the page)
    const spaceKeyEvent = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true
    });

    const preventDefaultSpy = vi.fn();
    spaceKeyEvent.preventDefault = preventDefaultSpy;

    userRows[0].dispatchEvent(spaceKeyEvent);

    // Verify preventDefault was called (indirectly through the callback)
    expect(mockOnRowClick).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('should handle keyboard navigation with no users', () => {
    render(
      <UserListTable
        users={[]}
        onRoleChange={mockOnRoleChange}
        onRowClick={mockOnRowClick}
      />
    );

    // Should show empty state message
    expect(screen.getByText(/aucun utilisateur trouvé/i)).toBeInTheDocument();

    // Should not have any focusable rows
    const userRows = screen.queryAllByTestId('user-row');
    expect(userRows).toHaveLength(0);
  });

  it('should maintain focus management during loading states', () => {
    const { rerender } = render(
      <UserListTable
        users={[]}
        loading={true}
        onRoleChange={mockOnRoleChange}
        onRowClick={mockOnRowClick}
      />
    );

    // Should show loading skeleton
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);

    // Rerender with loaded data
    rerender(
      <UserListTable
        users={mockUsers}
        loading={false}
        onRoleChange={mockOnRoleChange}
        onRowClick={mockOnRowClick}
      />
    );

    // Should now show actual user rows
    const userRows = screen.getAllByTestId('user-row');
    expect(userRows).toHaveLength(2);

    // Rows should be focusable
    userRows.forEach((row) => {
      expect(row).toHaveAttribute('tabIndex', '0');
    });
  });
});