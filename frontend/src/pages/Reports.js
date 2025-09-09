import React from 'react';
import styled from 'styled-components';
import { BarChart3 } from 'lucide-react';

const ReportsContainer = styled.div`
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

function Reports() {
  return (
    <ReportsContainer>
      <Title>
        <BarChart3 size={24} />
        Rapports et Statistiques
      </Title>
      <ComingSoon>
        <BarChart3 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h2>En cours de développement</h2>
        <p>Les rapports et statistiques seront bientôt disponibles.</p>
      </ComingSoon>
    </ReportsContainer>
  );
}

export default Reports;
