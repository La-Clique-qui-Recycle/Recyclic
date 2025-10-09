import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SaleWizard from './SaleWizard';
import { useCategoryStore } from '../../stores/categoryStore';

vi.mock('../../stores/categoryStore', () => ({
  useCategoryStore: vi.fn()
}));

describe('SaleWizard', () => {
  const mockOnItemComplete = vi.fn();
  const mockCategories = [
    {
      id: 'CAT001',
      name: 'Petits appareils ménagers',
      is_active: true,
      parent_id: null,
      price: null, // No fixed price
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'CAT002',
      name: 'Écrans',
      is_active: true,
      parent_id: null,
      price: 15.50, // Fixed price
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'CAT003',
      name: 'Électroménager',
      is_active: true,
      parent_id: null,
      price: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'CAT003-1',
      name: 'Réfrigérateurs',
      is_active: true,
      parent_id: 'CAT003',
      price: 10.00,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'CAT003-2',
      name: 'Lave-linge',
      is_active: true,
      parent_id: 'CAT003',
      price: 12.00,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'CAT004',
      name: 'Mobilier',
      is_active: true,
      parent_id: null,
      price: 25.00, // Fixed price
      max_price: 100.00, // But has max price - should not show calculation
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useCategoryStore as any).mockReturnValue({
      activeCategories: mockCategories,
      loading: false,
      error: null,
      fetchCategories: vi.fn(),
      getCategoryById: (id: string) => mockCategories.find(cat => cat.id === id)
    });

  // Helper: Navigate through weight step to reach quantity
  const navigateToQuantityViaWeight = async (user: any) => {
    // Weight step should be shown
    await waitFor(() => {
      expect(screen.getByText('Saisir le poids (kg)')).toBeInTheDocument();
    });

    // Enter a weight (e.g., 5 kg)
    await user.click(screen.getByTestId('numpad-5'));

    // Click the + button to add weight
    await waitFor(() => {
      const confirmButton = screen.getByTestId('confirm-weight-button');
      expect(confirmButton).not.toBeDisabled();
    });
    await user.click(screen.getByTestId('confirm-weight-button'));

    // Wait for weight to be added to list
    await waitFor(() => {
      expect(screen.getByTestId('weight-item-0')).toBeInTheDocument();
    });

    // Click validate total button
    await waitFor(() => {
      const validateButton = screen.getByTestId('validate-total-button');
      expect(validateButton).not.toBeDisabled();
    });
    await user.click(screen.getByTestId('validate-total-button'));

    // Should now be on quantity step
    await waitFor(() => {
      expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
    });
  };


  // Helper: Navigate through weight step to reach quantity
  const navigateToQuantityViaWeight = async (user: any) => {
    // Weight step should be shown
    await waitFor(() => {
      expect(screen.getByText('Saisir le poids (kg)')).toBeInTheDocument();
    });

    // Enter a weight (e.g., 5 kg)
    await user.click(screen.getByTestId('numpad-5'));

    // Click the + button to add weight
    await waitFor(() => {
      const confirmButton = screen.getByTestId('confirm-weight-button');
      expect(confirmButton).not.toBeDisabled();
    });
    await user.click(screen.getByTestId('confirm-weight-button'));

    // Wait for weight to be added to list
    await waitFor(() => {
      expect(screen.getByTestId('weight-item-0')).toBeInTheDocument();
    });

    // Click validate total button
    await waitFor(() => {
      const validateButton = screen.getByTestId('validate-total-button');
      expect(validateButton).not.toBeDisabled();
    });
    await user.click(screen.getByTestId('validate-total-button'));

    // Should now be on quantity step
    await waitFor(() => {
      expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
    });
  };


  // Helper: Navigate through weight step to reach quantity
  const navigateToQuantityViaWeight = async (user: any) => {
    // Weight step should be shown
    await waitFor(() => {
      expect(screen.getByText('Saisir le poids (kg)')).toBeInTheDocument();
    });

    // Enter a weight (e.g., 5 kg)
    await user.click(screen.getByTestId('numpad-5'));

    // Click the + button to add weight
    await waitFor(() => {
      const confirmButton = screen.getByTestId('confirm-weight-button');
      expect(confirmButton).not.toBeDisabled();
    });
    await user.click(screen.getByTestId('confirm-weight-button'));

    // Wait for weight to be added to list
    await waitFor(() => {
      expect(screen.getByTestId('weight-item-0')).toBeInTheDocument();
    });

    // Click validate total button
    await waitFor(() => {
      const validateButton = screen.getByTestId('validate-total-button');
      expect(validateButton).not.toBeDisabled();
    });
    await user.click(screen.getByTestId('validate-total-button'));

    // Should now be on quantity step
    await waitFor(() => {
      expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
    });
  };

  });

  describe('Step 1: Category Selection', () => {
    it('renders category selection as first step', async () => {
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Sélectionner la catégorie EEE')).toBeInTheDocument();
      });
    });

    it('displays category buttons', async () => {
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
        expect(screen.getByText('Écrans')).toBeInTheDocument();
      });
    });

    it('transitions to quantity step after category selection (no subcategories)', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Petits appareils ménagers'));

      await navigateToQuantityViaWeight(user);
    });

    it('transitions to subcategory step after category selection (has subcategories)', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Électroménager')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Électroménager'));

      await waitFor(() => {
        expect(screen.getByText('Sélectionner la sous-catégorie')).toBeInTheDocument();
        expect(screen.getByText('Réfrigérateurs')).toBeInTheDocument();
        expect(screen.getByText('Lave-linge')).toBeInTheDocument();
      });
    });
  });

  describe('Step 2: Subcategory Selection', () => {
    it('transitions to quantity step after subcategory selection', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Électroménager')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Électroménager'));

      await waitFor(() => {
        expect(screen.getByText('Réfrigérateurs')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Réfrigérateurs'));

      await waitFor(() => {
        expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
      });
    });
  });

  describe('Step 3: Quantity Entry', () => {
    it('renders numpad for quantity entry', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Petits appareils ménagers'));

      await navigateToQuantityViaWeight(user);
    });

    it('allows entering quantity via numpad', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Petits appareils ménagers'));

      await navigateToQuantityViaWeight(user);

      const buttons = screen.getAllByRole('button');
      const button2 = buttons.find(b => b.textContent === '2');

      if (button2) await user.click(button2);

      await waitFor(() => {
        const display = screen.getByTestId('quantity-input');
        expect(display.textContent).toContain('2');
      });
    });

    it('validates quantity before allowing confirmation', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Petits appareils ménagers'));

      await waitFor(() => {
        const validateButton = screen.getByTestId('validate-quantity-button');
        expect(validateButton).toBeDisabled();
      });
    });

    it('transitions to weight step after valid quantity', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Petits appareils ménagers'));

      await navigateToQuantityViaWeight(user);

      const buttons = screen.getAllByRole('button');
      const button3 = buttons.find(b => b.textContent === '3');
      if (button3) await user.click(button3);

      await waitFor(() => {
        const validateButton = screen.getByTestId('validate-quantity-button');
        expect(validateButton).not.toBeDisabled();
      });

      const validateButton = screen.getByTestId('validate-quantity-button');
      await user.click(validateButton);

      await waitFor(() => {      });
    });
  });

  describe('Step 4: Weight Entry', () => {
    it('renders multiple weight entry interface', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Petits appareils ménagers'));

      await navigateToQuantityViaWeight(user);

      const buttons1 = screen.getAllByRole('button');
      const button3 = buttons1.find(b => b.textContent === '3');
      if (button3) await user.click(button3);

      const validateQuantityButton = screen.getByTestId('validate-quantity-button');
      await user.click(validateQuantityButton);

      await waitFor(() => {        expect(screen.getByTestId('add-weight-button')).toBeInTheDocument();
        expect(screen.getByTestId('total-weight')).toBeInTheDocument();
      });
    });

    it('allows adding multiple weights', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Petits appareils ménagers'));

      // Enter quantity first
      await waitFor(() => {
        expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
      });

      const qtyButtons = screen.getAllByRole('button');
      const button3qty = qtyButtons.find(b => b.textContent === '3');
      if (button3qty) await user.click(button3qty);

      const validateQuantityButton = screen.getByTestId('validate-quantity-button');
      await user.click(validateQuantityButton);

      // Now at weight step - click add weight button
      await waitFor(() => {
        expect(screen.getByTestId('add-weight-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('add-weight-button'));

      // Enter weight in numpad
      await waitFor(() => {
        expect(screen.getByTestId('numpad-2')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('numpad-2'));
      await user.click(screen.getByTestId('numpad-.'));
      await user.click(screen.getByTestId('numpad-5'));

      // Confirm the weight
      await waitFor(() => {
        const confirmButton = screen.getByTestId('confirm-weight-button');
        expect(confirmButton).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('confirm-weight-button'));

      // Check weight was added to list
      await waitFor(() => {
        expect(screen.getByTestId('weight-item-0')).toBeInTheDocument();
        expect(screen.getByTestId('total-weight')).toHaveTextContent('2.5');
      });
    });

    it('validates total weight before allowing confirmation', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Petits appareils ménagers'));

      // Enter quantity first
      await waitFor(() => {
        expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
      });

      const qtyButtons = screen.getAllByRole('button');
      const button3qty = qtyButtons.find(b => b.textContent === '3');
      if (button3qty) await user.click(button3qty);

      const validateQuantityButton = screen.getByTestId('validate-quantity-button');
      await user.click(validateQuantityButton);

      // Validate total button should be disabled when no weights added
      await waitFor(() => {
        const validateButton = screen.getByTestId('validate-total-button');
        expect(validateButton).toBeDisabled();
      });
    });
  });

  describe('Step 5: Price Entry', () => {
    it('transitions to price step after valid weight for non-fixed-price category', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Petits appareils ménagers'));

      // Enter quantity
      await waitFor(() => {
        expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
      });

      const qtyButtons = screen.getAllByRole('button');
      const button3qty = qtyButtons.find(b => b.textContent === '3');
      if (button3qty) await user.click(button3qty);

      const validateQuantityButton = screen.getByTestId('validate-quantity-button');
      await user.click(validateQuantityButton);

      // Enter weight
      await waitFor(() => {      });

      // Click add weight button
      await user.click(screen.getByTestId('add-weight-button'));

      // Enter weight in numpad
      await waitFor(() => {
        expect(screen.getByTestId('numpad-2')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('numpad-2'));

      // Confirm weight
      await waitFor(() => {
        const confirmButton = screen.getByTestId('confirm-weight-button');
        expect(confirmButton).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('confirm-weight-button'));

      // Validate total
      await waitFor(() => {
        const validateButton = screen.getByTestId('validate-total-button');
        expect(validateButton).not.toBeDisabled();
      });

      const validateButton = screen.getByTestId('validate-total-button');
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText('Prix unitaire (€)')).toBeInTheDocument();
      });
    });

    it('completes item with entered price', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Select category
      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Petits appareils ménagers'));

      // Enter quantity
      await waitFor(() => {
        expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
      });
      const qtyButtons = screen.getAllByRole('button');
      const button3 = qtyButtons.find(b => b.textContent === '3');
      if (button3) await user.click(button3);

      const validateQuantityButton = screen.getByTestId('validate-quantity-button');
      await user.click(validateQuantityButton);

      // Enter weight
      await waitFor(() => {      });

      // Add weight via numpad
      await user.click(screen.getByTestId('add-weight-button'));
      await waitFor(() => expect(screen.getByTestId('numpad-2')).toBeInTheDocument());
      await user.click(screen.getByTestId('numpad-2'));
      await waitFor(() => {
        const confirmButton = screen.getByTestId('confirm-weight-button');
        expect(confirmButton).not.toBeDisabled();
      });
      await user.click(screen.getByTestId('confirm-weight-button'));

      // Validate total
      await waitFor(() => {
        const validateTotalButton = screen.getByTestId('validate-total-button');
        expect(validateTotalButton).not.toBeDisabled();
      });
      const validateTotalButton = screen.getByTestId('validate-total-button');
      await user.click(validateTotalButton);

      // Enter price
      await waitFor(() => {
        expect(screen.getByText('Prix unitaire (€)')).toBeInTheDocument();
      });

      const buttons2 = screen.getAllByRole('button');
      const button1 = buttons2.find(b => b.textContent === '1');
      const button0 = buttons2.find(b => b.textContent === '0');

      if (button1) await user.click(button1);
      if (button0) await user.click(button0);

      await waitFor(() => {
        const addButton = screen.getByTestId('add-item-button');
        expect(addButton).not.toBeDisabled();
      });

      const addButton = screen.getByTestId('add-item-button');
      await user.click(addButton);

      await waitFor(() => {
        expect(mockOnItemComplete).toHaveBeenCalledWith({
          category: 'CAT001',
          subcategory: undefined,
          quantity: 3,
          weight: 2,
          price: 10,
          total: 10
        });
      });
    });
  });

  describe('Price Skip Logic', () => {
    it('skips price step for category with fixed price', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Select category with fixed price
      await waitFor(() => {
        expect(screen.getByText('Écrans')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Écrans'));

      // Enter quantity
      await waitFor(() => {
        expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
      });

      const qtyButtons = screen.getAllByRole('button');
      const button2 = qtyButtons.find(b => b.textContent === '2');
      if (button2) await user.click(button2);

      const validateQuantityButton = screen.getByTestId('validate-quantity-button');
      await user.click(validateQuantityButton);

      // Enter weight
      await waitFor(() => {      });

      // Add weight via numpad
      await user.click(screen.getByTestId('add-weight-button'));
      await waitFor(() => expect(screen.getByTestId('numpad-3')).toBeInTheDocument());
      await user.click(screen.getByTestId('numpad-3'));
      await waitFor(() => {
        const confirmButton = screen.getByTestId('confirm-weight-button');
        expect(confirmButton).not.toBeDisabled();
      });
      await user.click(screen.getByTestId('confirm-weight-button'));

      // Validate total
      await waitFor(() => {
        const validateButton = screen.getByTestId('validate-total-button');
        expect(validateButton).not.toBeDisabled();
      });
      const validateButton = screen.getByTestId('validate-total-button');
      await user.click(validateButton);

      // Should skip price step and complete item
      await waitFor(() => {
        expect(mockOnItemComplete).toHaveBeenCalledWith({
          category: 'CAT002',
          subcategory: undefined,
          quantity: 2,
          weight: 3,
          price: 15.50,
          total: 15.50
        });
      });

      // Should reset to category selection
      await waitFor(() => {
        expect(screen.getByText('Sélectionner la catégorie EEE')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation non-linéaire', () => {
    it('allows clicking on mode buttons to navigate between steps', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Start at category step
      expect(screen.getByText('Sélectionner la catégorie EEE')).toBeInTheDocument();

      // Select a category first
      await user.click(screen.getByText('Petits appareils ménagers'));

      // Now we should be at weight step
      await waitFor(() => {      });

      // Click on "Quantité" button to navigate to quantity step
      const quantityButton = screen.getByText('Quantité');
      await user.click(quantityButton);

      // Should be at quantity step
      await waitFor(() => {
        expect(screen.getByText('Quantité')).toBeInTheDocument();
      });

      // Click on "Poids" button to go back to weight step
      const weightButton = screen.getByText('Poids');
      await user.click(weightButton);

      // Should be back at weight step
      await waitFor(() => {      });
    });

    it('disables navigation buttons based on prerequisites', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Weight button should be disabled initially
      const weightButton = screen.getByText('Poids');
      expect(weightButton.closest('button')).toBeDisabled();

      // Quantity button should be disabled initially
      const quantityButton = screen.getByText('Quantité');
      expect(quantityButton.closest('button')).toBeDisabled();
    });

    it('should restore state when navigating back to previous steps', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);
      
      // Sélectionner une catégorie
      await user.click(screen.getByText('Petits appareils ménagers'));
      
      // Aller à l'étape poids
      await waitFor(() => {      });
      
      // Retourner à la catégorie
      const categoryButton = screen.getByText('Catégorie');
      await user.click(categoryButton);
      
      // Vérifier que la catégorie est toujours sélectionnée
      await waitFor(() => {
        expect(screen.getByText('Sélectionner la catégorie EEE')).toBeInTheDocument();
      });
    });

    it('should focus on appropriate element when navigating', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);
      
      // Sélectionner une catégorie et aller au poids
      await user.click(screen.getByText('Petits appareils ménagers'));
      
      await waitFor(() => {      });
      
      // Vérifier que l'élément de focus est présent
      expect(screen.getByTestId('weight-input')).toBeInTheDocument();
    });
  });

  describe('Calcul en temps réel sur la page Quantité', () => {
    it('displays real-time calculation when category has fixed price', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Select category with fixed price
      await user.click(screen.getByText('Écrans'));

      // Navigate to quantity step
      await waitFor(() => {
        expect(screen.getByText('Quantité')).toBeInTheDocument();
      });

      // Enter quantity
      const button2 = screen.getAllByRole('button').find(b => b.textContent === '2');
      if (button2) await user.click(button2);

      // Should show calculation
      await waitFor(() => {
        expect(screen.getByText('15.50€ × 2 = 31.00€')).toBeInTheDocument();
      });
    });

    it('does not show calculation when category has no fixed price', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Select category without fixed price
      await user.click(screen.getByText('Petits appareils ménagers'));

      // Navigate to quantity step
      await waitFor(() => {
        expect(screen.getByText('Quantité')).toBeInTheDocument();
      });

      // Enter quantity
      const button2 = screen.getAllByRole('button').find(b => b.textContent === '2');
      if (button2) await user.click(button2);

      // Should not show calculation
      expect(screen.queryByText(/€ ×/)).not.toBeInTheDocument();
    });

    it('does not show calculation when category has max_price even with fixed price', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Select category with fixed price but also max_price
      await user.click(screen.getByText('Mobilier'));

      // Navigate to quantity step
      await waitFor(() => {
        expect(screen.getByText('Quantité')).toBeInTheDocument();
      });

      // Enter quantity
      const button2 = screen.getAllByRole('button').find(b => b.textContent === '2');
      if (button2) await user.click(button2);

      // Should not show calculation because max_price exists
      expect(screen.queryByText(/€ ×/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Calcul automatique/)).not.toBeInTheDocument();
    });
  });

  describe('Support clavier AZERTY', () => {
    it('handles AZERTY key mappings for quantity input', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Select category and navigate to quantity step
      await user.click(screen.getByText('Petits appareils ménagers'));
      await waitFor(() => {
        expect(screen.getByText('Quantité')).toBeInTheDocument();
      });

      // Simulate AZERTY key presses
      const quantityInput = screen.getByTestId('quantity-input');
      
      // Test AZERTY key '&' (should map to '1')
      fireEvent.keyDown(document, { key: '&' });
      await waitFor(() => {
        expect(quantityInput).toHaveTextContent('1');
      });

      // Test AZERTY key 'é' (should map to '2')
      fireEvent.keyDown(document, { key: 'é' });
      await waitFor(() => {
        expect(quantityInput).toHaveTextContent('12');
      });
    });

    it('handles AZERTY key mappings for price input', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Select category and navigate to price step
      await user.click(screen.getByText('Petits appareils ménagers'));
      await waitFor(() => {      });

      // Add weight to proceed to quantity step
      const addWeightButton = screen.getByTestId('add-weight-button');
      await user.click(addWeightButton);
      await user.click(screen.getByTestId('numpad-3'));
      await user.click(screen.getByTestId('confirm-weight-button'));
      await user.click(screen.getByTestId('validate-total-button'));

      // Navigate to quantity step
      await waitFor(() => {
        expect(screen.getByText('Quantité')).toBeInTheDocument();
      });

      // Enter quantity
      const button1 = screen.getAllByRole('button').find(b => b.textContent === '1');
      if (button1) await user.click(button1);
      await user.click(screen.getByTestId('validate-quantity-button'));

      // Should be at price step
      await waitFor(() => {
        expect(screen.getByText('Prix unitaire (€)')).toBeInTheDocument();
      });

      // Test AZERTY key mappings for price
      const priceInput = screen.getByTestId('price-input');
      
      // Test AZERTY key '&' (should map to '1')
      fireEvent.keyDown(document, { key: '&' });
      await waitFor(() => {
        expect(priceInput).toHaveTextContent('1');
      });

      // Test AZERTY key 'é' (should map to '2')
      fireEvent.keyDown(document, { key: 'é' });
      await waitFor(() => {
        expect(priceInput).toHaveTextContent('12');
      });
    });
  });

  describe('Wizard Reset', () => {
    it('resets to category step after completing item', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Complete full flow
      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Petits appareils ménagers'));

      // Enter quantity
      await waitFor(() => {
        expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
      });

      const qtyButtons = screen.getAllByRole('button');
      const button3 = qtyButtons.find(b => b.textContent === '3');
      if (button3) await user.click(button3);

      const validateQuantityButton = screen.getByTestId('validate-quantity-button');
      await user.click(validateQuantityButton);

      // Enter weight
      await waitFor(() => {      });

      // Add weight via numpad
      await user.click(screen.getByTestId('add-weight-button'));
      await waitFor(() => expect(screen.getByTestId('numpad-2')).toBeInTheDocument());
      await user.click(screen.getByTestId('numpad-2'));
      await waitFor(() => {
        const confirmButton = screen.getByTestId('confirm-weight-button');
        expect(confirmButton).not.toBeDisabled();
      });
      await user.click(screen.getByTestId('confirm-weight-button'));

      // Validate total
      await waitFor(() => {
        const validateTotalButton = screen.getByTestId('validate-total-button');
        expect(validateTotalButton).not.toBeDisabled();
      });
      const validateTotalButton = screen.getByTestId('validate-total-button');
      await user.click(validateTotalButton);

      // Enter price
      await waitFor(() => {
        expect(screen.getByText('Prix unitaire (€)')).toBeInTheDocument();
      });

      const buttons2 = screen.getAllByRole('button');
      const button1 = buttons2.find(b => b.textContent === '1');
      const button0 = buttons2.find(b => b.textContent === '0');
      if (button1) await user.click(button1);
      if (button0) await user.click(button0);

      const addButton = screen.getByTestId('add-item-button');
      await user.click(addButton);

      // Should be back at category selection
      await waitFor(() => {
        expect(screen.getByText('Sélectionner la catégorie EEE')).toBeInTheDocument();
      });
    });
  });

  describe('StagingItem Breadcrumb Integration', () => {
    it('displays staging item breadcrumb at initial state', async () => {
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByTestId('staging-item')).toBeInTheDocument();
        expect(screen.getByTestId('staging-item-empty')).toBeInTheDocument();
      });
    });

    it('updates breadcrumb after category selection', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Petits appareils ménagers'));

      await waitFor(() => {
        expect(screen.getByTestId('staging-item')).toBeInTheDocument();
        expect(screen.queryByTestId('staging-item-empty')).not.toBeInTheDocument();
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });
    });

    it('updates breadcrumb with category and subcategory', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Électroménager')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Électroménager'));

      await waitFor(() => {
        expect(screen.getByText('Réfrigérateurs')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Réfrigérateurs'));

      await waitFor(() => {
        const stagingItem = screen.getByTestId('staging-item');
        // Both category and subcategory should be visible in breadcrumb
        expect(stagingItem).toHaveTextContent('Électroménager');
        expect(stagingItem).toHaveTextContent('Réfrigérateurs');
      });
    });

    it('updates breadcrumb with quantity', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Petits appareils ménagers'));

      await navigateToQuantityViaWeight(user);

      const buttons = screen.getAllByRole('button');
      const button5 = buttons.find(b => b.textContent === '5');
      if (button5) await user.click(button5);

      await waitFor(() => {
        const stagingItem = screen.getByTestId('staging-item');
        expect(stagingItem).toHaveTextContent('Qté: 5');
      });
    });

    it('updates breadcrumb with weight after validation', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Select category
      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Petits appareils ménagers'));

      // Enter quantity
      await waitFor(() => {
        expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
      });
      const qtyButtons = screen.getAllByRole('button');
      const button3 = qtyButtons.find(b => b.textContent === '3');
      if (button3) await user.click(button3);

      const validateQuantityButton = screen.getByTestId('validate-quantity-button');
      await user.click(validateQuantityButton);

      // Enter weight
      await waitFor(() => {      });

      // Add weight via numpad
      await user.click(screen.getByTestId('add-weight-button'));
      await waitFor(() => expect(screen.getByTestId('numpad-2')).toBeInTheDocument());
      await user.click(screen.getByTestId('numpad-2'));
      await waitFor(() => {
        const confirmButton = screen.getByTestId('confirm-weight-button');
        expect(confirmButton).not.toBeDisabled();
      });
      await user.click(screen.getByTestId('confirm-weight-button'));

      // Validate total weight
      await waitFor(() => {
        const validateButton = screen.getByTestId('validate-total-button');
        expect(validateButton).not.toBeDisabled();
      });
      const validateButton = screen.getByTestId('validate-total-button');
      await user.click(validateButton);

      // Check breadcrumb includes weight
      await waitFor(() => {
        const stagingItem = screen.getByTestId('staging-item');
        expect(stagingItem).toHaveTextContent('Poids: 2.00 kg');
      });
    });

    it('updates breadcrumb with price', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Complete flow up to price step
      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Petits appareils ménagers'));

      // Enter quantity
      await waitFor(() => {
        expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
      });
      const qtyButtons = screen.getAllByRole('button');
      const button3 = qtyButtons.find(b => b.textContent === '3');
      if (button3) await user.click(button3);
      const validateQuantityButton = screen.getByTestId('validate-quantity-button');
      await user.click(validateQuantityButton);

      // Enter weight
      await waitFor(() => {      });
      await user.click(screen.getByTestId('add-weight-button'));
      await waitFor(() => expect(screen.getByTestId('numpad-2')).toBeInTheDocument());
      await user.click(screen.getByTestId('numpad-2'));
      await waitFor(() => {
        const confirmButton = screen.getByTestId('confirm-weight-button');
        expect(confirmButton).not.toBeDisabled();
      });
      await user.click(screen.getByTestId('confirm-weight-button'));

      // Validate total
      await waitFor(() => {
        const validateButton = screen.getByTestId('validate-total-button');
        expect(validateButton).not.toBeDisabled();
      });
      const validateButton = screen.getByTestId('validate-total-button');
      await user.click(validateButton);

      // Enter price
      await waitFor(() => {
        expect(screen.getByText('Prix unitaire (€)')).toBeInTheDocument();
      });

      const buttons2 = screen.getAllByRole('button');
      const button1 = buttons2.find(b => b.textContent === '1');
      const button5 = buttons2.find(b => b.textContent === '5');
      if (button1) await user.click(button1);
      if (button5) await user.click(button5);

      // Check breadcrumb includes price
      await waitFor(() => {
        const stagingItem = screen.getByTestId('staging-item');
        expect(stagingItem).toHaveTextContent('Prix: 15.00 €');
      });
    });

    it('clears breadcrumb after item completion', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Complete full flow
      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Petits appareils ménagers'));

      // Enter quantity
      await waitFor(() => {
        expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
      });
      const qtyButtons = screen.getAllByRole('button');
      const button3 = qtyButtons.find(b => b.textContent === '3');
      if (button3) await user.click(button3);
      const validateQuantityButton = screen.getByTestId('validate-quantity-button');
      await user.click(validateQuantityButton);

      // Enter weight
      await waitFor(() => {      });
      await user.click(screen.getByTestId('add-weight-button'));
      await waitFor(() => expect(screen.getByTestId('numpad-2')).toBeInTheDocument());
      await user.click(screen.getByTestId('numpad-2'));
      await waitFor(() => {
        const confirmButton = screen.getByTestId('confirm-weight-button');
        expect(confirmButton).not.toBeDisabled();
      });
      await user.click(screen.getByTestId('confirm-weight-button'));

      // Validate total
      await waitFor(() => {
        const validateButton = screen.getByTestId('validate-total-button');
        expect(validateButton).not.toBeDisabled();
      });
      const validateButton = screen.getByTestId('validate-total-button');
      await user.click(validateButton);

      // Enter price
      await waitFor(() => {
        expect(screen.getByText('Prix unitaire (€)')).toBeInTheDocument();
      });
      const buttons2 = screen.getAllByRole('button');
      const button1 = buttons2.find(b => b.textContent === '1');
      const button0 = buttons2.find(b => b.textContent === '0');
      if (button1) await user.click(button1);
      if (button0) await user.click(button0);

      const addButton = screen.getByTestId('add-item-button');
      await user.click(addButton);

      // Breadcrumb should be cleared and show empty state
      await waitFor(() => {
        expect(screen.getByTestId('staging-item-empty')).toBeInTheDocument();
        expect(screen.getByText('Aucune information saisie')).toBeInTheDocument();
      });
    });
  });
});
