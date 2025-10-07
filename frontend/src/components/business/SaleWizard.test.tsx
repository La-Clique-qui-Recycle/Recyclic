import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
      price: null, // No fixed price
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'CAT002',
      name: 'Écrans',
      is_active: true,
      price: 15.50, // Fixed price
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

    it('transitions to weight step after category selection', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Petits appareils ménagers'));

      await waitFor(() => {
        expect(screen.getByText('Poids (kg)')).toBeInTheDocument();
      });
    });
  });

  describe('Step 2: Weight Entry', () => {
    it('renders numpad for weight entry', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Petits appareils ménagers'));

      await waitFor(() => {
        expect(screen.getByText('Poids (kg)')).toBeInTheDocument();
        expect(screen.getByTestId('weight-input')).toBeInTheDocument();
      });
    });

    it('allows entering weight via numpad', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Petits appareils ménagers'));

      await waitFor(() => {
        expect(screen.getByText('Poids (kg)')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const button2 = buttons.find(b => b.textContent === '2');
      const button5 = buttons.find(b => b.textContent === '5');

      if (button2) await user.click(button2);
      if (button5) await user.click(button5);

      await waitFor(() => {
        const display = screen.getByTestId('weight-input');
        expect(display.textContent).toContain('25');
      });
    });

    it('validates weight before allowing confirmation', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Petits appareils ménagers'));

      await waitFor(() => {
        const validateButton = screen.getByTestId('validate-weight-button');
        expect(validateButton).toBeDisabled();
      });
    });
  });

  describe('Step 3: Price Entry', () => {
    it('transitions to price step after valid weight for non-fixed-price category', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Petits appareils ménagers'));

      await waitFor(() => {
        expect(screen.getByText('Poids (kg)')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const button2 = buttons.find(b => b.textContent === '2');
      if (button2) await user.click(button2);

      await waitFor(() => {
        const validateButton = screen.getByTestId('validate-weight-button');
        expect(validateButton).not.toBeDisabled();
      });

      const validateButton = screen.getByTestId('validate-weight-button');
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

      // Enter weight
      await waitFor(() => {
        expect(screen.getByText('Poids (kg)')).toBeInTheDocument();
      });
      const buttons1 = screen.getAllByRole('button');
      const button2 = buttons1.find(b => b.textContent === '2');
      if (button2) await user.click(button2);

      const validateWeightButton = screen.getByTestId('validate-weight-button');
      await user.click(validateWeightButton);

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

      // Enter weight
      await waitFor(() => {
        expect(screen.getByText('Poids (kg)')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const button3 = buttons.find(b => b.textContent === '3');
      if (button3) await user.click(button3);

      const validateButton = screen.getByTestId('validate-weight-button');
      await user.click(validateButton);

      // Should skip price step and complete item
      await waitFor(() => {
        expect(mockOnItemComplete).toHaveBeenCalledWith({
          category: 'CAT002',
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

  describe('Wizard Reset', () => {
    it('resets to category step after completing item', async () => {
      const user = userEvent.setup();
      render(<SaleWizard onItemComplete={mockOnItemComplete} />);

      // Complete full flow
      await waitFor(() => {
        expect(screen.getByText('Petits appareils ménagers')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Petits appareils ménagers'));

      await waitFor(() => {
        expect(screen.getByText('Poids (kg)')).toBeInTheDocument();
      });

      const buttons1 = screen.getAllByRole('button');
      const button2 = buttons1.find(b => b.textContent === '2');
      if (button2) await user.click(button2);

      const validateWeightButton = screen.getByTestId('validate-weight-button');
      await user.click(validateWeightButton);

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
});
