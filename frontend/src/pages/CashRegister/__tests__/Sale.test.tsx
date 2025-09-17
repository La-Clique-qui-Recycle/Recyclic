import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { useCashSessionStore } from '../../../stores/cashSessionStore';
import Sale from '../Sale';

// Mock the store
jest.mock('../../../stores/cashSessionStore');
const mockUseCashSessionStore = useCashSessionStore as jest.MockedFunction<typeof useCashSessionStore>;

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <MantineProvider>
        {component}
      </MantineProvider>
    </BrowserRouter>
  );
};

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
    addSaleItem: jest.fn(),
    removeSaleItem: jest.fn(),
    clearCurrentSale: jest.fn(),
    submitSale: jest.fn(),
    clearError: jest.fn()
  };

  beforeEach(() => {
    mockUseCashSessionStore.mockReturnValue(mockStore);
    jest.clearAllMocks();
  });

  it('renders sale interface correctly', () => {
    renderWithProviders(<Sale />);

    expect(screen.getByText('Interface de Vente')).toBeInTheDocument();
    expect(screen.getByText('Mode de saisie')).toBeInTheDocument();
    expect(screen.getByText('Catégorie')).toBeInTheDocument();
    expect(screen.getByText('Quantité')).toBeInTheDocument();
    expect(screen.getByText('Prix')).toBeInTheDocument();
  });

  it('shows category selector when in category mode', () => {
    renderWithProviders(<Sale />);

    expect(screen.getByText('Sélectionner la catégorie EEE')).toBeInTheDocument();
    expect(screen.getByText('EEE-1')).toBeInTheDocument();
    expect(screen.getByText('EEE-8')).toBeInTheDocument();
  });

  it('transitions to quantity mode when category is selected', () => {
    renderWithProviders(<Sale />);

    const eee1Button = screen.getByText('EEE-1').closest('button');
    fireEvent.click(eee1Button!);

    expect(screen.getByText('Quantité')).toBeInTheDocument();
    expect(screen.getByText('Valider')).toBeInTheDocument();
  });

  it('transitions to price mode when quantity is confirmed', () => {
    renderWithProviders(<Sale />);

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
    renderWithProviders(<Sale />);

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

    renderWithProviders(<Sale />);

    expect(screen.getByText('Résumé de la vente')).toBeInTheDocument();
    expect(screen.getByText('2 articles')).toBeInTheDocument();
    expect(screen.getByText('20,00 €')).toBeInTheDocument();
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

    mockUseCashSessionStore.mockReturnValue({
      ...mockStore,
      currentSaleItems: mockItems,
      submitSale: jest.fn().mockResolvedValue(true)
    });

    renderWithProviders(<Sale />);

    const finalizeButton = screen.getByText('Finaliser la vente');
    fireEvent.click(finalizeButton);

    await waitFor(() => {
      expect(mockStore.submitSale).toHaveBeenCalledWith(mockItems);
    });
  });

  it('redirects to cash register when no session is active', () => {
    mockUseCashSessionStore.mockReturnValue({
      ...mockStore,
      currentSession: null
    });

    // Mock navigate
    const mockNavigate = jest.fn();
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));

    renderWithProviders(<Sale />);

    expect(mockNavigate).toHaveBeenCalledWith('/cash-register');
  });
});
