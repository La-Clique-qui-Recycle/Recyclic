import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@test/test-utils';
import { useCashSessionStore } from '../../../stores/cashSessionStore';
import { useCategoryStore } from '../../../stores/categoryStore';
import Sale from '../Sale';

// Mock the stores
vi.mock('../../../stores/cashSessionStore');
vi.mock('../../../stores/categoryStore');
const mockUseCashSessionStore = useCashSessionStore as any;
const mockUseCategoryStore = useCategoryStore as any;

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
    updateSaleItem: vi.fn(),
    clearCurrentSale: vi.fn(),
    submitSale: vi.fn(),
    clearError: vi.fn()
  };

  const mockCategoryStore = {
    activeCategories: [
      {
        id: 'EEE-1',
        name: 'Gros électroménager',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'EEE-2',
        name: 'Petit électroménager',
        is_active: true,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
      {
        id: 'EEE-3',
        name: 'Informatique et télécommunications',
        is_active: true,
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      },
      {
        id: 'EEE-4',
        name: 'Matériel grand public',
        is_active: true,
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z',
      },
      {
        id: 'EEE-5',
        name: 'Éclairage',
        is_active: true,
        created_at: '2024-01-05T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z',
      },
      {
        id: 'EEE-6',
        name: 'Outils électriques et électroniques',
        is_active: true,
        created_at: '2024-01-06T00:00:00Z',
        updated_at: '2024-01-06T00:00:00Z',
      },
      {
        id: 'EEE-7',
        name: 'Jouets, loisirs et sports',
        is_active: true,
        created_at: '2024-01-07T00:00:00Z',
        updated_at: '2024-01-07T00:00:00Z',
      },
      {
        id: 'EEE-8',
        name: 'Dispositifs médicaux',
        is_active: true,
        created_at: '2024-01-08T00:00:00Z',
        updated_at: '2024-01-08T00:00:00Z',
      },
    ],
    categories: [],
    loading: false,
    error: null,
    lastFetchTime: Date.now(),
    fetchCategories: vi.fn(),
    getActiveCategories: vi.fn(),
    getCategoryById: vi.fn(),
    clearError: vi.fn(),
  };

  beforeEach(() => {
    mockUseCashSessionStore.mockReturnValue(mockStore);
    mockUseCategoryStore.mockReturnValue(mockCategoryStore);
    vi.clearAllMocks();
  });

  it('renders sale interface correctly', () => {
    render(<Sale />);

    expect(screen.getByText('Mode de saisie')).toBeInTheDocument();
    // Target the mode button specifically to avoid confusion with form label
    expect(screen.getByRole('button', { name: /catégorie/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /poids/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /prix/i })).toBeInTheDocument();
  });

  it('shows category selector when in category mode', async () => {
    render(<Sale />);

    expect(screen.getByText('Sélectionner la catégorie EEE')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
      expect(screen.getByText('Dispositifs médicaux')).toBeInTheDocument();
    });
  });

  it('transitions to weight mode when category is selected', async () => {
    render(<Sale />);

    await waitFor(() => {
      expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
    });

    const eee1Button = screen.getByTestId('category-EEE-1');
    fireEvent.click(eee1Button);

    expect(screen.getByRole('heading', { name: 'Poids (kg)' })).toBeInTheDocument();
    // Use more specific selector for the calculator confirm button
    const calculatorButton = document.querySelector('button[data-isvalid="false"]');
    expect(calculatorButton).toBeInTheDocument();
  });

  it('transitions to price mode when weight is confirmed', async () => {
    render(<Sale />);

    // Select category first
    await waitFor(() => {
      expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
    });

    const eee1Button = screen.getByTestId('category-EEE-1');
    fireEvent.click(eee1Button);

    // Enter weight
    const button5 = screen.getByText('5').closest('button');
    fireEvent.click(button5!);

    // Confirm weight - target the calculator confirm button specifically
    const calculatorButton = document.querySelector('button[data-isvalid="true"]');
    expect(calculatorButton).toBeInTheDocument();
    fireEvent.click(calculatorButton!);

    expect(screen.getByText('Prix unitaire (€)')).toBeInTheDocument();
  });

  it('adds item to sale when price is confirmed', async () => {
    render(<Sale />);

    // Complete the flow: category -> weight -> price
    await waitFor(() => {
      expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
    });

    const eee1Button = screen.getByTestId('category-EEE-1');
    fireEvent.click(eee1Button);

    const button5 = screen.getByText('5').closest('button');
    fireEvent.click(button5!);

    // Confirm weight - target calculator button
    const calculatorWeightButton = document.querySelector('button[data-isvalid="true"]');
    expect(calculatorWeightButton).toBeInTheDocument();
    fireEvent.click(calculatorWeightButton!);

    const button10 = screen.getByText('1').closest('button');
    fireEvent.click(button10!);
    fireEvent.click(screen.getByText('0').closest('button')!);

    // Confirm price - target calculator button (now in price mode)
    const calculatorPriceButton = document.querySelector('button[data-isvalid="true"]');
    expect(calculatorPriceButton).toBeInTheDocument();
    fireEvent.click(calculatorPriceButton!);

    await waitFor(() => {
      expect(mockStore.addSaleItem).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'EEE-1',
          quantity: 1,  // Valeur par défaut pour compatibilité
          weight: 5,
          price: 10,
          total: 10  // total_price = unit_price (pas de multiplication avec le poids)
        })
      );
    });
  });

  it('shows sale summary when items are added', () => {
    const mockItems = [
      {
        id: 'item-1',
        category: 'EEE-1',
        quantity: 1,
        weight: 2,
        price: 10,
        total: 10
      }
    ];

    mockUseCashSessionStore.mockReturnValue({
      ...mockStore,
      currentSaleItems: mockItems
    });

    render(<Sale />);

    expect(screen.getByText('Ticket de Caisse')).toBeInTheDocument();
    expect(screen.getByText('1 articles')).toBeInTheDocument();
    expect(screen.getAllByText(/10\.00 €/)).toHaveLength(2); // Item price + total
  });

  it('calls submitSale when finalizing sale', async () => {
    const mockItems = [
      {
        id: 'item-1',
        category: 'EEE-1',
        quantity: 1,
        weight: 2,
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
    expect(screen.queryByText('Mode de saisie')).not.toBeInTheDocument();
  });

  it('shows success feedback when sale submission succeeds', async () => {
    const mockItems = [
      {
        id: 'item-1',
        category: 'EEE-1',
        quantity: 1,
        weight: 2,
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

    fireEvent.click(screen.getByText('Finaliser la vente'));

    await waitFor(() => {
      expect(mockSubmitSale).toHaveBeenCalledWith(mockItems);
    });

    // Message de succès ajouté dans Sale.tsx
    await waitFor(() => {
      expect(screen.getByText('✅ Vente enregistrée avec succès !')).toBeInTheDocument();
    });
  });

  it('shows error feedback when sale submission fails', async () => {
    const mockItems = [
      {
        id: 'item-1',
        category: 'EEE-1',
        quantity: 1,
        weight: 2,
        price: 10,
        total: 10
      }
    ];

    const error = new Error('Erreur lors de l\'enregistrement');
    const mockSubmitSale = vi.fn().mockRejectedValue(error);

    mockUseCashSessionStore.mockReturnValue({
      ...mockStore,
      currentSaleItems: mockItems,
      submitSale: mockSubmitSale
    });

    render(<Sale />);

    fireEvent.click(screen.getByText('Finaliser la vente'));

    await waitFor(() => {
      expect(mockSubmitSale).toHaveBeenCalledWith(mockItems);
    });

    // Message d'erreur affiché par la page
    await waitFor(() => {
      expect(
        screen.getByText(/Erreur lors de l'enregistrement/i)
      ).toBeInTheDocument();
    });
  });
});
