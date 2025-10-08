import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@test/test-utils';
import { useCashSessionStore } from '../../../stores/cashSessionStore';
import Sale from '../Sale';

vi.mock('../../../stores/cashSessionStore');
const mockUseCashSessionStore = useCashSessionStore as any;

describe('Sale - Finalization Screen Integration', () => {
  const baseStore = {
    currentSession: { id: 'S1', status: 'open', operator_id: 'op', initial_amount: 0, current_amount: 0, opened_at: new Date().toISOString() },
    currentSaleItems: [
      { id: 'it1', category: 'EEE-1', quantity: 1, weight: 2, price: 10, total: 10 },
    ],
    addSaleItem: vi.fn(),
    removeSaleItem: vi.fn(),
    updateSaleItem: vi.fn(),
    submitSale: vi.fn(),
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCashSessionStore.mockReturnValue(baseStore);
    (mockUseCashSessionStore as any).getState = () => ({ error: null });
  });

  it('opens finalization modal and confirms with card', async () => {
    const submitSale = vi.fn().mockResolvedValue(true);
    mockUseCashSessionStore.mockReturnValue({
      ...baseStore,
      submitSale,
    });

    render(<Sale />);

    fireEvent.click(screen.getByRole('button', { name: 'Finaliser la vente' }));

    await waitFor(() => {
      expect(screen.getByTestId('finalization-screen')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('payment-select'), { target: { value: 'card' } });
    fireEvent.click(screen.getByTestId('confirm-finalization'));

    await waitFor(() => {
      expect(submitSale).toHaveBeenCalled();
      const args = submitSale.mock.calls[0];
      expect(args[0]).toHaveLength(1);
      expect(args[1]).toMatchObject({ paymentMethod: 'card' });
    });
  });

  it('computes change and confirms with cash', async () => {
    const submitSale = vi.fn().mockResolvedValue(true);
    mockUseCashSessionStore.mockReturnValue({
      ...baseStore,
      submitSale,
    });

    render(<Sale />);
    fireEvent.click(screen.getByRole('button', { name: 'Finaliser la vente' }));

    await waitFor(() => {
      expect(screen.getByTestId('finalization-screen')).toBeInTheDocument();
    });

    // donation 1, amount due = 11, cash given 20 -> change 9
    fireEvent.change(screen.getByTestId('donation-input'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('cash-given-input'), { target: { value: '20' } });
    expect((screen.getByTestId('change-output') as HTMLInputElement).value).toBe('9.00');

    fireEvent.click(screen.getByTestId('confirm-finalization'));
    await waitFor(() => {
      expect(submitSale).toHaveBeenCalled();
      const payload = submitSale.mock.calls[0][1];
      expect(payload).toMatchObject({ paymentMethod: 'cash', donation: 1, change: 9.00 });
    });
  });
});


