import React, { useState, useEffect, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getReceptionSummary, getReceptionByCategory } from '../../services/api';

// Styled Components
const DashboardContainer = styled.div`
  padding: 24px;
  width: 100%;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.8rem;
  color: #1f2937;
`;

const FiltersRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
  align-items: center;
`;

const FilterButton = styled.button<{ active?: boolean }>`
  padding: 8px 16px;
  border: 1px solid ${props => props.active ? '#1976d2' : '#d1d5db'};
  background: ${props => props.active ? '#1976d2' : '#ffffff'};
  color: ${props => props.active ? '#ffffff' : '#374151'};
  border-radius: 6px;
  cursor: pointer;
  font-weight: ${props => props.active ? '600' : '400'};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.active ? '#1565c0' : '#f3f4f6'};
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.06);
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 8px;
`;

const StatValue = styled.div`
  font-size: 2.2rem;
  font-weight: 700;
  color: #1f2937;
`;

const StatUnit = styled.span`
  font-size: 1rem;
  font-weight: 400;
  color: #6b7280;
  margin-left: 4px;
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

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #6b7280;
  font-size: 1.1rem;
`;

const ErrorContainer = styled.div`
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 16px;
  color: #c00;
  margin: 20px 0;
`;

// Error Boundary for Charts
interface ChartErrorBoundaryProps {
  children: ReactNode;
  chartName: string;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ChartErrorBoundary extends Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.chartName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          Erreur dans {this.props.chartName}: {this.state.error?.message || 'Erreur inconnue'}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

// Color palette for charts
const COLORS = ['#1976d2', '#42a5f5', '#64b5f6', '#90caf9', '#bbdefb', '#e3f2fd', '#0d47a1', '#1565c0'];

// Date range presets
type DateRangePreset = 'today' | 'week' | 'month' | 'year' | 'custom';

interface SummaryStats {
  total_weight: number;
  total_items: number;
  unique_categories: number;
}

interface CategoryStat {
  category_name: string;
  total_weight: number;
  total_items: number;
}

const ReceptionDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRangePreset>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Version: v2 - Fixed tooltip formatter bug

  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);

  // Calculate date range based on preset
  const getDateRange = (preset: DateRangePreset): { start: string; end: string } => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start = end;

    switch (preset) {
      case 'today':
        start = end;
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        start = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        start = monthAgo.toISOString().split('T')[0];
        break;
      case 'year':
        const yearAgo = new Date(today);
        yearAgo.setFullYear(today.getFullYear() - 1);
        start = yearAgo.toISOString().split('T')[0];
        break;
      case 'custom':
        return { start: startDate, end: endDate };
    }

    return { start, end };
  };

  // Fetch data - Memoized to prevent infinite loop
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { start, end } = getDateRange(dateRange);

      // Validate date range for custom dates
      if (dateRange === 'custom' && start && end && start > end) {
        setError('La date de début doit être antérieure à la date de fin');
        setLoading(false);
        return;
      }

      const [summary, categories] = await Promise.all([
        getReceptionSummary(start, end),
        getReceptionByCategory(start, end)
      ]);

      setSummaryStats(summary);
      setCategoryStats(categories);
    } catch (err: any) {
      console.error('Error fetching reception stats:', err);
      // User-friendly error messages
      const errorMessage = err.response?.status === 400
        ? err.response?.data?.detail || 'Paramètres de date invalides'
        : err.response?.status === 403
        ? 'Vous n\'avez pas les permissions nécessaires'
        : 'Erreur lors du chargement des statistiques. Veuillez réessayer.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dateRange, startDate, endDate]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingContainer>Chargement des statistiques...</LoadingContainer>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <Header>
          <Title>Tableau de Bord des Réceptions</Title>
        </Header>
        <ErrorContainer>{error}</ErrorContainer>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>Tableau de Bord des Réceptions (v2)</Title>
      </Header>

      {/* Date Range Filters */}
      <FiltersRow role="group" aria-label="Filtres de période">
        <FilterButton
          active={dateRange === 'today'}
          onClick={() => handlePresetChange('today')}
          aria-label="Afficher les statistiques d'aujourd'hui"
          aria-pressed={dateRange === 'today'}
        >
          Aujourd'hui
        </FilterButton>
        <FilterButton
          active={dateRange === 'week'}
          onClick={() => handlePresetChange('week')}
          aria-label="Afficher les statistiques de cette semaine"
          aria-pressed={dateRange === 'week'}
        >
          Cette semaine
        </FilterButton>
        <FilterButton
          active={dateRange === 'month'}
          onClick={() => handlePresetChange('month')}
          aria-label="Afficher les statistiques de ce mois-ci"
          aria-pressed={dateRange === 'month'}
        >
          Ce mois-ci
        </FilterButton>
        <FilterButton
          active={dateRange === 'year'}
          onClick={() => handlePresetChange('year')}
          aria-label="Afficher les statistiques de cette année"
          aria-pressed={dateRange === 'year'}
        >
          Cette année
        </FilterButton>

        <DateInput
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Date début"
          aria-label="Date de début"
        />
        <DateInput
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="Date fin"
          aria-label="Date de fin"
        />
        <FilterButton
          active={dateRange === 'custom'}
          onClick={handleCustomDateChange}
          disabled={!startDate || !endDate}
          aria-label="Appliquer la plage de dates personnalisée"
        >
          Appliquer dates
        </FilterButton>
      </FiltersRow>

      {/* KPI Stats Cards */}
      {summaryStats && (
        <StatsGrid>
          <StatCard>
            <StatLabel>Poids Total</StatLabel>
            <StatValue>
              {summaryStats.total_weight.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}
              <StatUnit>kg</StatUnit>
            </StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>Nombre d'Articles</StatLabel>
            <StatValue>{summaryStats.total_items.toLocaleString('fr-FR')}</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>Catégories Uniques</StatLabel>
            <StatValue>{summaryStats.unique_categories}</StatValue>
          </StatCard>
        </StatsGrid>
      )}

      {/* Bar Chart - Weight by Category */}
      {categoryStats.length > 0 && (
        <ChartSection>
          <ChartTitle>Répartition du Poids par Catégorie</ChartTitle>
          <ChartErrorBoundary chartName="le graphique en barres">
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
          </ChartErrorBoundary>
        </ChartSection>
      )}

      {/* Pie Chart - Items by Category */}
      {categoryStats.length > 0 && (
        <ChartSection>
          <ChartTitle>Répartition des Articles par Catégorie</ChartTitle>
          <ChartErrorBoundary chartName="le graphique circulaire">
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
          </ChartErrorBoundary>
        </ChartSection>
      )}

      {categoryStats.length === 0 && !loading && (
        <ChartSection>
          <p style={{ textAlign: 'center', color: '#6b7280' }}>
            Aucune donnée disponible pour la période sélectionnée
          </p>
        </ChartSection>
      )}
    </DashboardContainer>
  );
};

export default ReceptionDashboard;
