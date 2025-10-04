import React from 'react';
import styled from 'styled-components';

const KeypadContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
  max-width: min(400px, 100%);
  margin: 0 auto;

  @media (max-width: 480px) {
    max-width: 100%;
    gap: 8px;
  }
`;

const KeyButton = styled.button`
  padding: 14px;
  font-size: 22px;
  font-weight: bold;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 55px;
  width: 100%;

  @media (max-width: 480px) {
    padding: 10px;
    font-size: 20px;
    min-height: 50px;
  }

  @media (max-width: 380px) {
    padding: 8px;
    font-size: 18px;
    min-height: 45px;
  }

  &:hover {
    background: #f5f5f5;
    border-color: #2e7d32;
  }

  &:active {
    background: #e8f5e8;
    transform: scale(0.95);
  }

  &.zero {
    grid-column: span 2;
  }

  &.action {
    background: #2e7d32;
    color: white;
    border-color: #2e7d32;

    &:hover {
      background: #1b5e20;
    }
  }
`;

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onClear: () => void;
  onBackspace: () => void;
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({ onKeyPress, onClear, onBackspace }) => {
  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '0', '.', 'C'
  ];

  const handleKeyClick = (key: string) => {
    if (key === 'C') {
      onClear();
    } else {
      onKeyPress(key);
    }
  };

  return (
    <KeypadContainer role="group" aria-label="Pavé numérique de saisie du poids">
      {keys.map((key) => (
        <KeyButton
          key={key}
          className={key === '0' ? 'zero' : key === 'C' ? 'action' : ''}
          onClick={() => handleKeyClick(key)}
          aria-label={
            key === 'C' 
              ? 'Effacer la saisie' 
              : key === '.' 
              ? 'Point décimal' 
              : `Entrer le chiffre ${key}`
          }
        >
          {key}
        </KeyButton>
      ))}
      <KeyButton 
        className="action" 
        onClick={onBackspace}
        aria-label="Effacer le dernier chiffre"
      >
        ⌫
      </KeyButton>
    </KeypadContainer>
  );
};

export default NumericKeypad;
