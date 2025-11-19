import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TicketForm from './TicketForm';
import { ReceptionProvider } from '../../contexts/ReceptionContext';
import { useCategoryStore } from '../../stores/categoryStore';
import { useAuthStore } from '../../stores/authStore';
import type { Category } from '../../services/categoryService';

// Mock the stores
vi.mock('../../stores/categoryStore', () => ({
  useCategoryStore: vi.fn()
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn()
}));

vi.mock('../../contexts/ReceptionContext', () => ({
  ReceptionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReception: vi.fn()
}));

// Mock the services
vi.mock('../../services/receptionService', () => ({
  receptionService: {
    getTicket: vi.fn(),
    addLineToTicket: vi.fn(),
    updateTicketLine: vi.fn(),
    deleteTicketLine: vi.fn(),
    closeTicket: vi.fn()
  }
}));

const mockUseCategoryStore = vi.mocked(useCategoryStore);
const mockUseAuthStore = vi.mocked(useAuthStore);
const mockUseReception = vi.mocked(require('../../contexts/ReceptionContext').useReception);

const mockCategories: Category[] = [
  {
    id: 'cat-a',
    name: 'Category A',
    shortcut_key: 'a',
    is_active: true,
    parent_id: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-b',
    name: 'Category B',
    shortcut_key: 'b',
    is_active: true,
    parent_id: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-c',
    name: 'Category C',
    shortcut_key: null,
    is_active: true,
    parent_id: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

const mockCurrentTicket = {
  id: 'ticket-1',
  status: 'open',
  lignes: []
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/reception/ticket-1']}>
        <Routes>
          <Route path="/reception/:ticketId" element={
            <ReceptionProvider>
              {children}
            </ReceptionProvider>
          } />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('TicketForm Keyboard Shortcuts Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock stores
    mockUseCategoryStore.mockReturnValue({
      activeCategories: mockCategories,
      loading: false,
      error: null,
      fetchCategories: vi.fn(),
      getActiveCategories: vi.fn(() => mockCategories),
      getCategoryById: vi.fn((id) => mockCategories.find(cat => cat.id === id)),
      clearError: vi.fn()
    });

    mockUseAuthStore.mockReturnValue({
      currentUser: {
        id: 'user-1',
        username: 'testuser',
        role: 'user',
        status: 'active',
        is_active: true
      },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn()
    });

    mockUseReception.mockReturnValue({
      currentTicket: mockCurrentTicket,
      isLoading: false,
      addLineToTicket: vi.fn(),
      updateTicketLine: vi.fn(),
      deleteTicketLine: vi.fn(),
      closeTicket: vi.fn()
    });

    // Setup DOM for keyboard events
    document.body.innerHTML = `
      <div id="root"></div>
      <input type="text" id="test-input" style="position: absolute; left: -9999px;" />
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('shortcut display', () => {
    it('should display shortcut badges for categories with shortcuts', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Check that shortcut badges are displayed
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();

      // Category C should not have a shortcut badge
      const categoryCButton = screen.getByText('Category C').closest('button');
      expect(categoryCButton?.querySelector('[aria-hidden="true"]')).toBeNull();
    });

    it('should have proper accessibility labels', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      const categoryAButton = screen.getByText('Category A').closest('button');
      expect(categoryAButton).toHaveAttribute(
        'aria-label',
        'Sélectionner Category A. Raccourci clavier: A'
      );

      const categoryCButton = screen.getByText('Category C').closest('button');
      expect(categoryCButton).toHaveAttribute(
        'aria-label',
        'Sélectionner Category C'
      );
    });
  });

  describe('keyboard shortcuts functionality', () => {
    it('should trigger category selection via keyboard shortcut', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Trigger keyboard shortcut
      const keyEvent = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(keyEvent);

      // Check that category selection is indicated (breadcrumb should appear)
      await waitFor(() => {
        expect(screen.getByText('Catégorie sélectionnée:')).toBeInTheDocument();
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });
    });

    it('should handle uppercase shortcut keys', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Trigger uppercase shortcut
      const keyEvent = new KeyboardEvent('keydown', { key: 'A' });
      document.dispatchEvent(keyEvent);

      await waitFor(() => {
        expect(screen.getByText('Catégorie sélectionnée:')).toBeInTheDocument();
      });
    });

    it('should not trigger shortcuts when ticket is closed', async () => {
      // Mock closed ticket
      mockUseReception.mockReturnValue({
        currentTicket: { ...mockCurrentTicket, status: 'closed' },
        isLoading: false,
        addLineToTicket: vi.fn(),
        updateTicketLine: vi.fn(),
        deleteTicketLine: vi.fn(),
        closeTicket: vi.fn()
      });

      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Try to trigger shortcut on closed ticket
      const keyEvent = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(keyEvent);

      // Should not select category (no breadcrumb)
      expect(screen.queryByText('Catégorie sélectionnée:')).not.toBeInTheDocument();
    });

    it('should prevent shortcuts when input is focused', async () => {
      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Focus on an input element
      const input = document.getElementById('test-input') as HTMLInputElement;
      input.focus();

      // Try to trigger shortcut
      const keyEvent = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(keyEvent);

      // Should not select category
      expect(screen.queryByText('Catégorie sélectionnée:')).not.toBeInTheDocument();
    });
  });

  describe('user role compatibility', () => {
    it('should work for benevole (user) role', async () => {
      mockUseAuthStore.mockReturnValue({
        currentUser: {
          id: 'user-1',
          username: 'benevole',
          role: 'user',
          status: 'active',
          is_active: true
        },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn()
      });

      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Should display shortcuts for benevole
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('should work for admin role', async () => {
      mockUseAuthStore.mockReturnValue({
        currentUser: {
          id: 'admin-1',
          username: 'admin',
          role: 'admin',
          status: 'active',
          is_active: true
        },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn()
      });

      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Should display shortcuts for admin
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('should work for superadmin role', async () => {
      mockUseAuthStore.mockReturnValue({
        currentUser: {
          id: 'superadmin-1',
          username: 'superadmin',
          role: 'super-admin',
          status: 'active',
          is_active: true
        },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn()
      });

      render(
        <TestWrapper>
          <TicketForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category A')).toBeInTheDocument();
      });

      // Should display shortcuts for superadmin
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
    });
  });
});
