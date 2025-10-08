/**
 * Integration tests for Story B19-P1: Raffinements du Workflow de Saisie de la Caisse
 *
 * Tests focus on the specific acceptance criteria:
 * 1. Non-linear navigation via breadcrumb
 * 2. Weight page improvements (no auto-add, + button, Enter key)
 * 3. Quantity page improvements (live calculation display, Enter key)
 * 4. AZERTY keyboard support
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SaleWizard from './SaleWizard';
import { useCategoryStore } from '../../stores/categoryStore';

vi.mock('../../stores/categoryStore', () => ({
  useCategoryStore: vi.fn()
}));

describe('SaleWizard - Story B19-P1 Integration Tests', () => {
  const mockOnItemComplete = vi.fn();
  const mockCategories = [
    {
      id: 'CAT001',
      name: 'Électroménager',
      is_active: true,
      parent_id: null,
      price: 10.00,
      max_price: 20.00,
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
  });

  describe('AC1: Navigation Non-Linéaire', () => {
    it('allows clicking breadcrumb to return to previous steps', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Start at category step
      await waitFor(() => {
        expect(screen.getByText('Sélectionner la catégorie EEE')).toBeInTheDocument();
      });

      // Select category
      await user.click(screen.getByText('Électroménager'));

      // Should navigate to weight step
      await waitFor(() => {
        expect(screen.getByText('Saisir le poids (kg)')).toBeInTheDocument();
      });

      // Click on Category breadcrumb button to go back
      const categoryButton = screen.getByRole('button', { name: /Catégorie/i });
      expect(categoryButton).toBeInTheDocument();

      await user.click(categoryButton);

      // Should be back on category step
      await waitFor(() => {
        expect(screen.getByText('Sélectionner la catégorie EEE')).toBeInTheDocument();
      });
    });
  });

  describe('AC2: Weight Page - No Auto-Add', () => {
    it('does NOT auto-add weight after typing digits', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Navigate to weight step
      await user.click(screen.getByText('Électroménager'));
      await waitFor(() => {
        expect(screen.getByText('Saisir le poids (kg)')).toBeInTheDocument();
      });

      // Type digits
      await user.click(screen.getByTestId('numpad-5'));
      await user.click(screen.getByTestId('numpad-.'));
      await user.click(screen.getByTestId('numpad-5'));

      // Weight should be displayed but NOT added to list yet
      const weightInput = screen.getByTestId('weight-input');
      expect(weightInput.textContent).toContain('5.5');

      // Check that weight list is still empty
      expect(screen.queryByTestId('weight-item-0')).not.toBeInTheDocument();
      expect(screen.getByText('Aucune pesée enregistrée')).toBeInTheDocument();
    });

    it('adds weight only when + button is clicked', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Navigate to weight step
      await user.click(screen.getByText('Électroménager'));
      await waitFor(() => {
        expect(screen.getByText('Saisir le poids (kg)')).toBeInTheDocument();
      });

      // Type weight - need valid decimal weight
      await user.click(screen.getByTestId('numpad-3'));
      await user.click(screen.getByTestId('numpad-.'));
      await user.click(screen.getByTestId('numpad-5'));

      // Wait for input to update
      await waitFor(() => {
        const weightInput = screen.getByTestId('weight-input');
        expect(weightInput.textContent).toContain('3.5');
      });

      // Click + button
      const addButton = screen.getByTestId('confirm-weight-button');
      await waitFor(() => {
        expect(addButton).not.toBeDisabled();
      });

      await user.click(addButton);

      // Weight should now be in the list
      await waitFor(() => {
        expect(screen.getByTestId('weight-item-0')).toBeInTheDocument();
      });
    });

    it('validates total weight with Enter key and navigates to quantity', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Navigate to weight step
      await user.click(screen.getByText('Électroménager'));
      await waitFor(() => {
        expect(screen.getByText('Saisir le poids (kg)')).toBeInTheDocument();
      });

      // Type a weight
      await user.click(screen.getByTestId('numpad-5'));
      await user.click(screen.getByTestId('numpad-.'));
      await user.click(screen.getByTestId('numpad-5'));

      // Wait for weight to be valid
      await waitFor(() => {
        const weightInput = screen.getByTestId('weight-input');
        expect(weightInput.textContent).toContain('5.5');
      });

      // Press Enter to VALIDATE TOTAL and navigate to next step
      fireEvent.keyDown(document, { key: 'Enter' });

      // Should navigate directly to quantity step (even with only one weight)
      await waitFor(() => {
        expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('AC3: Quantity Page - Live Calculation', () => {
    it('displays live calculation when quantity is entered', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Navigate through to quantity step
      await user.click(screen.getByText('Électroménager'));

      // Weight step
      await waitFor(() => {
        expect(screen.getByText('Saisir le poids (kg)')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('numpad-2'));
      await user.click(screen.getByTestId('confirm-weight-button'));
      await waitFor(() => {
        expect(screen.getByTestId('validate-total-button')).not.toBeDisabled();
      });
      await user.click(screen.getByTestId('validate-total-button'));

      // Quantity step
      await waitFor(() => {
        expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
      });

      // Enter quantity
      await user.click(screen.getByTestId('numpad-3'));

      // Live calculation should appear
      await waitFor(() => {
        expect(screen.getByText(/Calcul automatique/i)).toBeInTheDocument();
        // Price is 10.00, quantity is 3, total should be 30.00
        expect(screen.getByText(/10.*×.*3.*=.*30/)).toBeInTheDocument();
      });
    });

    it('validates quantity with Enter key', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Navigate to quantity step
      await user.click(screen.getByText('Électroménager'));
      await waitFor(() => expect(screen.getByTestId('numpad-2')).toBeInTheDocument());
      await user.click(screen.getByTestId('numpad-2'));
      await user.click(screen.getByTestId('confirm-weight-button'));
      await waitFor(() => expect(screen.getByTestId('validate-total-button')).not.toBeDisabled());
      await user.click(screen.getByTestId('validate-total-button'));

      await waitFor(() => {
        expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
      });

      // Enter quantity
      await user.click(screen.getByTestId('numpad-2'));

      // Press Enter
      fireEvent.keyDown(document, { key: 'Enter' });

      // Should navigate to price step (since category has max_price)
      await waitFor(() => {
        expect(screen.getByTestId('price-input')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('AC4: AZERTY Keyboard Support', () => {
    it('accepts AZERTY number keys on quantity step', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Navigate to quantity step
      await user.click(screen.getByText('Électroménager'));
      await waitFor(() => expect(screen.getByTestId('numpad-5')).toBeInTheDocument());
      await user.click(screen.getByTestId('numpad-5'));
      await user.click(screen.getByTestId('confirm-weight-button'));
      await waitFor(() => expect(screen.getByTestId('validate-total-button')).not.toBeDisabled());
      await user.click(screen.getByTestId('validate-total-button'));

      await waitFor(() => {
        expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
      });

      const quantityInput = screen.getByTestId('quantity-input');

      // Test AZERTY keys: & = 1, é = 2, " = 3
      fireEvent.keyDown(document, { key: '&' }); // 1
      await waitFor(() => {
        expect(quantityInput.textContent).toContain('1');
      });

      fireEvent.keyDown(document, { key: 'é' }); // 2
      await waitFor(() => {
        expect(quantityInput.textContent).toContain('12');
      });
    });

    it('accepts AZERTY keys on weight step', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Navigate to weight step
      await user.click(screen.getByText('Électroménager'));
      await waitFor(() => {
        expect(screen.getByText('Saisir le poids (kg)')).toBeInTheDocument();
      });

      const weightInput = screen.getByTestId('weight-input');

      // Test AZERTY key: é = 2
      fireEvent.keyDown(document, { key: 'é' });
      await waitFor(() => {
        expect(weightInput.textContent).toContain('2');
      });

      // Test decimal point
      fireEvent.keyDown(document, { key: '.' });
      await waitFor(() => {
        expect(weightInput.textContent).toContain('2.');
      });

      // Test AZERTY key: ( = 5
      fireEvent.keyDown(document, { key: '(' });
      await waitFor(() => {
        expect(weightInput.textContent).toContain('2.5');
      });
    });
  });
});
