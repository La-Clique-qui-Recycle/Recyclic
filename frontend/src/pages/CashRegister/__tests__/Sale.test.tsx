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
    // Mock window.alert
    global.alert = vi.fn();
  });

  it('renders sale interface correctly', () => {
    render(<Sale />);

    expect(screen.getByText('Mode de saisie')).toBeInTheDocument();
    // Check for mode buttons using data-active attribute
    const buttons = screen.getAllByRole('button');
    const categoryButton = buttons.find(b => b.textContent === 'Catégorie' && b.hasAttribute('data-active'));
    const weightButton = buttons.find(b => b.textContent === 'Poids');
    const priceButton = buttons.find(b => b.textContent === 'Prix');

    expect(categoryButton).toBeInTheDocument();
    expect(weightButton).toBeInTheDocument();
    expect(priceButton).toBeInTheDocument();
  });

  it('renders two-panel layout with wizard on left and ticket on right', () => {
    render(<Sale />);

    // Verify SaleWizard is present (left panel)
    expect(screen.getByText('Mode de saisie')).toBeInTheDocument();
    expect(screen.getByText('Sélectionner la catégorie EEE')).toBeInTheDocument();

    // Verify Ticket is present (right panel)
    expect(screen.getByText('Ticket de Caisse')).toBeInTheDocument();
    expect(screen.getByText('Aucun article ajouté')).toBeInTheDocument();

    // Verify Close Session button is present
    expect(screen.getByText('Fermer la Session')).toBeInTheDocument();
  });

  it('updates ticket when item is added via wizard', async () => {
    const addSaleItemMock = vi.fn();

    mockUseCashSessionStore.mockReturnValue({
      ...mockStore,
      addSaleItem: addSaleItemMock
    });

    render(<Sale />);

    // Complete flow: category -> weight -> price
    await waitFor(() => {
      expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
    });

    const eee1Button = screen.getByTestId('category-EEE-1');
    fireEvent.click(eee1Button);

    const button5 = screen.getByText('5').closest('button');
    fireEvent.click(button5!);

    const calculatorWeightButton = document.querySelector('button[data-isvalid="true"]');
    fireEvent.click(calculatorWeightButton!);

    const button1 = screen.getAllByRole('button').find(b => b.textContent?.trim() === '1');
    fireEvent.click(button1!);
    const button0 = screen.getAllByRole('button').find(b => b.textContent?.trim() === '0');
    fireEvent.click(button0!);

    const calculatorPriceButton = document.querySelector('button[data-isvalid="true"]');
    fireEvent.click(calculatorPriceButton!);

    // Verify that addSaleItem was called with correct data
    await waitFor(() => {
      expect(addSaleItemMock).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'EEE-1',
          weight: 5,
          price: 10,
          total: 10
        })
      );
    });
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

    // Saisir quantité puis valider
    const qtyBtn1 = screen.getAllByRole('button', { name: '1' })[0];
    fireEvent.click(qtyBtn1);
    const qtyBtn0 = screen.getAllByRole('button', { name: '0' })[0];
    fireEvent.click(qtyBtn0);
    const qtyValidate = screen.getByTestId('validate-quantity-button');
    fireEvent.click(qtyValidate);

    // Confirm weight - target the calculator confirm button specifically
    const calculatorButton = document.querySelector('button[data-isvalid="true"]');
    expect(calculatorButton).toBeInTheDocument();
    fireEvent.click(calculatorButton!);

    // Puis saisir prix
    const priceBtn1 = screen.getAllByRole('button', { name: '1' })[0];
    fireEvent.click(priceBtn1);
    const priceBtn0 = screen.getAllByRole('button', { name: '0' })[0];
    fireEvent.click(priceBtn0);

    expect(screen.getByText(/Prix unitaire/)).toBeInTheDocument();
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

    // Puis saisir prix
    const priceBtn1 = screen.getAllByRole('button', { name: '1' })[0];
    fireEvent.click(priceBtn1);
    const priceBtn0 = screen.getAllByRole('button', { name: '0' })[0];
    fireEvent.click(priceBtn0);

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
    expect(screen.getAllByText(/10\.00 \€/).length).toBeGreaterThanOrEqual(2);
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

    fireEvent.click(screen.getAllByRole('button', { name: 'Finaliser la vente' })[0]);
    // confirmer la finalisation via le bouton du formulaire si présent
    const confirm = screen.queryByTestId('confirm-finalization');
    if (confirm && !(confirm as HTMLButtonElement).disabled) {
      fireEvent.click(confirm);
    }

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

    fireEvent.click(screen.getAllByRole('button', { name: 'Finaliser la vente' })[0]);
    const confirm2 = screen.queryByTestId('confirm-finalization');
    if (confirm2 && !(confirm2 as HTMLButtonElement).disabled) {
      fireEvent.click(confirm2);
    }

    await waitFor(() => {
      expect(mockSubmitSale).toHaveBeenCalledWith(mockItems);
    });

    // Check that alert was called with success message
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('✅ Vente enregistrée avec succès !');
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

    const mockSubmitSale = vi.fn().mockResolvedValue(false);
    const mockGetState = vi.fn().mockReturnValue({
      error: 'Erreur lors de l\'enregistrement'
    });

    mockUseCashSessionStore.mockReturnValue({
      ...mockStore,
      currentSaleItems: mockItems,
      submitSale: mockSubmitSale,
      error: 'Erreur lors de l\'enregistrement'
    });

    // Mock the getState function
    (mockUseCashSessionStore as any).getState = mockGetState;

    render(<Sale />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Finaliser la vente' })[0]);
    const confirm2 = screen.queryByTestId('confirm-finalization');
    if (confirm2 && !(confirm2 as HTMLButtonElement).disabled) {
      fireEvent.click(confirm2);
    }

    await waitFor(() => {
      expect(mockSubmitSale).toHaveBeenCalledWith(mockItems);
    });

    // Check that alert was called with error message
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('❌ Erreur lors de l\'enregistrement de la vente: Erreur lors de l\'enregistrement');
    });
  });
});
