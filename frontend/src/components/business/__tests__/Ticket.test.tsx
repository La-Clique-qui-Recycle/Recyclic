import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Ticket from '../Ticket';
import { SaleItem } from '../../../stores/cashSessionStore';

// Mock des props
const mockItems: SaleItem[] = [
  {
    id: '1',
    category: 'EEE-1',
    quantity: 2,
    price: 15.50,
    total: 31.00
  },
  {
    id: '2',
    category: 'EEE-3',
    quantity: 1,
    price: 25.00,
    total: 25.00
  }
];

const mockProps = {
  items: mockItems,
  onRemoveItem: vi.fn(),
  onUpdateItem: vi.fn(),
  onFinalizeSale: vi.fn(),
  loading: false
};

describe('Ticket Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le titre du ticket', () => {
    render(<Ticket {...mockProps} />);
    expect(screen.getByText('Ticket de Caisse')).toBeInTheDocument();
  });

  it('affiche tous les articles de la vente', () => {
    render(<Ticket {...mockProps} />);

    expect(screen.getByText('EEE-1')).toBeInTheDocument();
    expect(screen.getByText('2 × 15.50 €')).toBeInTheDocument();
    expect(screen.getByText('31.00 €')).toBeInTheDocument();

    expect(screen.getByText('EEE-3')).toBeInTheDocument();
    expect(screen.getByText('1 × 25.00 €')).toBeInTheDocument();
    expect(screen.getByText('25.00 €')).toBeInTheDocument();
  });

  it('affiche le total correct', () => {
    render(<Ticket {...mockProps} />);

    expect(screen.getByText('3 articles')).toBeInTheDocument();
    expect(screen.getByText('56.00 €')).toBeInTheDocument();
  });

  it('affiche un message quand aucun article', () => {
    render(<Ticket {...mockProps} items={[]} />);
    expect(screen.getByText('Aucun article ajouté')).toBeInTheDocument();
  });

  it('appelle onRemoveItem quand on clique sur Supprimer', () => {
    render(<Ticket {...mockProps} />);
    
    const deleteButtons = screen.getAllByText('Supprimer');
    fireEvent.click(deleteButtons[0]);
    
    expect(mockProps.onRemoveItem).toHaveBeenCalledWith('1');
  });

  it('ouvre le modal de modification quand on clique sur Modifier', () => {
    render(<Ticket {...mockProps} />);
    
    const editButtons = screen.getAllByText('Modifier');
    fireEvent.click(editButtons[0]);
    
    expect(screen.getByText('Modifier l\'article')).toBeInTheDocument();
    expect(screen.getByDisplayValue('EEE-1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15.5')).toBeInTheDocument();
  });

  it('met à jour l\'article quand on valide la modification', async () => {
    render(<Ticket {...mockProps} />);
    
    // Ouvrir le modal
    const editButtons = screen.getAllByText('Modifier');
    fireEvent.click(editButtons[0]);
    
    // Modifier les valeurs
    const quantityInput = screen.getByDisplayValue('2');
    const priceInput = screen.getByDisplayValue('15.5');
    
    fireEvent.change(quantityInput, { target: { value: '3' } });
    fireEvent.change(priceInput, { target: { value: '20.00' } });
    
    // Valider
    const validateButton = screen.getByText('Valider');
    fireEvent.click(validateButton);
    
    await waitFor(() => {
      expect(mockProps.onUpdateItem).toHaveBeenCalledWith('1', 3, 20.00);
    });
  });

  it('annule la modification quand on clique sur Annuler', () => {
    render(<Ticket {...mockProps} />);
    
    // Ouvrir le modal
    const editButtons = screen.getAllByText('Modifier');
    fireEvent.click(editButtons[0]);
    
    // Annuler
    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);
    
    expect(screen.getByText('Modifier l\'article')).toHaveStyle('display: none');
  });

  it('appelle onFinalizeSale quand on clique sur Finaliser la vente', () => {
    render(<Ticket {...mockProps} />);
    
    const finalizeButton = screen.getByText('Finaliser la vente');
    fireEvent.click(finalizeButton);
    
    expect(mockProps.onFinalizeSale).toHaveBeenCalled();
  });

  it('désactive le bouton de finalisation quand loading', () => {
    render(<Ticket {...mockProps} loading={true} />);
    
    const finalizeButton = screen.getByText('Finalisation...');
    expect(finalizeButton).toBeDisabled();
  });

  it('n\'affiche pas le bouton de finalisation quand aucun article', () => {
    render(<Ticket {...mockProps} items={[]} />);

    expect(screen.queryByText('Finaliser la vente')).not.toBeInTheDocument();
  });

  it('valide les entrées dans le modal de modification', async () => {
    render(<Ticket {...mockProps} />);
    
    // Ouvrir le modal
    const editButtons = screen.getAllByText('Modifier');
    fireEvent.click(editButtons[0]);
    
    // Tenter de valider avec des valeurs invalides
    const quantityInput = screen.getByDisplayValue('2');
    const priceInput = screen.getByDisplayValue('15.5');
    
    fireEvent.change(quantityInput, { target: { value: '0' } });
    fireEvent.change(priceInput, { target: { value: '-5' } });
    
    // Valider
    const validateButton = screen.getByText('Valider');
    fireEvent.click(validateButton);
    
    // Ne devrait pas appeler onUpdateItem avec des valeurs invalides
    expect(mockProps.onUpdateItem).not.toHaveBeenCalled();
  });
});
