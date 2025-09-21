import React from 'react';
import styled from 'styled-components';
// import { useQuery } from 'react-query';
import { BarChart3, Package, DollarSign, Users } from 'lucide-react';
// import { api } from '../services/api';

const DashboardContainer = styled.div`
  display: grid;
  gap: 2rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-color: #e8f5e8;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2e7d32;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #333;
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
`;

const WelcomeSection = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const WelcomeTitle = styled.h1`
  color: #333;
  margin-bottom: 1rem;
`;

const WelcomeText = styled.p`
  color: #666;
  line-height: 1.6;
`;

function Dashboard() {
  // const { data: healthData } = useQuery('health', api.getHealth);
  
  return (
    <DashboardContainer>
      <WelcomeSection>
        <WelcomeTitle>Bienvenue sur Recyclic</WelcomeTitle>
        <WelcomeText>
          Plateforme de gestion de recyclage intelligente. 
          Gérez vos dépôts, suivez vos ventes et analysez vos performances.
        </WelcomeText>
      </WelcomeSection>
      
      <StatsGrid>
        <StatCard>
          <StatIcon>
            <Package size={24} data-testid="package-icon" />
          </StatIcon>
          <StatContent>
            <StatValue data-testid="stat-depots">0</StatValue>
            <StatLabel>Dépôts aujourd'hui</StatLabel>
          </StatContent>
        </StatCard>
        
        <StatCard>
          <StatIcon>
            <DollarSign size={24} data-testid="dollarsign-icon" />
          </StatIcon>
          <StatContent>
            <StatValue data-testid="stat-ca">0€</StatValue>
            <StatLabel>Chiffre d'affaires</StatLabel>
          </StatContent>
        </StatCard>
        
        <StatCard>
          <StatIcon>
            <Users size={24} data-testid="users-icon" />
          </StatIcon>
          <StatContent>
            <StatValue data-testid="stat-users">0</StatValue>
            <StatLabel>Utilisateurs actifs</StatLabel>
          </StatContent>
        </StatCard>
        
        <StatCard>
          <StatIcon>
            <BarChart3 size={24} data-testid="barchart-icon" />
          </StatIcon>
          <StatContent>
            <StatValue data-testid="stat-recycled">0</StatValue>
            <StatLabel>Appareils recyclés</StatLabel>
          </StatContent>
        </StatCard>
      </StatsGrid>
    </DashboardContainer>
  );
}

export default Dashboard;
