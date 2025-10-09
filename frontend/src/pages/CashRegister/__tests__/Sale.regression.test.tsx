import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@test/test-utils';
import { useCashSessionStore } from '../../../stores/cashSessionStore';
import { useAuthStore } from '../../../stores/authStore';
import { useCategoryStore } from '../../../stores/categoryStore';
import Sale from '../Sale';

// Mock the stores
vi.mock('../../../stores/cashSessionStore');
vi.mock('../../../stores/authStore');
vi.mock('../../../stores/categoryStore');
const mockUseCashSessionStore = useCashSessionStore as any;
const mockUseAuthStore = useAuthStore as any;
const mockUseCategoryStore = useCategoryStore as any;

describe('Sale Page - Tests de Non-Régression', () => {
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
        price: '5.00',
        max_price: '50.00',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'EEE-2',
        name: 'Petit électroménager',
        is_active: true,
        price: '2.00',
        max_price: '20.00',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
      {
        id: 'EEE-3',
        name: 'Informatique et télécommunications',
        is_active: true,
        price: '10.00',
        max_price: '100.00',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      },
    ],
    categories: [],
    loading: false,
    error: null,
    lastFetchTime: Date.now(),
    fetchCategories: vi.fn(),
    getActiveCategories: vi.fn(),
    getCategoryById: vi.fn((id: string) => {
      const categories = [
        {
          id: 'EEE-1',
          name: 'Gros électroménager',
          price: '5.00',
          max_price: '50.00',
        },
        {
          id: 'EEE-2',
          name: 'Petit électroménager',
          price: '2.00',
          max_price: '20.00',
        },
        {
          id: 'EEE-3',
          name: 'Informatique et télécommunications',
          price: '10.00',
          max_price: '100.00',
        },
      ];
      return categories.find(cat => cat.id === id);
    }),
    clearError: vi.fn(),
  };

  const mockAuthStore = {
    currentUser: {
      id: 'user-1',
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      role: 'user' as const,
      status: 'approved' as const,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    isAuthenticated: true,
    loading: false,
    error: null
  };

  beforeEach(() => {
    mockUseCashSessionStore.mockReturnValue(mockStore);
    mockUseAuthStore.mockReturnValue(mockAuthStore);
    mockUseCategoryStore.mockReturnValue(mockCategoryStore);
    vi.clearAllMocks();
    global.alert = vi.fn();
  });

  describe('Workflow Complet de Vente', () => {
    it('devrait exécuter un parcours complet de vente (Catégorie -> Poids -> Quantité -> Prix)', async () => {
      const addSaleItemMock = vi.fn();
      mockUseCashSessionStore.mockReturnValue({
        ...mockStore,
        addSaleItem: addSaleItemMock
      });

      render(<Sale />);

      // Étape 1: Sélection de catégorie
      await waitFor(() => {
        expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
      });

      const eee1Button = screen.getByTestId('category-EEE-1');
      fireEvent.click(eee1Button);

      // Étape 2: Saisie du poids
      expect(screen.getByText('Saisir le poids (kg)')).toBeInTheDocument();
      
      // Saisir poids: 2.5 kg
      const button2 = screen.getByText('2').closest('button');
      fireEvent.click(button2!);
      const buttonDot = screen.getByText('.').closest('button');
      fireEvent.click(buttonDot!);
      const button5 = screen.getByText('5').closest('button');
      fireEvent.click(button5!);

      // Valider le poids
      const confirmWeightButton = screen.getByTestId('confirm-weight-button');
      fireEvent.click(confirmWeightButton);

      // Étape 3: Saisie de la quantité
      expect(screen.getByText('Quantité')).toBeInTheDocument();
      
      // Saisir quantité: 3
      const qtyBtn3 = screen.getAllByRole('button', { name: '3' })[0];
      fireEvent.click(qtyBtn3);

      // Valider la quantité
      const validateQtyButton = screen.getByTestId('validate-quantity-button');
      fireEvent.click(validateQtyButton);

      // Étape 4: Saisie du prix
      expect(screen.getByText(/Prix unitaire/)).toBeInTheDocument();
      
      // Saisir prix: 15.50€
      const priceBtn1 = screen.getAllByRole('button', { name: '1' })[0];
      fireEvent.click(priceBtn1);
      const priceBtn5 = screen.getAllByRole('button', { name: '5' })[0];
      fireEvent.click(priceBtn5);
      const priceDot = screen.getByText('.').closest('button');
      fireEvent.click(priceDot!);
      const priceBtn5_2 = screen.getAllByRole('button', { name: '5' })[0];
      fireEvent.click(priceBtn5_2);
      const priceBtn0 = screen.getAllByRole('button', { name: '0' })[0];
      fireEvent.click(priceBtn0);

      // Valider le prix
      const validatePriceButton = screen.getByTestId('add-item-button');
      fireEvent.click(validatePriceButton);

      // Vérifier que l'article a été ajouté
      await waitFor(() => {
        expect(addSaleItemMock).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'EEE-1',
            quantity: 3,
            weight: 2.5,
            price: 15.50,
            total: 46.50 // 3 * 15.50
          })
        );
      });
    });

    it('devrait gérer le workflow avec sous-catégorie', async () => {
      // Mock categories with subcategories
      const mockCategoryStoreWithSubs = {
        ...mockCategoryStore,
        activeCategories: [
          ...mockCategoryStore.activeCategories,
          {
            id: 'EEE-1-1',
            name: 'Réfrigérateurs',
            parent_id: 'EEE-1',
            is_active: true,
            price: '8.00',
            max_price: '80.00',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          }
        ],
        getCategoryById: vi.fn((id: string) => {
          const categories = [
            {
              id: 'EEE-1',
              name: 'Gros électroménager',
              price: '5.00',
              max_price: '50.00',
            },
            {
              id: 'EEE-1-1',
              name: 'Réfrigérateurs',
              parent_id: 'EEE-1',
              price: '8.00',
              max_price: '80.00',
            },
          ];
          return categories.find(cat => cat.id === id);
        })
      };

      mockUseCategoryStore.mockReturnValue(mockCategoryStoreWithSubs);

      render(<Sale />);

      // Sélectionner catégorie parent
      await waitFor(() => {
        expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
      });

      const eee1Button = screen.getByTestId('category-EEE-1');
      fireEvent.click(eee1Button);

      // Vérifier que la sous-catégorie apparaît
      await waitFor(() => {
        expect(screen.getByText('Sélectionner la sous-catégorie')).toBeInTheDocument();
        expect(screen.getByText('Réfrigérateurs')).toBeInTheDocument();
      });

      // Sélectionner sous-catégorie
      const subcatButton = screen.getByTestId('subcategory-EEE-1-1');
      fireEvent.click(subcatButton);

      // Continuer avec le workflow normal
      expect(screen.getByText('Saisir le poids (kg)')).toBeInTheDocument();
    });
  });

  describe('Tests de Saisie du Poids', () => {
    it('devrait gérer la saisie simple du poids', async () => {
      render(<Sale />);

      // Sélectionner catégorie
      await waitFor(() => {
        expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
      });

      const eee1Button = screen.getByTestId('category-EEE-1');
      fireEvent.click(eee1Button);

      // Saisir poids simple: 1.5 kg
      const button1 = screen.getByText('1').closest('button');
      fireEvent.click(button1!);
      const buttonDot = screen.getByText('.').closest('button');
      fireEvent.click(buttonDot!);
      const button5 = screen.getByText('5').closest('button');
      fireEvent.click(button5!);

      // Vérifier l'affichage
      expect(screen.getByText('1.5')).toBeInTheDocument();

      // Valider
      const confirmWeightButton = screen.getByTestId('confirm-weight-button');
      fireEvent.click(confirmWeightButton);

      expect(screen.getByText('Quantité')).toBeInTheDocument();
    });

    it('devrait gérer la saisie multiple du poids avec le bouton +', async () => {
      render(<Sale />);

      // Sélectionner catégorie
      await waitFor(() => {
        expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
      });

      const eee1Button = screen.getByTestId('category-EEE-1');
      fireEvent.click(eee1Button);

      // Première pesée: 2.0 kg
      const button2 = screen.getByText('2').closest('button');
      fireEvent.click(button2!);
      const buttonDot = screen.getByText('.').closest('button');
      fireEvent.click(buttonDot!);
      const button0 = screen.getByText('0').closest('button');
      fireEvent.click(button0!);

      // Ajouter une pesée avec le bouton +
      const addWeightButton = screen.getByText('+ Ajouter une pesée');
      fireEvent.click(addWeightButton);

      // Deuxième pesée: 1.5 kg
      const button1 = screen.getByText('1').closest('button');
      fireEvent.click(button1!);
      const buttonDot2 = screen.getByText('.').closest('button');
      fireEvent.click(buttonDot2!);
      const button5 = screen.getByText('5').closest('button');
      fireEvent.click(button5!);

      // Valider le poids total (3.5 kg)
      const validateTotalButton = screen.getByTestId('validate-total-button');
      fireEvent.click(validateTotalButton);

      expect(screen.getByText('Quantité')).toBeInTheDocument();
    });

    it('devrait gérer l\'édition du poids', async () => {
      render(<Sale />);

      // Sélectionner catégorie
      await waitFor(() => {
        expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
      });

      const eee1Button = screen.getByTestId('category-EEE-1');
      fireEvent.click(eee1Button);

      // Saisir poids initial: 2.0 kg
      const button2 = screen.getByText('2').closest('button');
      fireEvent.click(button2!);
      const buttonDot = screen.getByText('.').closest('button');
      fireEvent.click(buttonDot!);
      const button0 = screen.getByText('0').closest('button');
      fireEvent.click(button0!);

      // Utiliser backspace pour corriger
      const backspaceButton = screen.getByText('⌫').closest('button');
      fireEvent.click(backspaceButton!);
      fireEvent.click(backspaceButton!);

      // Saisir nouveau poids: 2.5 kg
      const button2_2 = screen.getByText('2').closest('button');
      fireEvent.click(button2_2!);
      const buttonDot2 = screen.getByText('.').closest('button');
      fireEvent.click(buttonDot2!);
      const button5 = screen.getByText('5').closest('button');
      fireEvent.click(button5!);

      // Vérifier l'affichage final
      expect(screen.getByText('2.5')).toBeInTheDocument();
    });
  });

  describe('Tests des Raccourcis Clavier', () => {
    it('devrait gérer la touche Entrée pour valider la quantité', async () => {
      render(<Sale />);

      // Sélectionner catégorie
      await waitFor(() => {
        expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
      });

      const eee1Button = screen.getByTestId('category-EEE-1');
      fireEvent.click(eee1Button);

      // Passer à l'étape poids
      const button2 = screen.getByText('2').closest('button');
      fireEvent.click(button2!);
      const confirmWeightButton = screen.getByTestId('confirm-weight-button');
      fireEvent.click(confirmWeightButton);

      // Saisir quantité
      const qtyBtn3 = screen.getAllByRole('button', { name: '3' })[0];
      fireEvent.click(qtyBtn3);

      // Utiliser Entrée pour valider
      fireEvent.keyDown(document, { key: 'Enter' });

      // Vérifier que l'étape prix s'affiche
      expect(screen.getByText(/Prix unitaire/)).toBeInTheDocument();
    });

    it('devrait gérer la touche Entrée pour valider le prix', async () => {
      render(<Sale />);

      // Sélectionner catégorie
      await waitFor(() => {
        expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
      });

      const eee1Button = screen.getByTestId('category-EEE-1');
      fireEvent.click(eee1Button);

      // Passer aux étapes poids et quantité
      const button2 = screen.getByText('2').closest('button');
      fireEvent.click(button2!);
      const confirmWeightButton = screen.getByTestId('confirm-weight-button');
      fireEvent.click(confirmWeightButton);

      const qtyBtn3 = screen.getAllByRole('button', { name: '3' })[0];
      fireEvent.click(qtyBtn3);
      const validateQtyButton = screen.getByTestId('validate-quantity-button');
      fireEvent.click(validateQtyButton);

      // Saisir prix
      const priceBtn1 = screen.getAllByRole('button', { name: '1' })[0];
      fireEvent.click(priceBtn1);
      const priceBtn0 = screen.getAllByRole('button', { name: '0' })[0];
      fireEvent.click(priceBtn0);

      // Utiliser Entrée pour valider
      fireEvent.keyDown(document, { key: 'Enter' });

      // Vérifier que l'article a été ajouté
      await waitFor(() => {
        expect(mockStore.addSaleItem).toHaveBeenCalled();
      });
    });

    it('devrait gérer la touche + pour ajouter une pesée', async () => {
      render(<Sale />);

      // Sélectionner catégorie
      await waitFor(() => {
        expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
      });

      const eee1Button = screen.getByTestId('category-EEE-1');
      fireEvent.click(eee1Button);

      // Saisir première pesée
      const button2 = screen.getByText('2').closest('button');
      fireEvent.click(button2!);

      // Utiliser la touche + pour ajouter une pesée
      fireEvent.keyDown(document, { key: '+' });

      // Vérifier que le bouton d'ajout de pesée est présent
      expect(screen.getByText('+ Ajouter une pesée')).toBeInTheDocument();
    });
  });

  describe('Tests de Calculs', () => {
    it('devrait calculer correctement le prix total', async () => {
      const addSaleItemMock = vi.fn();
      mockUseCashSessionStore.mockReturnValue({
        ...mockStore,
        addSaleItem: addSaleItemMock
      });

      render(<Sale />);

      // Workflow complet
      await waitFor(() => {
        expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
      });

      const eee1Button = screen.getByTestId('category-EEE-1');
      fireEvent.click(eee1Button);

      // Poids: 2.5 kg
      const button2 = screen.getByText('2').closest('button');
      fireEvent.click(button2!);
      const buttonDot = screen.getByText('.').closest('button');
      fireEvent.click(buttonDot!);
      const button5 = screen.getByText('5').closest('button');
      fireEvent.click(button5!);
      const confirmWeightButton = screen.getByTestId('confirm-weight-button');
      fireEvent.click(confirmWeightButton);

      // Quantité: 4
      const qtyBtn4 = screen.getAllByRole('button', { name: '4' })[0];
      fireEvent.click(qtyBtn4);
      const validateQtyButton = screen.getByTestId('validate-quantity-button');
      fireEvent.click(validateQtyButton);

      // Prix: 12.50€
      const priceBtn1 = screen.getAllByRole('button', { name: '1' })[0];
      fireEvent.click(priceBtn1);
      const priceBtn2 = screen.getAllByRole('button', { name: '2' })[0];
      fireEvent.click(priceBtn2);
      const priceDot = screen.getByText('.').closest('button');
      fireEvent.click(priceDot!);
      const priceBtn5 = screen.getAllByRole('button', { name: '5' })[0];
      fireEvent.click(priceBtn5);
      const priceBtn0 = screen.getAllByRole('button', { name: '0' })[0];
      fireEvent.click(priceBtn0);

      const validatePriceButton = screen.getByTestId('add-item-button');
      fireEvent.click(validatePriceButton);

      // Vérifier le calcul: 4 * 12.50 = 50.00€
      await waitFor(() => {
        expect(addSaleItemMock).toHaveBeenCalledWith(
          expect.objectContaining({
            quantity: 4,
            weight: 2.5,
            price: 12.50,
            total: 50.00
          })
        );
      });
    });

    it('devrait afficher le calcul en temps réel pour la quantité', async () => {
      render(<Sale />);

      // Sélectionner catégorie
      await waitFor(() => {
        expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
      });

      const eee1Button = screen.getByTestId('category-EEE-1');
      fireEvent.click(eee1Button);

      // Passer à l'étape poids
      const button2 = screen.getByText('2').closest('button');
      fireEvent.click(button2!);
      const confirmWeightButton = screen.getByTestId('confirm-weight-button');
      fireEvent.click(confirmWeightButton);

      // Saisir quantité: 3
      const qtyBtn3 = screen.getAllByRole('button', { name: '3' })[0];
      fireEvent.click(qtyBtn3);

      // Vérifier l'affichage du calcul en temps réel
      expect(screen.getByText('5.00 × 3 = 15.00')).toBeInTheDocument();
    });
  });

  describe('Tests de Responsive Layout', () => {
    it('devrait s\'adapter correctement sur mobile (max-width: 768px)', () => {
      // Mock window.innerWidth pour simuler mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<Sale />);

      // Vérifier que le layout mobile est appliqué
      const mainLayout = document.querySelector('[style*="flex-direction: column"]');
      expect(mainLayout).toBeInTheDocument();
    });

    it('devrait maintenir le layout desktop sur grand écran', () => {
      // Mock window.innerWidth pour simuler desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<Sale />);

      // Vérifier que le layout desktop est maintenu
      const leftColumn = document.querySelector('[style*="flex: 1"]');
      const rightColumn = document.querySelector('[style*="flex: 2"]');
      expect(leftColumn).toBeInTheDocument();
      expect(rightColumn).toBeInTheDocument();
    });

    it('devrait masquer les informations de session sur mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<Sale />);

      // Vérifier que les informations de session sont masquées sur mobile
      const sessionInfo = screen.queryByText(/Session #/);
      expect(sessionInfo).not.toBeInTheDocument();
    });
  });

  describe('Tests de Validation et Gestion d\'Erreurs', () => {
    it('devrait valider les limites de poids', async () => {
      render(<Sale />);

      // Sélectionner catégorie
      await waitFor(() => {
        expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
      });

      const eee1Button = screen.getByTestId('category-EEE-1');
      fireEvent.click(eee1Button);

      // Saisir poids invalide: 10000 kg (dépasse la limite)
      const button1 = screen.getByText('1').closest('button');
      fireEvent.click(button1!);
      const button0 = screen.getByText('0').closest('button');
      fireEvent.click(button0!);
      fireEvent.click(button0!);
      fireEvent.click(button0!);
      fireEvent.click(button0!);

      // Vérifier que le bouton de validation est désactivé
      const confirmWeightButton = screen.getByTestId('confirm-weight-button');
      expect(confirmWeightButton).toBeDisabled();
    });

    it('devrait valider les limites de prix', async () => {
      render(<Sale />);

      // Sélectionner catégorie
      await waitFor(() => {
        expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
      });

      const eee1Button = screen.getByTestId('category-EEE-1');
      fireEvent.click(eee1Button);

      // Passer aux étapes poids et quantité
      const button2 = screen.getByText('2').closest('button');
      fireEvent.click(button2!);
      const confirmWeightButton = screen.getByTestId('confirm-weight-button');
      fireEvent.click(confirmWeightButton);

      const qtyBtn3 = screen.getAllByRole('button', { name: '3' })[0];
      fireEvent.click(qtyBtn3);
      const validateQtyButton = screen.getByTestId('validate-quantity-button');
      fireEvent.click(validateQtyButton);

      // Saisir prix invalide: 10000€ (dépasse la limite)
      const priceBtn1 = screen.getAllByRole('button', { name: '1' })[0];
      fireEvent.click(priceBtn1!);
      const priceBtn0 = screen.getAllByRole('button', { name: '0' })[0];
      fireEvent.click(priceBtn0!);
      fireEvent.click(priceBtn0!);
      fireEvent.click(priceBtn0!);
      fireEvent.click(priceBtn0!);

      // Vérifier que le bouton de validation est désactivé
      const validatePriceButton = screen.getByTestId('add-item-button');
      expect(validatePriceButton).toBeDisabled();
    });

    it('devrait gérer les erreurs de soumission de vente', async () => {
      const mockSubmitSale = vi.fn().mockResolvedValue(false);
      const mockGetState = vi.fn().mockReturnValue({
        error: 'Erreur de connexion'
      });

      mockUseCashSessionStore.mockReturnValue({
        ...mockStore,
        currentSaleItems: [
          {
            id: 'item-1',
            category: 'EEE-1',
            quantity: 1,
            weight: 2,
            price: 10,
            total: 10
          }
        ],
        submitSale: mockSubmitSale,
        error: 'Erreur de connexion'
      });

      (mockUseCashSessionStore as any).getState = mockGetState;

      render(<Sale />);

      // Finaliser la vente
      fireEvent.click(screen.getByRole('button', { name: 'Finaliser la vente' }));
      const confirmButton = screen.queryByTestId('confirm-finalization');
      if (confirmButton && !(confirmButton as HTMLButtonElement).disabled) {
        fireEvent.click(confirmButton);
      }

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('❌ Erreur lors de l\'enregistrement de la vente: Erreur de connexion');
      });
    });
  });

  describe('Tests de Performance et Fluidité', () => {
    it('devrait maintenir la fluidité lors de la saisie rapide', async () => {
      render(<Sale />);

      // Sélectionner catégorie
      await waitFor(() => {
        expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
      });

      const eee1Button = screen.getByTestId('category-EEE-1');
      fireEvent.click(eee1Button);

      // Saisie rapide du poids
      const button2 = screen.getByText('2').closest('button');
      fireEvent.click(button2!);
      const buttonDot = screen.getByText('.').closest('button');
      fireEvent.click(buttonDot!);
      const button5 = screen.getByText('5').closest('button');
      fireEvent.click(button5!);

      // Vérifier que l'affichage est immédiat
      expect(screen.getByText('2.5')).toBeInTheDocument();

      // Valider rapidement
      const confirmWeightButton = screen.getByTestId('confirm-weight-button');
      fireEvent.click(confirmWeightButton);

      // Vérifier la transition fluide
      expect(screen.getByText('Quantité')).toBeInTheDocument();
    });

    it('devrait gérer les clics multiples sans problème', async () => {
      render(<Sale />);

      // Sélectionner catégorie
      await waitFor(() => {
        expect(screen.getByText('Gros électroménager')).toBeInTheDocument();
      });

      const eee1Button = screen.getByTestId('category-EEE-1');
      
      // Clics multiples sur le même bouton
      fireEvent.click(eee1Button);
      fireEvent.click(eee1Button);
      fireEvent.click(eee1Button);

      // Vérifier que l'état reste cohérent
      expect(screen.getByText('Saisir le poids (kg)')).toBeInTheDocument();
    });
  });
});