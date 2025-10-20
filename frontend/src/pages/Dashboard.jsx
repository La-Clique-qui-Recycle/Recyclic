import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { BarChart3, Package, DollarSign, Users, TrendingUp, Scale } from 'lucide-react';
import api, { getCashSessionStats, getReceptionSummary } from '../services/api';

const DashboardContainer = styled.div`
  display: grid;
  gap: 2rem;
`;


const StatsSection = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.2rem;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const StatCard = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
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

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #666;
`;

const ErrorMessage = styled.div`
  background: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #fcc;
  margin: 1rem 0;
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
  const [salesStats, setSalesStats] = useState(null);
  const [receptionStats, setReceptionStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fonction pour charger les statistiques
  const loadStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [salesData, receptionData] = await Promise.all([
        getCashSessionStats(), // Sans paramètres de dates
        getReceptionSummary() // Sans paramètres de dates
      ]);
      
      setSalesStats(salesData);
      setReceptionStats(receptionData);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError('Impossible de charger les statistiques. Vérifiez vos permissions.');
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques au montage
  useEffect(() => {
    loadStats();
  }, []);

  return (
    <DashboardContainer>
      <WelcomeSection>
        <WelcomeTitle>Bienvenue sur Recyclic</WelcomeTitle>
        <WelcomeText>
          Plateforme de gestion de recyclage intelligente. 
          Gérez vos dépôts, suivez vos ventes et analysez vos performances.
        </WelcomeText>
      </WelcomeSection>
      

      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}

      {loading ? (
        <LoadingSpinner>Chargement des statistiques...</LoadingSpinner>
      ) : (
        <>
          {/* Section Ventes (Sorties) */}
          <StatsSection>
            <SectionTitle>Ventes (Sorties)</SectionTitle>
            <StatsGrid>
              <StatCard>
                <StatIcon>
                  <DollarSign size={24} data-testid="sales-revenue-icon" />
                </StatIcon>
                <StatContent>
                  <StatValue data-testid="stat-sales-revenue">
                    {salesStats?.total_sales ? `${Number(salesStats.total_sales).toFixed(2)}€` : '0€'}
                  </StatValue>
                  <StatLabel>Chiffre d'affaires</StatLabel>
                </StatContent>
              </StatCard>
              
              <StatCard>
                <StatIcon>
                  <TrendingUp size={24} data-testid="sales-donations-icon" />
                </StatIcon>
                <StatContent>
                  <StatValue data-testid="stat-sales-donations">
                    {salesStats?.total_donations ? `${Number(salesStats.total_donations).toFixed(2)}€` : '0€'}
                  </StatValue>
                  <StatLabel>Total des dons</StatLabel>
                </StatContent>
              </StatCard>
              
              <StatCard>
                <StatIcon>
                  <Scale size={24} data-testid="sales-weight-icon" />
                </StatIcon>
                <StatContent>
                  <StatValue data-testid="stat-sales-weight">
                    {salesStats?.total_weight_sold ? `${Number(salesStats.total_weight_sold).toFixed(1)} kg` : '0 kg'}
                  </StatValue>
                  <StatLabel>Poids vendu</StatLabel>
                </StatContent>
              </StatCard>
            </StatsGrid>
          </StatsSection>

          {/* Section Réception (Entrées) */}
          <StatsSection>
            <SectionTitle>Réception (Entrées)</SectionTitle>
            <StatsGrid>
              <StatCard>
                <StatIcon>
                  <Scale size={24} data-testid="reception-weight-icon" />
                </StatIcon>
                <StatContent>
                  <StatValue data-testid="stat-reception-weight">
                    {receptionStats?.total_weight ? `${Number(receptionStats.total_weight).toFixed(1)} kg` : '0 kg'}
                  </StatValue>
                  <StatLabel>Poids reçu</StatLabel>
                </StatContent>
              </StatCard>
              
              <StatCard>
                <StatIcon>
                  <Package size={24} data-testid="reception-items-icon" />
                </StatIcon>
                <StatContent>
                  <StatValue data-testid="stat-reception-items">
                    {receptionStats?.total_items || 0}
                  </StatValue>
                  <StatLabel>Articles reçus</StatLabel>
                </StatContent>
              </StatCard>
            </StatsGrid>
          </StatsSection>
        </>
      )}
    </DashboardContainer>
  );
}

export default Dashboard;
