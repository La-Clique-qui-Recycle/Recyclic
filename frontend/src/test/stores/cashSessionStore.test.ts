import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useCashSessionStore } from '../../stores/cashSessionStore';
import { cashSessionService } from '../../services/cashSessionService';

// Mock du service
vi.mock('../../services/cashSessionService');

const mockCashSessionService = cashSessionService as any;

describe('useCashSessionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset du store
    useCashSessionStore.getState().setCurrentSession(null);
    useCashSessionStore.getState().setSessions([]);
    useCashSessionStore.getState().setError(null);
    useCashSessionStore.getState().setLoading(false);
  });

  describe('openSession', () => {
    it('should create a new session successfully', async () => {
      const mockSession = {
        id: 'session-123',
        operator_id: 'user-123',
        initial_amount: 50.0,
        current_amount: 50.0,
        status: 'open' as const,
        opened_at: '2025-01-27T10:00:00Z',
        total_sales: 0,
        total_items: 0
      };

      mockCashSessionService.createSession = vi.fn().mockResolvedValue(mockSession);

      const { result } = renderHook(() => useCashSessionStore());

      await act(async () => {
        const session = await result.current.openSession({
          operator_id: 'user-123',
          initial_amount: 50.0
        });
        expect(session).toEqual(mockSession);
      });

      expect(result.current.currentSession).toEqual(mockSession);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle session creation error', async () => {
      const errorMessage = 'Erreur de création de session';
      mockCashSessionService.createSession = vi.fn().mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useCashSessionStore());

      await act(async () => {
        const session = await result.current.openSession({
          operator_id: 'user-123',
          initial_amount: 50.0
        });
        expect(session).toBeNull();
      });

      expect(result.current.currentSession).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('closeSession', () => {
    it('should close a session successfully', async () => {
      const mockSession = {
        id: 'session-123',
        operator_id: 'user-123',
        initial_amount: 50.0,
        current_amount: 75.0,
        status: 'closed' as const,
        opened_at: '2025-01-27T10:00:00Z',
        closed_at: '2025-01-27T18:00:00Z',
        total_sales: 25.0,
        total_items: 3
      };

      mockCashSessionService.closeSession = vi.fn().mockResolvedValue(true);

      const { result } = renderHook(() => useCashSessionStore());

      // D'abord ouvrir une session
      act(() => {
        result.current.setCurrentSession({
          id: 'session-123',
          operator_id: 'user-123',
          initial_amount: 50.0,
          current_amount: 50.0,
          status: 'open',
          opened_at: '2025-01-27T10:00:00Z',
          total_sales: 0,
          total_items: 0
        });
      });

      await act(async () => {
        const success = await result.current.closeSession('session-123');
        expect(success).toBe(true);
      });

      expect(result.current.currentSession).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle close session error', async () => {
      const errorMessage = 'Erreur de fermeture de session';
      mockCashSessionService.closeSession = vi.fn().mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useCashSessionStore());

      await act(async () => {
        const success = await result.current.closeSession('session-123');
        expect(success).toBe(false);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('updateSession', () => {
    it('should update a session successfully', async () => {
      const mockUpdatedSession = {
        id: 'session-123',
        operator_id: 'user-123',
        initial_amount: 50.0,
        current_amount: 100.0,
        status: 'open' as const,
        opened_at: '2025-01-27T10:00:00Z',
        total_sales: 50.0,
        total_items: 5
      };

      mockCashSessionService.updateSession = vi.fn().mockResolvedValue(mockUpdatedSession);

      const { result } = renderHook(() => useCashSessionStore());

      // D'abord ouvrir une session
      act(() => {
        result.current.setCurrentSession({
          id: 'session-123',
          operator_id: 'user-123',
          initial_amount: 50.0,
          current_amount: 50.0,
          status: 'open',
          opened_at: '2025-01-27T10:00:00Z',
          total_sales: 0,
          total_items: 0
        });
      });

      await act(async () => {
        const success = await result.current.updateSession('session-123', {
          current_amount: 100.0,
          total_sales: 50.0,
          total_items: 5
        });
        expect(success).toBe(true);
      });

      expect(result.current.currentSession).toEqual(mockUpdatedSession);
      expect(result.current.loading).toBe(false);
    });

    it('should handle update session error', async () => {
      const errorMessage = 'Erreur de mise à jour de session';
      mockCashSessionService.updateSession = vi.fn().mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useCashSessionStore());

      await act(async () => {
        const success = await result.current.updateSession('session-123', {
          current_amount: 100.0
        });
        expect(success).toBe(false);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('fetchSessions', () => {
    it('should fetch sessions successfully', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          operator_id: 'user-1',
          initial_amount: 50.0,
          current_amount: 75.0,
          status: 'closed' as const,
          opened_at: '2025-01-27T10:00:00Z',
          closed_at: '2025-01-27T18:00:00Z',
          total_sales: 25.0,
          total_items: 3
        },
        {
          id: 'session-2',
          operator_id: 'user-2',
          initial_amount: 100.0,
          current_amount: 100.0,
          status: 'open' as const,
          opened_at: '2025-01-27T20:00:00Z',
          total_sales: 0,
          total_items: 0
        }
      ];

      mockCashSessionService.getSessions = vi.fn().mockResolvedValue(mockSessions);

      const { result } = renderHook(() => useCashSessionStore());

      await act(async () => {
        await result.current.fetchSessions();
      });

      expect(result.current.sessions).toEqual(mockSessions);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch sessions error', async () => {
      const errorMessage = 'Erreur de récupération des sessions';
      mockCashSessionService.getSessions = vi.fn().mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useCashSessionStore());

      await act(async () => {
        await result.current.fetchSessions();
      });

      expect(result.current.sessions).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('fetchCurrentSession', () => {
    it('should fetch current session from localStorage', async () => {
      const mockSession = {
        id: 'session-123',
        operator_id: 'user-123',
        initial_amount: 50.0,
        current_amount: 50.0,
        status: 'open' as const,
        opened_at: '2025-01-27T10:00:00Z',
        total_sales: 0,
        total_items: 0
      };

      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn().mockReturnValue(JSON.stringify(mockSession)),
        setItem: vi.fn(),
        removeItem: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      });

      mockCashSessionService.getSession = vi.fn().mockResolvedValue(mockSession);

      const { result } = renderHook(() => useCashSessionStore());

      await act(async () => {
        await result.current.fetchCurrentSession();
      });

      expect(result.current.currentSession).toEqual(mockSession);
      expect(result.current.loading).toBe(false);
    });

    it('should clear localStorage if session is closed on server', async () => {
      const mockSession = {
        id: 'session-123',
        operator_id: 'user-123',
        initial_amount: 50.0,
        current_amount: 50.0,
        status: 'closed' as const,
        opened_at: '2025-01-27T10:00:00Z',
        closed_at: '2025-01-27T18:00:00Z',
        total_sales: 25.0,
        total_items: 3
      };

      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn().mockReturnValue(JSON.stringify(mockSession)),
        setItem: vi.fn(),
        removeItem: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      });

      mockCashSessionService.getSession = vi.fn().mockResolvedValue(mockSession);

      const { result } = renderHook(() => useCashSessionStore());

      await act(async () => {
        await result.current.fetchCurrentSession();
      });

      expect(result.current.currentSession).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('currentCashSession');
    });
  });

  describe('refreshSession', () => {
    it('should refresh current session if exists', async () => {
      const mockSession = {
        id: 'session-123',
        operator_id: 'user-123',
        initial_amount: 50.0,
        current_amount: 50.0,
        status: 'open' as const,
        opened_at: '2025-01-27T10:00:00Z',
        total_sales: 0,
        total_items: 0
      };

      const { result } = renderHook(() => useCashSessionStore());

      // D'abord ouvrir une session
      act(() => {
        result.current.setCurrentSession(mockSession);
      });

      // Mock fetchCurrentSession
      const fetchCurrentSessionSpy = vi.spyOn(result.current, 'fetchCurrentSession');

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(fetchCurrentSessionSpy).toHaveBeenCalled();
    });

    it('should not refresh if no current session', async () => {
      const { result } = renderHook(() => useCashSessionStore());

      // Mock fetchCurrentSession
      const fetchCurrentSessionSpy = vi.spyOn(result.current, 'fetchCurrentSession');

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(fetchCurrentSessionSpy).not.toHaveBeenCalled();
    });
  });

  describe('setters', () => {
    it('should set current session', () => {
      const { result } = renderHook(() => useCashSessionStore());

      const mockSession = {
        id: 'session-123',
        operator_id: 'user-123',
        initial_amount: 50.0,
        current_amount: 50.0,
        status: 'open' as const,
        opened_at: '2025-01-27T10:00:00Z',
        total_sales: 0,
        total_items: 0
      };

      act(() => {
        result.current.setCurrentSession(mockSession);
      });

      expect(result.current.currentSession).toEqual(mockSession);
    });

    it('should set sessions', () => {
      const { result } = renderHook(() => useCashSessionStore());

      const mockSessions = [
        {
          id: 'session-1',
          operator_id: 'user-1',
          initial_amount: 50.0,
          current_amount: 75.0,
          status: 'closed' as const,
          opened_at: '2025-01-27T10:00:00Z',
          closed_at: '2025-01-27T18:00:00Z',
          total_sales: 25.0,
          total_items: 3
        }
      ];

      act(() => {
        result.current.setSessions(mockSessions);
      });

      expect(result.current.sessions).toEqual(mockSessions);
    });

    it('should set loading state', () => {
      const { result } = renderHook(() => useCashSessionStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);
    });

    it('should set error', () => {
      const { result } = renderHook(() => useCashSessionStore());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useCashSessionStore());

      act(() => {
        result.current.setError('Test error');
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
