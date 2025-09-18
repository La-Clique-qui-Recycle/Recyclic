import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@test/test-utils';
import { useCashSessionStore } from '../../../stores/cashSessionStore';
import Sale from '../Sale';

// Mock the store
vi.mock('../../../stores/cashSessionStore');
const mockUseCashSessionStore = useCashSessionStore as any;

describe('Sale Page', () => {
  const mockStore = {
    currentSession: {
      id: 'session-1',
      operator_id: 'user-1',
      initial_amount: 100,
      current_amount: 100,
      status: 'open' as const,
      opened_at: '2024-01-01T00:00:00Z'
    },
    currentSaleItems: [],
    loading: false,
    error: null,
    addSaleItem: vi.fn(),
    removeSaleItem: vi.fn(),
    clearCurrentSale: vi.fn(),
    submitSale: vi.fn(),
    clearError: vi.fn()
  };

  beforeEach(() => {
    mockUseCashSessionStore.mockReturnValue(mockStore);
    vi.clearAllMocks();
  });

  it('renders sale interface correctly', () => {
    render(<Sale />);

    expect(screen.getByText('Interface de Vente')).toBeInTheDocument();
    expect(screen.getByText('Mode de saisie')).toBeInTheDocument();
    expect(screen.getByText('Catégorie')).toBeInTheDocument();
    expect(screen.getByText('Quantité')).toBeInTheDocument();
    expect(screen.getByText('Prix')).toBeInTheDocument();
  });

  it('shows category selector when in category mode', () => {
    render(<Sale />);

    expect(screen.getByText('Sélectionner la catégorie EEE')).toBeInTheDocument();
    expect(screen.getByText('EEE-1')).toBeInTheDocument();
    expect(screen.getByText('EEE-8')).toBeInTheDocument();
  });

  it('transitions to quantity mode when category is selected', () => {
    render(<Sale />);

    const eee1Button = screen.getByText('EEE-1').closest('button');
    fireEvent.click(eee1Button!);

    expect(screen.getByRole('heading', { name: 'Quantité' })).toBeInTheDocument();
    expect(screen.getByText('Valider')).toBeInTheDocument();
  });

  it('transitions to price mode when quantity is confirmed', () => {
    render(<Sale />);

    // Select category first
    const eee1Button = screen.getByText('EEE-1').closest('button');
    fireEvent.click(eee1Button!);

    // Enter quantity
    const button5 = screen.getByText('5').closest('button');
    fireEvent.click(button5!);

    // Confirm quantity
    const confirmButton = screen.getByText('Valider').closest('button');
    fireEvent.click(confirmButton!);

    expect(screen.getByText('Prix unitaire (€)')).toBeInTheDocument();
  });

  it('adds item to sale when price is confirmed', async () => {
    render(<Sale />);

    // Complete the flow: category -> quantity -> price
    const eee1Button = screen.getByText('EEE-1').closest('button');
    fireEvent.click(eee1Button!);

    const button5 = screen.getByText('5').closest('button');
    fireEvent.click(button5!);

    const confirmQuantityButton = screen.getByText('Valider').closest('button');
    fireEvent.click(confirmQuantityButton!);

    const button10 = screen.getByText('1').closest('button');
    fireEvent.click(button10!);
    fireEvent.click(screen.getByText('0').closest('button')!);

    const confirmPriceButton = screen.getByText('Valider').closest('button');
    fireEvent.click(confirmPriceButton!);

    await waitFor(() => {
      expect(mockStore.addSaleItem).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'EEE-1',
          quantity: 5,
          price: 10,
          total: 50
        })
      );
    });
  });

  it('shows sale summary when items are added', () => {
    const mockItems = [
      {
        id: 'item-1',
        category: 'EEE-1',
        quantity: 2,
        price: 10,
        total: 20
      }
    ];

    mockUseCashSessionStore.mockReturnValue({
      ...mockStore,
      currentSaleItems: mockItems
    });

    render(<Sale />);

    expect(screen.getByText('Résumé de la vente')).toBeInTheDocument();
    expect(screen.getByText('2 articles')).toBeInTheDocument();
    expect(screen.getAllByText('20.00 €')).toHaveLength(2); // Item price + total
  });

  it('calls submitSale when finalizing sale', async () => {
    const mockItems = [
      {
        id: 'item-1',
        category: 'EEE-1',
        quantity: 1,
        price: 10,
        total: 10
      }
    ];

    const mockSubmitSale = vi.fn().mockResolvedValue(true);

    mockUseCashSessionStore.mockReturnValue({
      ...mockStore,
      currentSaleItems: mockItems,
      submitSale: mockSubmitSale
    });

    render(<Sale />);

    const finalizeButton = screen.getByText('Finaliser la vente');
    fireEvent.click(finalizeButton);

    await waitFor(() => {
      expect(mockSubmitSale).toHaveBeenCalledWith(mockItems);
    });
  });

  it('does not render main interface when no session is active', () => {
    mockUseCashSessionStore.mockReturnValue({
      ...mockStore,
      currentSession: null
    });

    render(<Sale />);

    // Should not render the main interface elements
    expect(screen.queryByText('Interface de Vente')).not.toBeInTheDocument();
  });
});
