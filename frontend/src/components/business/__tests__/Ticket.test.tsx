import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Ticket from '../Ticket';
import { SaleItem } from '../../../stores/cashSessionStore';

// Mock des fonctions
const mockOnRemoveItem = vi.fn();
const mockOnUpdateItem = vi.fn();
const mockOnFinalizeSale = vi.fn();

describe('Ticket Component', () => {
  const mockItems: SaleItem[] = [
    {
      id: '1',
      category: 'EEE-3',
      quantity: 1,
      weight: 2.5,
      price: 15.0,
      total: 15.0
    },
    {
      id: '2',
      category: 'EEE-4',
      quantity: 1,
      weight: 1.2,
      price: 8.5,
      total: 8.5
    }
  ];

  it('should render ticket with items correctly', () => {
    render(
      <Ticket
        items={mockItems}
        onRemoveItem={mockOnRemoveItem}
        onUpdateItem={mockOnUpdateItem}
        onFinalizeSale={mockOnFinalizeSale}
      />
    );

    expect(screen.getByText('Ticket de Caisse')).toBeInTheDocument();
    expect(screen.getByText('EEE-3')).toBeInTheDocument();
    expect(screen.getByText('EEE-4')).toBeInTheDocument();
    expect(screen.getByText('2.50 kg')).toBeInTheDocument();
    expect(screen.getByText('1.20 kg')).toBeInTheDocument();
    expect(screen.getByText('15.00 €')).toBeInTheDocument();
    expect(screen.getByText('8.50 €')).toBeInTheDocument();
  });

  it('should handle items with undefined weight and total gracefully', () => {
    const itemsWithUndefined: SaleItem[] = [
      {
        id: '1',
        category: 'EEE-3',
        quantity: 1,
        weight: undefined as any,
        price: 15.0,
        total: undefined as any
      }
    ];

    // Ne devrait pas lever d'erreur
    expect(() => {
      render(
        <Ticket
          items={itemsWithUndefined}
          onRemoveItem={mockOnRemoveItem}
          onUpdateItem={mockOnUpdateItem}
          onFinalizeSale={mockOnFinalizeSale}
        />
      );
    }).not.toThrow();

    // Devrait afficher 0.00 pour les valeurs undefined
    expect(screen.getByText('0.00 kg')).toBeInTheDocument();
    expect(screen.getByTestId('sale-total')).toHaveTextContent('0.00 €');
  });

  it('should display empty state when no items', () => {
    render(
      <Ticket
        items={[]}
        onRemoveItem={mockOnRemoveItem}
        onUpdateItem={mockOnUpdateItem}
        onFinalizeSale={mockOnFinalizeSale}
      />
    );

    expect(screen.getByText('Aucun article ajouté')).toBeInTheDocument();
  });

  it('should calculate total amount correctly', () => {
    render(
      <Ticket
        items={mockItems}
        onRemoveItem={mockOnRemoveItem}
        onUpdateItem={mockOnUpdateItem}
        onFinalizeSale={mockOnFinalizeSale}
      />
    );

    // Total attendu: 15.0 + 8.5 = 23.5
    expect(screen.getByText('23.50 €')).toBeInTheDocument();
  });

  it('should handle items with null values gracefully', () => {
    const itemsWithNull: SaleItem[] = [
      {
        id: '1',
        category: 'EEE-3',
        quantity: 1,
        weight: null as any,
        price: 15.0,
        total: null as any
      }
    ];

    expect(() => {
      render(
        <Ticket
          items={itemsWithNull}
          onRemoveItem={mockOnRemoveItem}
          onUpdateItem={mockOnUpdateItem}
          onFinalizeSale={mockOnFinalizeSale}
        />
      );
    }).not.toThrow();

    expect(screen.getByText('0.00 kg')).toBeInTheDocument();
    expect(screen.getByTestId('sale-total')).toHaveTextContent('0.00 €');
  });
});