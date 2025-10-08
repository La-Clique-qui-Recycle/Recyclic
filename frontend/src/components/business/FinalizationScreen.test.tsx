import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FinalizationScreen from './FinalizationScreen';

describe('FinalizationScreen', () => {
  it('renders with total and donation default', () => {
    render(
      <FinalizationScreen
        open
        totalAmount={20}
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );
    expect(screen.getByTestId('finalization-screen')).toBeInTheDocument();
    expect(screen.getByTestId('amount-due')).toHaveTextContent('20.00 €');
  });

  it('updates amount due when donation changes', () => {
    render(
      <FinalizationScreen
        open
        totalAmount={10}
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );
    const donation = screen.getByTestId('donation-input') as HTMLInputElement;
    fireEvent.change(donation, { target: { value: '2.5' } });
    expect(screen.getByTestId('amount-due')).toHaveTextContent('12.50 €');
  });

  it('shows cash fields for cash method and computes change', () => {
    render(
      <FinalizationScreen
        open
        totalAmount={10}
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );
    fireEvent.change(screen.getByTestId('donation-input'), { target: { value: '1.00' } });
    const cashInput = screen.getByTestId('cash-given-input') as HTMLInputElement;
    fireEvent.change(cashInput, { target: { value: '20' } });
    expect(screen.getByTestId('change-output')).toHaveValue('9.00');
    const confirm = screen.getByTestId('confirm-finalization') as HTMLButtonElement;
    expect(confirm.disabled).toBe(false);
  });

  it('disables confirm when cash given is insufficient', () => {
    render(
      <FinalizationScreen
        open
        totalAmount={10}
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );
    fireEvent.change(screen.getByTestId('cash-given-input'), { target: { value: '5' } });
    const confirm = screen.getByTestId('confirm-finalization') as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
  });

  it('enables confirm for card without cash given', () => {
    render(
      <FinalizationScreen
        open
        totalAmount={10}
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );
    fireEvent.change(screen.getByTestId('payment-select'), { target: { value: 'card' } });
    const confirm = screen.getByTestId('confirm-finalization') as HTMLButtonElement;
    expect(confirm.disabled).toBe(false);
  });
});


