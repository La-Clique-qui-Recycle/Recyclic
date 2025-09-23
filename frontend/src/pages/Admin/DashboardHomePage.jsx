import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ChevronRight } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { ADMIN_QUICK_ACTIONS } from '../../config/adminRoutes';

const PageContainer = styled.div`
  max-width: 1000px;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  color: #1f2937;
  font-weight: 700;
`;

const PageSubtitle = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 1.1rem;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const QuickActionCard = styled.button`
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 100px;

  &:hover {
    border-color: #2e7d32;
    box-shadow: 0 4px 12px rgba(46, 125, 50, 0.1);
    transform: translateY(-2px);
  }

  &:focus {
    outline: none;
    border-color: #2e7d32;
    box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
  }
`;

const CardContent = styled.div`
  flex: 1;
`;

const CardIcon = styled.div`
  color: #2e7d32;
  margin-bottom: 0.75rem;
`;

const CardTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  color: #1f2937;
  font-weight: 600;
`;

const CardDescription = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.4;
`;

const CardArrow = styled.div`
  color: #6b7280;
  transition: color 0.2s ease;

  ${QuickActionCard}:hover & {
    color: #2e7d32;
  }
`;

const StatsSection = styled.div`
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
`;

const SectionTitle = styled.h2`
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
  color: #1f2937;
  font-weight: 600;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  border: 1px solid #e5e7eb;
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: #2e7d32;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
`;

const DashboardHomePage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const dashboardData = await dashboardService.getDashboardData();
        setStats(dashboardData.stats);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        setError('Impossible de charger les statistiques');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle id="dashboard-heading">Tableau de Bord</PageTitle>
        <PageSubtitle aria-describedby="dashboard-heading">
          Bienvenue dans l'espace d'administration de Recyclic.
          Gérez facilement votre système depuis ce tableau de bord centralisé.
        </PageSubtitle>
      </PageHeader>

      <CardsGrid role="list" aria-label="Actions rapides d'administration">
        {ADMIN_QUICK_ACTIONS.map((action) => (
          <QuickActionCard
            key={action.path}
            onClick={() => handleCardClick(action.path)}
            role="listitem"
            aria-label={`Accéder à ${action.title}: ${action.description}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(action.path);
              }
            }}
          >
            <CardContent>
              <CardIcon>
                <action.icon size={32} aria-hidden="true" />
              </CardIcon>
              <CardTitle>{action.title}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardContent>
            <CardArrow>
              <ChevronRight size={20} aria-hidden="true" />
            </CardArrow>
          </QuickActionCard>
        ))}
      </CardsGrid>

      <StatsSection>
        <SectionTitle id="stats-heading">Aperçu rapide</SectionTitle>
        {error && (
          <div
            role="alert"
            aria-describedby="stats-heading"
            style={{
              color: '#dc2626',
              padding: '1rem',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid #fecaca'
            }}
          >
            {error}
          </div>
        )}
        <StatsGrid role="list" aria-labelledby="stats-heading" aria-live="polite">
          <StatCard role="listitem">
            <StatValue aria-label={`Sessions totales: ${loading ? 'Chargement en cours' : stats ? stats.totalSessions : 'Données non disponibles'}`}>
              {loading ? '...' : stats ? stats.totalSessions : '--'}
            </StatValue>
            <StatLabel>Sessions totales</StatLabel>
          </StatCard>
          <StatCard role="listitem">
            <StatValue aria-label={`Sessions ouvertes: ${loading ? 'Chargement en cours' : stats ? stats.openSessions : 'Données non disponibles'}`}>
              {loading ? '...' : stats ? stats.openSessions : '--'}
            </StatValue>
            <StatLabel>Sessions ouvertes</StatLabel>
          </StatCard>
          <StatCard role="listitem">
            <StatValue aria-label={`Chiffre d'affaires: ${loading ? 'Chargement en cours' : stats ? stats.totalSales.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : 'Données non disponibles'}`}>
              {loading ? '...' : stats ? `${stats.totalSales.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}` : '--'}
            </StatValue>
            <StatLabel>Chiffre d'affaires</StatLabel>
          </StatCard>
          <StatCard role="listitem">
            <StatValue aria-label={`Articles vendus: ${loading ? 'Chargement en cours' : stats ? stats.totalItems : 'Données non disponibles'}`}>
              {loading ? '...' : stats ? stats.totalItems : '--'}
            </StatValue>
            <StatLabel>Articles vendus</StatLabel>
          </StatCard>
        </StatsGrid>
      </StatsSection>
    </PageContainer>
  );
};

export default DashboardHomePage;