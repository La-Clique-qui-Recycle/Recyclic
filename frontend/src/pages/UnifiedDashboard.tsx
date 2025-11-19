import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Package, DollarSign, Scale, TrendingUp, User } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { getCashSessionStats, getReceptionSummary, getReceptionByCategory } from '../services/api';

const DashboardContainer = styled.div`
  display: grid;
  gap: 2rem;
`;

const WelcomeSection = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
`;

const WelcomeContent = styled.div`
  flex: 1;
  min-width: 300px;
`;

const WelcomeTitle = styled.h1`
  color: #333;
  margin-bottom: 1rem;
`;

const WelcomeText = styled.p`
  color: #666;
  line-height: 1.6;
`;

const PersonalDashboardLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #374151;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  align-self: center;

  &:hover {
    background: #e5e7eb;
    border-color: #d1d5db;
  }

  svg {
    flex-shrink: 0;
  }
`;

const FilterSection = styled.div`
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
`;

const FiltersRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  padding: 8px 16px;
  border: 1px solid ${props => props.$active ? '#1976d2' : '#d1d5db'};
  background: ${props => props.$active ? '#1976d2' : '#ffffff'};
  color: ${props => props.$active ? '#ffffff' : '#374151'};
  border-radius: 6px;
  cursor: pointer;
  font-weight: ${props => props.$active ? '600' : '400'};
  transition: all 0.2s ease;
  font-size: 0.9rem;

  &:hover:not(:disabled) {
    background: ${props => props.$active ? '#1565c0' : '#f3f4f6'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DateInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  font-size: 0.9rem;
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

const ChartSection = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 28px;
  margin-bottom: 32px;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.06);
`;

const ChartTitle = styled.h2`
  margin: 0 0 24px 0;
  font-size: 1.3rem;
  color: #1f2937;
`;

// Color palette for charts
const COLORS = ['#1976d2', '#42a5f5', '#64b5f6', '#90caf9', '#bbdefb', '#e3f2fd', '#0d47a1', '#1565c0'];

// Date range presets
type DateRangePreset = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

interface CategoryStat {
  category_name: string;
  total_weight: number;
  total_items: number;
}

function UnifiedDashboard() {
  const [salesStats, setSalesStats] = useState<any>(null);
  const [receptionStats, setReceptionStats] = useState<any>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date filter state - Default to 'all' to show all data
  const [dateRange, setDateRange] = useState<DateRangePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const currentUser = useAuthStore((state) => state.currentUser);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  // Calculate date range based on preset
  const getDateRange = (preset: DateRangePreset): { start: string | undefined; end: string | undefined } => {
    const today = new Date();
    let end = new Date(today);
    end.setHours(23, 59, 59, 999); // Important: définir l'heure à la fin de la journée

    let start = new Date(today);
    start.setHours(0, 0, 0, 0); // Important: définir l'heure au début de la journée

    switch (preset) {
      case 'all':
        return { start: undefined, end: undefined };
      case 'today':
        // 'start' et 'end' sont déjà corrects
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
      case 'custom':
        // La logique custom doit retourner des ISOString
        const customStart = startDate ? new Date(startDate) : undefined;
        if (customStart) customStart.setHours(0, 0, 0, 0);
        const customEnd = endDate ? new Date(endDate) : undefined;
        if (customEnd) customEnd.setHours(23, 59, 59, 999);
        return { start: customStart?.toISOString(), end: customEnd?.toISOString() };
    }

    // Retourner les dates au format ISO complet (corrigé pour b34-p19)
    return { start: start.toISOString(), end: end.toISOString() };
  };

  // Fonction pour charger les statistiques avec filtres
  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { start, end } = getDateRange(dateRange);

      // Validate date range for custom dates
      if (dateRange === 'custom' && start && end && start > end) {
        setError('La date de début doit être antérieure à la date de fin');
        setLoading(false);
        return;
      }

      const promises: Promise<any>[] = [
        getCashSessionStats(start, end),
        getReceptionSummary(start, end),
        getReceptionByCategory(start, end)
      ];

      const results = await Promise.all(promises);

      setSalesStats(results[0]);
      setReceptionStats(results[1]);
      setCategoryStats(results[2] || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des statistiques:', err);

      // Gérer spécifiquement les erreurs 403 (permissions insuffisantes)
      if (err?.response?.status === 403) {
        setError('Vous n\'avez pas les permissions nécessaires pour accéder aux statistiques globales. Utilisez le Dashboard Personnel pour vos informations.');
      } else {
        const errorDetail = err?.response?.data?.detail || err?.message || 'Erreur inconnue';
        setError(`Impossible de charger les statistiques: ${errorDetail}`);
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange, startDate, endDate, isAdmin]);

  // Charger les statistiques au montage et quand les filtres changent
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Handle preset change
  const handlePresetChange = (preset: DateRangePreset) => {
    setDateRange(preset);
  };

  // Handle custom date change
  const handleCustomDateChange = () => {
    if (startDate && endDate) {
      // Client-side validation
      if (startDate > endDate) {
        setError('La date de début doit être antérieure à la date de fin');
        return;
      }
      setDateRange('custom');
    }
  };

  return (
    <DashboardContainer>
      <WelcomeSection>
        <WelcomeContent>
          <WelcomeTitle>
            Bienvenue sur RecyClique{currentUser ? `, ${currentUser.first_name || currentUser.username}` : ''}
          </WelcomeTitle>
          <WelcomeText>
            Plateforme de gestion de recyclage intelligente.
            Gérez vos dépôts, suivez vos ventes et analysez vos performances.
          </WelcomeText>
        </WelcomeContent>
        <PersonalDashboardLink to="/dashboard/benevole" data-testid="personal-dashboard-link">
          <User size={18} />
          <span>Dashboard personnel</span>
        </PersonalDashboardLink>
      </WelcomeSection>

      {/* Date Filter Section */}
      <FilterSection>
        <FiltersRow role="group" aria-label="Filtres de période">
          <FilterButton
            $active={dateRange === 'all'}
            onClick={() => handlePresetChange('all')}
            aria-label="Afficher toutes les statistiques"
            aria-pressed={dateRange === 'all'}
            data-testid="filter-all"
          >
            Tout
          </FilterButton>
          <FilterButton
            $active={dateRange === 'today'}
            onClick={() => handlePresetChange('today')}
            aria-label="Afficher les statistiques d'aujourd'hui"
            aria-pressed={dateRange === 'today'}
            data-testid="filter-today"
          >
            Aujourd'hui
          </FilterButton>
          <FilterButton
            $active={dateRange === 'week'}
            onClick={() => handlePresetChange('week')}
            aria-label="Afficher les statistiques de cette semaine"
            aria-pressed={dateRange === 'week'}
            data-testid="filter-week"
          >
            Cette semaine
          </FilterButton>
          <FilterButton
            $active={dateRange === 'month'}
            onClick={() => handlePresetChange('month')}
            aria-label="Afficher les statistiques de ce mois-ci"
            aria-pressed={dateRange === 'month'}
            data-testid="filter-month"
          >
            Ce mois-ci
          </FilterButton>
          <FilterButton
            $active={dateRange === 'year'}
            onClick={() => handlePresetChange('year')}
            aria-label="Afficher les statistiques de cette année"
            aria-pressed={dateRange === 'year'}
            data-testid="filter-year"
          >
            Cette année
          </FilterButton>

          <DateInput
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Date début"
            aria-label="Date de début"
            data-testid="filter-start-date"
          />
          <DateInput
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Date fin"
            aria-label="Date de fin"
            data-testid="filter-end-date"
          />
          <FilterButton
            $active={dateRange === 'custom'}
            onClick={handleCustomDateChange}
            disabled={!startDate || !endDate}
            aria-label="Appliquer la plage de dates personnalisée"
            data-testid="filter-apply-custom"
          >
            Appliquer dates
          </FilterButton>
        </FiltersRow>
      </FilterSection>

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

          {/* Section Analyse Détaillée - Visible pour tous les utilisateurs */}
          {categoryStats.length > 0 && (
            <>
              {/* Bar Chart - Weight by Category */}
              <ChartSection>
                <ChartTitle>Analyse Détaillée de la Réception - Poids par Catégorie</ChartTitle>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={categoryStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="category_name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis label={{ value: 'Poids (kg)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      formatter={(value: any) => {
                        const numValue = typeof value === 'number' ? value : parseFloat(value);
                        return [`${numValue.toFixed(1)} kg`, 'Poids'];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="total_weight" fill="#1976d2" name="Poids (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartSection>

              {/* Pie Chart - Items by Category */}
              <ChartSection>
                <ChartTitle>Analyse Détaillée de la Réception - Articles par Catégorie</ChartTitle>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      dataKey="total_items"
                      nameKey="category_name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartSection>
            </>
          )}

          {categoryStats.length === 0 && !loading && (
            <ChartSection>
              <p style={{ textAlign: 'center', color: '#6b7280' }}>
                Aucune donnée de catégorie disponible pour la période sélectionnée
              </p>
            </ChartSection>
          )}
        </>
      )}
    </DashboardContainer>
  );
}

export default UnifiedDashboard;
