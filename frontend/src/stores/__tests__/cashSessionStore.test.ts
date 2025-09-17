import { act, renderHook } from '@testing-library/react';
import { useCashSessionStore } from '../cashSessionStore';
import { cashSessionService } from '../../services/cashSessionService';
import { saleService } from '../../services/saleService';

// Mock services
jest.mock('../../services/cashSessionService');
jest.mock('../../services/saleService');

const mockCashSessionService = cashSessionService as jest.Mocked<typeof cashSessionService>;
const mockSaleService = saleService as jest.Mocked<typeof saleService>;

describe('CashSessionStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useCashSessionStore.getState().setCurrentSession(null);
    useCashSessionStore.getState().clearCurrentSale();
    useCashSessionStore.getState().clearError();
  });

  describe('Sale Management', () => {
    it('adds sale item correctly', () => {
      const { result } = renderHook(() => useCashSessionStore());

      const saleItem = {
        id: 'item-1',
        category: 'EEE-1',
        quantity: 2,
        price: 10,
        total: 20
      };

      act(() => {
        result.current.addSaleItem(saleItem);
      });

      expect(result.current.currentSaleItems).toHaveLength(1);
      expect(result.current.currentSaleItems[0]).toEqual(saleItem);
    });

    it('removes sale item correctly', () => {
      const { result } = renderHook(() => useCashSessionStore());

      const saleItem1 = {
        id: 'item-1',
        category: 'EEE-1',
        quantity: 2,
        price: 10,
        total: 20
      };

      const saleItem2 = {
        id: 'item-2',
        category: 'EEE-2',
        quantity: 1,
        price: 15,
        total: 15
      };

      act(() => {
        result.current.addSaleItem(saleItem1);
        result.current.addSaleItem(saleItem2);
      });

      expect(result.current.currentSaleItems).toHaveLength(2);

      act(() => {
        result.current.removeSaleItem('item-1');
      });

      expect(result.current.currentSaleItems).toHaveLength(1);
      expect(result.current.currentSaleItems[0]).toEqual(saleItem2);
    });

    it('clears current sale correctly', () => {
      const { result } = renderHook(() => useCashSessionStore());

      const saleItem = {
        id: 'item-1',
        category: 'EEE-1',
        quantity: 2,
        price: 10,
        total: 20
      };

      act(() => {
        result.current.addSaleItem(saleItem);
      });

      expect(result.current.currentSaleItems).toHaveLength(1);

      act(() => {
        result.current.clearCurrentSale();
      });

      expect(result.current.currentSaleItems).toHaveLength(0);
    });

    it('updates sale item correctly', () => {
      const { result } = renderHook(() => useCashSessionStore());

      const saleItem = {
        id: 'item-1',
        category: 'EEE-1',
        quantity: 2,
        price: 10,
        total: 20
      };

      act(() => {
        result.current.addSaleItem(saleItem);
      });

      act(() => {
        result.current.updateSaleItem('item-1', { quantity: 3, total: 30 });
      });

      expect(result.current.currentSaleItems[0]).toEqual({
        id: 'item-1',
        category: 'EEE-1',
        quantity: 3,
        price: 10,
        total: 30
      });
    });
  });

  describe('Submit Sale', () => {
    it('submits sale successfully', async () => {
      const mockSession = {
        id: 'session-1',
        operator_id: 'user-1',
        initial_amount: 100,
        current_amount: 100,
        status: 'open' as const,
        opened_at: '2024-01-01T00:00:00Z'
      };

      const mockSaleResponse = {
        id: 'sale-1',
        cash_session_id: 'session-1',
        total_amount: 20,
        payment_method: 'cash',
        items: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockSaleService.createSale.mockResolvedValue(mockSaleResponse);

      const { result } = renderHook(() => useCashSessionStore());

      // Set up session
      act(() => {
        result.current.setCurrentSession(mockSession);
      });

      const saleItems = [
        {
          id: 'item-1',
          category: 'EEE-1',
          quantity: 2,
          price: 10,
          total: 20
        }
      ];

      act(() => {
        result.current.addSaleItem(saleItems[0]);
      });

      await act(async () => {
        const success = await result.current.submitSale(saleItems);
        expect(success).toBe(true);
      });

      expect(mockSaleService.createSale).toHaveBeenCalledWith({
        cash_session_id: 'session-1',
        items: saleItems,
        total_amount: 20
      });

      expect(result.current.currentSaleItems).toHaveLength(0);
    });

    it('handles submit sale error', async () => {
      const mockSession = {
        id: 'session-1',
        operator_id: 'user-1',
        initial_amount: 100,
        current_amount: 100,
        status: 'open' as const,
        opened_at: '2024-01-01T00:00:00Z'
      };

      mockSaleService.createSale.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useCashSessionStore());

      act(() => {
        result.current.setCurrentSession(mockSession);
      });

      const saleItems = [
        {
          id: 'item-1',
          category: 'EEE-1',
          quantity: 2,
          price: 10,
          total: 20
        }
      ];

      await act(async () => {
        const success = await result.current.submitSale(saleItems);
        expect(success).toBe(false);
      });

      expect(result.current.error).toBe('Erreur lors de l\'enregistrement de la vente');
    });

    it('fails to submit sale when no session is active', async () => {
      const { result } = renderHook(() => useCashSessionStore());

      const saleItems = [
        {
          id: 'item-1',
          category: 'EEE-1',
          quantity: 2,
          price: 10,
          total: 20
        }
      ];

      await act(async () => {
        const success = await result.current.submitSale(saleItems);
        expect(success).toBe(false);
      });

      expect(result.current.error).toBe('Aucune session de caisse active');
    });
  });

  describe('Error Handling', () => {
    it('sets and clears error correctly', () => {
      const { result } = renderHook(() => useCashSessionStore());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
