import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MultipleWeightEntry from './MultipleWeightEntry';

describe('MultipleWeightEntry', () => {
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('renders with empty weight list', () => {
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      expect(screen.getByText('Pesées effectuées (0)')).toBeInTheDocument();
      expect(screen.getByText('Aucune pesée enregistrée')).toBeInTheDocument();
      expect(screen.getByTestId('total-weight')).toHaveTextContent('0');
    });

    it('shows numpad for weight entry', () => {
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      expect(screen.getByText('Saisir le poids (kg)')).toBeInTheDocument();
      expect(screen.getByTestId('weight-input')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-weight-button')).toBeInTheDocument();
    });

    it('validate button is disabled when no weights', () => {
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      const validateButton = screen.getByTestId('validate-total-button');
      expect(validateButton).toBeDisabled();
    });
  });

  describe('Adding Weights', () => {
    it('allows entering weight via numpad', async () => {
      const user = userEvent.setup();
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      await user.click(screen.getByTestId('numpad-2'));
      await user.click(screen.getByTestId('numpad-.'));
      await user.click(screen.getByTestId('numpad-5'));

      await waitFor(() => {
        const display = screen.getByTestId('weight-input');
        expect(display.textContent).toContain('2.5');
      });
    });

    it('validates weight before allowing confirmation', async () => {
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      const confirmButton = screen.getByTestId('confirm-weight-button');
      expect(confirmButton).toBeDisabled();
    });

    it('adds weight to list when confirmed', async () => {
      const user = userEvent.setup();
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      await user.click(screen.getByTestId('numpad-3'));

      await waitFor(() => {
        const confirmButton = screen.getByTestId('confirm-weight-button');
        expect(confirmButton).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('confirm-weight-button'));

      await waitFor(() => {
        expect(screen.getByTestId('weight-item-0')).toBeInTheDocument();
        expect(screen.getByText('Pesées effectuées (1)')).toBeInTheDocument();
      });
    });

    it('clears input when backspace button is clicked', async () => {
      const user = userEvent.setup();
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      await user.click(screen.getByTestId('numpad-5'));

      await waitFor(() => {
        const display = screen.getByTestId('weight-input');
        expect(display.textContent).toContain('5');
      });

      await user.click(screen.getByTestId('numpad-⌫'));

      await waitFor(() => {
        const display = screen.getByTestId('weight-input');
        expect(display.textContent).toContain('0');
      });
    });
  });

  describe('Weight List Management', () => {
    it('displays multiple weights correctly', async () => {
      const user = userEvent.setup();
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      // Add first weight
      await user.click(screen.getByTestId('numpad-2'));
      await user.click(screen.getByTestId('confirm-weight-button'));

      // Add second weight
      await user.click(screen.getByTestId('numpad-3'));
      await user.click(screen.getByTestId('confirm-weight-button'));

      await waitFor(() => {
        expect(screen.getByTestId('weight-item-0')).toBeInTheDocument();
        expect(screen.getByTestId('weight-item-1')).toBeInTheDocument();
        expect(screen.getByText('Pesées effectuées (2)')).toBeInTheDocument();
      });
    });

    it('calculates total weight correctly', async () => {
      const user = userEvent.setup();
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      // Add first weight: 2.5 kg
      await user.click(screen.getByTestId('numpad-2'));
      await user.click(screen.getByTestId('numpad-.'));
      await user.click(screen.getByTestId('numpad-5'));
      await user.click(screen.getByTestId('confirm-weight-button'));

      // Add second weight: 3.5 kg
      await user.click(screen.getByTestId('numpad-3'));
      await user.click(screen.getByTestId('numpad-.'));
      await user.click(screen.getByTestId('numpad-5'));
      await user.click(screen.getByTestId('confirm-weight-button'));

      await waitFor(() => {
        const totalDisplay = screen.getByTestId('total-weight');
        expect(totalDisplay.textContent).toContain('6');
      });
    });

    it('deletes weight from list', async () => {
      const user = userEvent.setup();
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      // Add a weight
      await user.click(screen.getByTestId('numpad-2'));
      await user.click(screen.getByTestId('confirm-weight-button'));

      await waitFor(() => {
        expect(screen.getByTestId('weight-item-0')).toBeInTheDocument();
      });

      // Delete the weight
      await user.click(screen.getByTestId('delete-weight-0'));

      await waitFor(() => {
        expect(screen.queryByTestId('weight-item-0')).not.toBeInTheDocument();
        expect(screen.getByText('Aucune pesée enregistrée')).toBeInTheDocument();
        expect(screen.getByTestId('total-weight')).toHaveTextContent('0');
      });
    });

    it('updates total after deleting weight', async () => {
      const user = userEvent.setup();
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      // Add two weights
      await user.click(screen.getByTestId('numpad-5'));
      await user.click(screen.getByTestId('confirm-weight-button'));

      await user.click(screen.getByTestId('numpad-3'));
      await user.click(screen.getByTestId('confirm-weight-button'));

      // Total should be 8
      await waitFor(() => {
        const totalDisplay = screen.getByTestId('total-weight');
        expect(totalDisplay.textContent).toContain('8');
      });

      // Delete first weight (5 kg)
      await user.click(screen.getByTestId('delete-weight-0'));

      // Total should now be 3
      await waitFor(() => {
        const totalDisplay = screen.getByTestId('total-weight');
        expect(totalDisplay.textContent).toContain('3');
      });
    });
  });

  describe('Validation and Confirmation', () => {
    it('validates total and calls onConfirm', async () => {
      const user = userEvent.setup();
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      // Add a weight
      await user.click(screen.getByTestId('numpad-5'));
      await user.click(screen.getByTestId('confirm-weight-button'));

      await waitFor(() => {
        const validateButton = screen.getByTestId('validate-total-button');
        expect(validateButton).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('validate-total-button'));

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith(5);
      });
    });

    it('calls onConfirm with correct total for multiple weights', async () => {
      const user = userEvent.setup();
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      // Add first weight: 2 kg
      await user.click(screen.getByTestId('numpad-2'));
      await user.click(screen.getByTestId('confirm-weight-button'));

      // Add second weight: 3 kg
      await user.click(screen.getByTestId('numpad-3'));
      await user.click(screen.getByTestId('confirm-weight-button'));

      await waitFor(() => {
        const validateButton = screen.getByTestId('validate-total-button');
        expect(validateButton).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('validate-total-button'));

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith(5);
      });
    });
  });

  describe('Layout en colonnes', () => {
    it('displays weight list in left column', () => {
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      // Vérifier que la liste des pesées est dans la colonne de gauche
      expect(screen.getByText('Pesées effectuées (0)')).toBeInTheDocument();
      expect(screen.getByTestId('total-weight')).toBeInTheDocument();
    });

    it('displays weight input in right column', () => {
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      expect(screen.getByText('Saisir le poids (kg)')).toBeInTheDocument();
      expect(screen.getByTestId('weight-input')).toBeInTheDocument();
    });

    it('shows validation button in left column when weights are added', async () => {
      const user = userEvent.setup();
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      // Add a weight
      await user.click(screen.getByTestId('numpad-3'));
      await user.click(screen.getByTestId('confirm-weight-button'));

      await waitFor(() => {
        const validateButton = screen.getByTestId('validate-total-button');
        expect(validateButton).not.toBeDisabled();
        expect(validateButton).toBeInTheDocument();
      });
    });
  });

  describe('Support clavier AZERTY', () => {
    it('handles AZERTY key mappings for weight input', async () => {
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      const weightInput = screen.getByTestId('weight-input');

      // Test AZERTY key '&' (should map to '1')
      fireEvent.keyDown(document, { key: '&' });
      await waitFor(() => {
        expect(weightInput.textContent).toContain('1');
      });

      // Test AZERTY key 'é' (should map to '2')
      fireEvent.keyDown(document, { key: 'é' });
      await waitFor(() => {
        expect(weightInput.textContent).toContain('12');
      });

      // Test AZERTY key 'ç' (should map to '9')
      fireEvent.keyDown(document, { key: 'ç' });
      await waitFor(() => {
        expect(weightInput.textContent).toContain('129');
      });
    });

    it('handles decimal point with AZERTY keys', async () => {
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      const weightInput = screen.getByTestId('weight-input');

      // Test decimal point
      fireEvent.keyDown(document, { key: '.' });
      await waitFor(() => {
        expect(weightInput.textContent).toContain('.');
      });

      // Test AZERTY key after decimal
      fireEvent.keyDown(document, { key: 'à' }); // maps to '0'
      await waitFor(() => {
        expect(weightInput.textContent).toContain('.0');
      });
    });

    it('handles backspace with AZERTY input', async () => {
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);

      const weightInput = screen.getByTestId('weight-input');

      // Add some AZERTY input
      fireEvent.keyDown(document, { key: '&' }); // '1'
      fireEvent.keyDown(document, { key: 'é' }); // '2'
      fireEvent.keyDown(document, { key: 'ç' }); // '9'

      await waitFor(() => {
        expect(weightInput.textContent).toContain('129');
      });

      // Test backspace
      fireEvent.keyDown(document, { key: 'Backspace' });
      await waitFor(() => {
        expect(weightInput.textContent).toContain('12');
      });
    });
  });

  describe('Layout compact et responsive', () => {
    it('should have compact layout for mobile devices', () => {
      // Simuler un écran mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);
      
      // Vérifier que les éléments sont présents même sur mobile
      expect(screen.getByTestId('weight-input')).toBeInTheDocument();
      expect(screen.getByTestId('validate-total-button')).toBeInTheDocument();
    });

    it('should maintain responsive design across breakpoints', () => {
      // Test desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
      
      const { rerender } = render(<MultipleWeightEntry onConfirm={mockOnConfirm} />);
      expect(screen.getByTestId('multiple-weight-container')).toBeInTheDocument();
      
      // Test tablet
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      rerender(<MultipleWeightEntry onConfirm={mockOnConfirm} />);
      expect(screen.getByTestId('multiple-weight-container')).toBeInTheDocument();
      
      // Test mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      rerender(<MultipleWeightEntry onConfirm={mockOnConfirm} />);
      expect(screen.getByTestId('multiple-weight-container')).toBeInTheDocument();
    });
  });
});
