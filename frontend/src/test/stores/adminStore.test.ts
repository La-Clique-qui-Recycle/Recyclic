import { renderHook, act } from '@testing-library/react';
import { useAdminStore } from '../../stores/adminStore';
import { adminService } from '../../services/adminService';

// Mock du service adminService
jest.mock('../../services/adminService', () => ({
  adminService: {
    getUsers: jest.fn(),
    getUserStatuses: jest.fn(),
    updateUserRole: jest.fn()
  }
}));

const mockAdminService = adminService as jest.Mocked<typeof adminService>;

describe('AdminStore with User Statuses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset du store avant chaque test
    useAdminStore.getState().setUsers([]);
    useAdminStore.getState().setUserStatuses([]);
    useAdminStore.getState().setError(null);
    useAdminStore.getState().setStatusesError(null);
  });

  describe('User Status Management', () => {
    it('should fetch user statuses successfully', async () => {
      const mockStatuses = {
        user_statuses: [
          {
            user_id: '1',
            is_online: true,
            last_login: '2023-01-01T12:00:00Z',
            minutes_since_login: 5
          },
          {
            user_id: '2',
            is_online: false,
            last_login: '2023-01-01T10:00:00Z',
            minutes_since_login: 120
          }
        ],
        total_count: 2,
        online_count: 1,
        offline_count: 1,
        timestamp: '2023-01-01T12:00:00Z'
      };

      mockAdminService.getUserStatuses.mockResolvedValue(mockStatuses);

      const { result } = renderHook(() => useAdminStore());

      await act(async () => {
        await result.current.fetchUserStatuses();
      });

      expect(result.current.userStatuses).toEqual(mockStatuses.user_statuses);
      expect(result.current.statusesLoading).toBe(false);
      expect(result.current.statusesError).toBe(null);
    });

    it('should handle user statuses fetch error', async () => {
      const errorMessage = 'Failed to fetch user statuses';
      mockAdminService.getUserStatuses.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAdminStore());

      await act(async () => {
        await result.current.fetchUserStatuses();
      });

      expect(result.current.userStatuses).toEqual([]);
      expect(result.current.statusesLoading).toBe(false);
      expect(result.current.statusesError).toBe(errorMessage);
    });

    it('should start status polling', () => {
      const { result } = renderHook(() => useAdminStore());

      act(() => {
        result.current.startStatusPolling();
      });

      expect(result.current.pollingInterval).not.toBe(null);
    });

    it('should stop status polling', () => {
      const { result } = renderHook(() => useAdminStore());

      // Démarrer le polling
      act(() => {
        result.current.startStatusPolling();
      });

      expect(result.current.pollingInterval).not.toBe(null);

      // Arrêter le polling
      act(() => {
        result.current.stopStatusPolling();
      });

      expect(result.current.pollingInterval).toBe(null);
    });

    it('should restart polling when startStatusPolling is called multiple times', () => {
      const { result } = renderHook(() => useAdminStore());

      // Démarrer le polling
      act(() => {
        result.current.startStatusPolling();
      });

      const firstInterval = result.current.pollingInterval;

      // Redémarrer le polling
      act(() => {
        result.current.startStatusPolling();
      });

      const secondInterval = result.current.pollingInterval;

      // Les intervalles devraient être différents (le premier a été nettoyé)
      expect(secondInterval).not.toBe(firstInterval);
    });

    it('should handle stopStatusPolling when no polling is active', () => {
      const { result } = renderHook(() => useAdminStore());

      // Essayer d'arrêter le polling sans l'avoir démarré
      act(() => {
        result.current.stopStatusPolling();
      });

      expect(result.current.pollingInterval).toBe(null);
    });
  });

  describe('Status Polling Integration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should poll user statuses every 60 seconds', async () => {
      const mockStatuses = {
        user_statuses: [
          {
            user_id: '1',
            is_online: true,
            last_login: '2023-01-01T12:00:00Z',
            minutes_since_login: 5
          }
        ],
        total_count: 1,
        online_count: 1,
        offline_count: 0,
        timestamp: '2023-01-01T12:00:00Z'
      };

      mockAdminService.getUserStatuses.mockResolvedValue(mockStatuses);

      const { result } = renderHook(() => useAdminStore());

      // Démarrer le polling
      act(() => {
        result.current.startStatusPolling();
      });

      // Vérifier que la première récupération a eu lieu
      expect(mockAdminService.getUserStatuses).toHaveBeenCalledTimes(1);

      // Avancer le temps de 60 secondes
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      // Vérifier que la deuxième récupération a eu lieu
      expect(mockAdminService.getUserStatuses).toHaveBeenCalledTimes(2);

      // Avancer encore de 60 secondes
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      // Vérifier que la troisième récupération a eu lieu
      expect(mockAdminService.getUserStatuses).toHaveBeenCalledTimes(3);
    });

    it('should stop polling when stopStatusPolling is called', async () => {
      const mockStatuses = {
        user_statuses: [],
        total_count: 0,
        online_count: 0,
        offline_count: 0,
        timestamp: '2023-01-01T12:00:00Z'
      };

      mockAdminService.getUserStatuses.mockResolvedValue(mockStatuses);

      const { result } = renderHook(() => useAdminStore());

      // Démarrer le polling
      act(() => {
        result.current.startStatusPolling();
      });

      // Arrêter le polling
      act(() => {
        result.current.stopStatusPolling();
      });

      // Avancer le temps de 60 secondes
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      // Vérifier que getUserStatuses n'a été appelé qu'une seule fois (au démarrage)
      expect(mockAdminService.getUserStatuses).toHaveBeenCalledTimes(1);
    });
  });

  describe('Status Setters', () => {
    it('should set user statuses', () => {
      const { result } = renderHook(() => useAdminStore());

      const mockStatuses = [
        {
          user_id: '1',
          is_online: true,
          last_login: '2023-01-01T12:00:00Z',
          minutes_since_login: 5
        }
      ];

      act(() => {
        result.current.setUserStatuses(mockStatuses);
      });

      expect(result.current.userStatuses).toEqual(mockStatuses);
    });

    it('should set statuses loading state', () => {
      const { result } = renderHook(() => useAdminStore());

      act(() => {
        result.current.setStatusesLoading(true);
      });

      expect(result.current.statusesLoading).toBe(true);

      act(() => {
        result.current.setStatusesLoading(false);
      });

      expect(result.current.statusesLoading).toBe(false);
    });

    it('should set statuses error', () => {
      const { result } = renderHook(() => useAdminStore());

      const errorMessage = 'Status fetch error';

      act(() => {
        result.current.setStatusesError(errorMessage);
      });

      expect(result.current.statusesError).toBe(errorMessage);

      act(() => {
        result.current.setStatusesError(null);
      });

      expect(result.current.statusesError).toBe(null);
    });
  });
});


