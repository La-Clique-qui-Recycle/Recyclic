import React from 'react';
import styled from 'styled-components';
import { Calculator, Package } from 'lucide-react';

const CashRegisterContainer = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ComingSoon = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
`;

function CashRegister() {
  return (
    <CashRegisterContainer>
      <Title>
        <Calculator size={24} />
        Interface Caisse
      </Title>
      <ComingSoon>
        <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h2>En cours de développement</h2>
        <p>L'interface de caisse sera bientôt disponible.</p>
      </ComingSoon>
    </CashRegisterContainer>
  );
}

export default CashRegister;
