import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NumericKeypad from '../../components/ui/NumericKeypad';

describe('NumericKeypad Component', () => {
  const mockOnKeyPress = vi.fn();
  const mockOnClear = vi.fn();
  const mockOnBackspace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all number keys', () => {
    render(
      <NumericKeypad
        onKeyPress={mockOnKeyPress}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
      />
    );

    // Vérifier que tous les chiffres sont présents
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }

    // Vérifier les touches spéciales
    expect(screen.getByText('.')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('⌫')).toBeInTheDocument();
  });

  it('should call onKeyPress when number key is clicked', () => {
    render(
      <NumericKeypad
        onKeyPress={mockOnKeyPress}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
      />
    );

    fireEvent.click(screen.getByText('5'));
    expect(mockOnKeyPress).toHaveBeenCalledWith('5');
  });

  it('should call onClear when C key is clicked', () => {
    render(
      <NumericKeypad
        onKeyPress={mockOnKeyPress}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
      />
    );

    fireEvent.click(screen.getByText('C'));
    expect(mockOnClear).toHaveBeenCalled();
  });

  it('should call onBackspace when backspace key is clicked', () => {
    render(
      <NumericKeypad
        onKeyPress={mockOnKeyPress}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
      />
    );

    fireEvent.click(screen.getByText('⌫'));
    expect(mockOnBackspace).toHaveBeenCalled();
  });

  it('should call onKeyPress when decimal point is clicked', () => {
    render(
      <NumericKeypad
        onKeyPress={mockOnKeyPress}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
      />
    );

    fireEvent.click(screen.getByText('.'));
    expect(mockOnKeyPress).toHaveBeenCalledWith('.');
  });

  it('should have proper styling classes', () => {
    render(
      <NumericKeypad
        onKeyPress={mockOnKeyPress}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
      />
    );

    // Vérifier que le bouton 0 a la classe 'zero'
    const zeroButton = screen.getByText('0');
    expect(zeroButton).toHaveClass('zero');

    // Vérifier que le bouton C a la classe 'action'
    const clearButton = screen.getByText('C');
    expect(clearButton).toHaveClass('action');

    // Vérifier que le bouton backspace a la classe 'action'
    const backspaceButton = screen.getByText('⌫');
    expect(backspaceButton).toHaveClass('action');
  });
});
