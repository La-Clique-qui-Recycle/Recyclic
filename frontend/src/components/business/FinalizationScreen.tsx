import React, { useMemo, useState } from 'react';
import styled from 'styled-components';

const Backdrop = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: ${p => (p.$open ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const Modal = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  min-width: 420px;
  max-width: 95vw;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
`;

const Title = styled.h3`
  margin: 0 0 1rem 0;
  color: #2c5530;
`;

const InfoMessage = styled.div`
  background: #e8f5e8;
  border: 1px solid #2c5530;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  color: #2c5530;
  font-size: 0.9rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Row = styled.div`
  display: flex;
  gap: 1rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
`;

const Label = styled.label`
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  &:focus { outline: none; border-color: #2c5530; }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  &:focus { outline: none; border-color: #2c5530; }
`;

const Summary = styled.div`
  background: #f8f9fa;
  border: 2px solid #eee;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  font-weight: 600;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.25rem;
  border: 2px solid ${p => p.$variant === 'primary' ? '#2c5530' : '#ddd'};
  background: ${p => p.$variant === 'primary' ? '#2c5530' : '#fff'};
  color: ${p => p.$variant === 'primary' ? '#fff' : '#333'};
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

export type PaymentMethod = 'cash' | 'card' | 'check';

export interface FinalizationData {
  donation: number;
  paymentMethod: PaymentMethod;
  cashGiven?: number;
  change?: number;
}

interface FinalizationScreenProps {
  open: boolean;
  totalAmount: number; // total ticket
  onCancel: () => void;
  onConfirm: (data: FinalizationData) => void;
}

const FinalizationScreen: React.FC<FinalizationScreenProps> = ({ open, totalAmount, onCancel, onConfirm }) => {
  const [donation, setDonation] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashGiven, setCashGiven] = useState<string>('');

  // Réinitialiser les champs quand la modal s'ouvre
  React.useEffect(() => {
    if (open) {
      setDonation('0');
      setPaymentMethod('cash');
      setCashGiven('');
    }
  }, [open]);

  const parsedDonation = useMemo(() => {
    const n = parseFloat(donation || '0');
    return isNaN(n) || n < 0 ? 0 : Math.min(n, 999999.99);
  }, [donation]);

  const parsedCashGiven = useMemo(() => {
    const n = parseFloat(cashGiven || '');
    if (paymentMethod !== 'cash') return undefined;
    if (isNaN(n) || n <= 0) return undefined;
    return Math.min(n, 999999.99);
  }, [cashGiven, paymentMethod]);

  const amountDue = useMemo(() => {
    return totalAmount + parsedDonation;
  }, [totalAmount, parsedDonation]);

  // Déterminer si c'est une transaction spéciale (dons/sorties)
  // Une transaction est spéciale si le total de base (sans don supplémentaire) est <= 0
  const isSpecialTransaction = totalAmount <= 0;

  const change = useMemo(() => {
    if (paymentMethod !== 'cash' || parsedCashGiven == null) return undefined;
    return Number((parsedCashGiven - amountDue).toFixed(2));
  }, [paymentMethod, parsedCashGiven, amountDue]);

  const canConfirm = useMemo(() => {
    // Pour les transactions à zéro euro ou dons (amountDue <= 0), pas besoin de paiement
    if (amountDue <= 0) {
      return true;
    }

    if (paymentMethod === 'cash') {
      return parsedCashGiven != null && parsedCashGiven >= amountDue;
    }
    return true; // card/check don't require cash given
  }, [paymentMethod, parsedCashGiven, amountDue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canConfirm) return;
    onConfirm({
      donation: Number(parsedDonation.toFixed(2)),
      paymentMethod,
      cashGiven: paymentMethod === 'cash' ? parsedCashGiven : undefined,
      change: paymentMethod === 'cash' ? change : undefined,
    });
  };

  return (
    <Backdrop $open={open} role="dialog" aria-modal="true" aria-label="Finaliser la vente" data-testid="finalization-screen">
      <Modal>
        <Title>Finaliser la vente</Title>

        {isSpecialTransaction && (
          <InfoMessage>
            💝 <strong>Transaction spéciale :</strong> Cette vente ne nécessite aucun paiement car il s'agit de dons ou de sorties uniquement.
          </InfoMessage>
        )}

        <Form onSubmit={handleSubmit}>
          <Summary>
            <span>Total à payer</span>
            <span data-testid="amount-due">{amountDue.toFixed(2)} €</span>
          </Summary>

          <Row>
            <Field>
              <Label htmlFor="donation">Don (€)</Label>
              <Input
                id="donation"
                type="number"
                step="0.01"
                min="0"
                value={donation}
                onChange={(e) => setDonation(e.target.value)}
                data-testid="donation-input"
              />
            </Field>
            <Field>
              <Label htmlFor="payment">Moyen de paiement</Label>
              <Select
                id="payment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                data-testid="payment-select"
              >
                <option value="cash">Espèces</option>
                <option value="card">Carte</option>
                <option value="check">Chèque</option>
              </Select>
            </Field>
          </Row>

          {paymentMethod === 'cash' && amountDue > 0 && (
            <Row>
              <Field>
                <Label htmlFor="cashGiven">Montant donné (€)</Label>
                <Input
                  id="cashGiven"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  data-testid="cash-given-input"
                />
              </Field>
              <Field>
                <Label>Monnaie à rendre</Label>
                <Input
                  value={paymentMethod === 'cash' && parsedCashGiven != null ? (Math.max(0, change || 0)).toFixed(2) : '0.00'}
                  readOnly
                  data-testid="change-output"
                />
              </Field>
            </Row>
          )}

          <Actions>
            <Button type="button" onClick={onCancel} data-testid="cancel-finalization">Annuler</Button>
            <Button type="submit" $variant="primary" disabled={!canConfirm} data-testid="confirm-finalization">Valider</Button>
          </Actions>
        </Form>
      </Modal>
    </Backdrop>
  );
};

export default FinalizationScreen;


