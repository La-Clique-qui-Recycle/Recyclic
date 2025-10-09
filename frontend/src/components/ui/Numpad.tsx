import React from 'react';
import styled from 'styled-components';

const NumpadContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  gap: 1rem;
  padding: 0.5rem;
`;

const DisplayContainer = styled.div`
  background: #f8f9fa;
  border: 3px solid #2c5530;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  flex-shrink: 0; /* Empêche le display de se rétrécir */
  position: relative;
`;

const DisplayValue = styled.div<{ $hasError?: boolean }>`
  font-size: 3rem;
  font-weight: bold;
  color: ${props => props.$hasError ? '#dc3545' : '#2c5530'};
  min-height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  word-break: break-all; /* Gère les longues valeurs */

  @media (max-width: 768px) {
    font-size: 2.5rem;
    min-height: 3rem;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  min-height: 1.25rem;
`;

const DisplayActions = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
`;

const ActionIconButton = styled.button`
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #2c5530;
  background: white;
  color: #2c5530;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  transition: all 0.2s;

  &:hover {
    background: #f0f8f0;
    border-color: #1e3d21;
  }
`;

const KeypadGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  flex: 1;
  min-height: 0; /* Permet au grid de se rétrécir */
  align-content: start; /* Empêche l'étirement vertical */

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const KeyButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  min-height: 64px;
  aspect-ratio: 1; /* Carré pour éviter les débordements */
  border: 3px solid ${props => 
    props.$variant === 'primary' ? '#1e3d21' :
    props.$variant === 'danger' ? '#b71c1c' :
    '#2c5530'
  };
  background: ${props => 
    props.$variant === 'primary' ? '#2c5530' :
    props.$variant === 'danger' ? '#dc3545' :
    'white'
  };
  color: ${props => props.$variant === 'primary' || props.$variant === 'danger' ? 'white' : '#2c5530'};
  border-radius: 12px;
  cursor: pointer;
  font-size: 1.8rem;
  font-weight: bold;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  &:hover {
    border-color: ${props => 
      props.$variant === 'primary' ? '#1e3d21' :
      props.$variant === 'danger' ? '#b71c1c' :
      '#1e3d21'
    };
    background: ${props => 
      props.$variant === 'primary' ? '#1e3d21' :
      props.$variant === 'danger' ? '#b71c1c' :
      '#f0f8f0'
    };
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }

  &:active {
    transform: scale(0.95) translateY(0);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    min-height: 56px;
    aspect-ratio: 1;
    font-size: 1.4rem;
  }
`;

const SpecialKeyButton = styled(KeyButton)`
  font-size: 1.25rem;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

export interface NumpadProps {
  value: string;
  error?: string;
  onDigit: (digit: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onDecimal?: () => void;
  unit?: string;
  showDecimal?: boolean;
  placeholder?: string;
}

/**
 * Numpad Component - Unified numeric keypad for all input types
 * 
 * @param value - Current display value
 * @param error - Error message to display (if any)
 * @param onDigit - Handler for digit button press (0-9)
 * @param onClear - Handler for clear button
 * @param onBackspace - Handler for backspace button
 * @param onDecimal - Handler for decimal point (optional)
 * @param unit - Unit to display after the value (kg, €, etc.)
 * @param showDecimal - Whether to show decimal point button (default: true)
 * @param placeholder - Placeholder when value is empty (default: "0")
 */
export const Numpad: React.FC<NumpadProps> = ({
  value,
  error,
  onDigit,
  onClear,
  onBackspace,
  onDecimal,
  unit = '',
  showDecimal = true,
  placeholder = '0'
}) => {
  const displayValue = value || placeholder;

  return (
    <NumpadContainer data-testid="numpad">
      <DisplayContainer>
        <DisplayActions>
          <ActionIconButton onClick={onBackspace} aria-label="Effacer un caractère" data-testid="numpad-backspace-top">⌫</ActionIconButton>
          <ActionIconButton onClick={onClear} aria-label="Effacer tout" data-testid="numpad-clear-top">C</ActionIconButton>
        </DisplayActions>
        <DisplayValue $hasError={!!error} data-testid="numpad-display">
          {displayValue}{unit ? ` ${unit}` : ''}
        </DisplayValue>
        {error && <ErrorMessage data-testid="numpad-error">{error}</ErrorMessage>}
      </DisplayContainer>

      <KeypadGrid>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <KeyButton
            key={digit}
            onClick={() => onDigit(digit.toString())}
            data-testid={`numpad-${digit}`}
          >
            {digit}
          </KeyButton>
        ))}

        <div />
        <KeyButton
          onClick={() => onDigit('0')}
          data-testid="numpad-0"
        >
          0
        </KeyButton>

        <KeyButton
          onClick={onDecimal}
          disabled={!onDecimal}
          data-testid="numpad-decimal"
        >
          .
        </KeyButton>
      </KeypadGrid>
    </NumpadContainer>
  );
};

export default Numpad;

