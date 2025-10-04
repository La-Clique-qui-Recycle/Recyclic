import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { getReceptionLignes, exportReceptionLignesCSV, getReceptionCategories } from '../../services/api';

// Styled Components
const ReportsContainer = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
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

const FiltersSection = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.06);
`;

const FiltersRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  align-items: end;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 150px;
`;

const FilterLabel = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
`;

const FilterInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  font-size: 0.9rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #1976d2;
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
  }
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  font-size: 0.9rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #1976d2;
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border: 1px solid ${props => props.variant === 'primary' ? '#1976d2' : '#d1d5db'};
  background: ${props => props.variant === 'primary' ? '#1976d2' : '#ffffff'};
  color: ${props => props.variant === 'primary' ? '#ffffff' : '#374151'};
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${props => props.variant === 'primary' ? '#1565c0' : '#f3f4f6'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TableContainer = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.06);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #f9fafb;
`;

const TableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.9rem;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  &:hover {
    background: #f9fafb;
  }
`;

const TableCell = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.9rem;
  color: #374151;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 16px 24px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
`;

const PaginationInfo = styled.div`
  color: #6b7280;
  font-size: 0.9rem;
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-left: auto;
`;

const PaginationButton = styled.button<{ active?: boolean }>`
  padding: 6px 12px;
  border: 1px solid ${props => props.active ? '#1976d2' : '#d1d5db'};
  background: ${props => props.active ? '#1976d2' : '#ffffff'};
  color: ${props => props.active ? '#ffffff' : '#374151'};
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.active ? '#1565c0' : '#f3f4f6'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;
`;

// Types
interface LigneDepot {
  id: string;
  ticket_id: string;
  poste_id: string;
  benevole_username: string;
  dom_category_label: string;
  poids_kg: number;
  destination: string;
  notes?: string;
  created_at: string;
}

interface LigneDepotListResponse {
  lignes: LigneDepot[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface Category {
  id: string;
  label: string;
  slug: string;
}

const ReceptionReports: React.FC = () => {
  // Debounce config (0ms en test pour stabilité des tests, 300ms en usage réel)
  const IS_TEST = typeof import.meta !== 'undefined' && (import.meta as any)?.env?.MODE === 'test'
  const DEBOUNCE_MS = IS_TEST ? 0 : 300
  const debounceTimerRef = useRef<number | null>(null)

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    categoryId: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 50
  });
  const [data, setData] = useState<LigneDepotListResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await getReceptionCategories();
        setCategories(categoriesData);
      } catch (err: any) {
        console.error('Error loading categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Load data when filters or pagination change
  useEffect(() => {
    // Debounce pour limiter les requêtes lors de la saisie des filtres
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    debounceTimerRef.current = window.setTimeout(() => {
      loadData()
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [filters, pagination]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getReceptionLignes(
        pagination.page,
        pagination.perPage,
        filters.startDate || undefined,
        filters.endDate || undefined,
        filters.categoryId || undefined
      );

      setData(response);
    } catch (err: any) {
      console.error('Error loading reception lines:', err);
      setError(err.response?.data?.detail || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handlePerPageChange = (perPage: number) => {
    setPagination(prev => ({ page: 1, perPage }));
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);

      const { blob, filename } = await exportReceptionLignesCSV(
        filters.startDate || undefined,
        filters.endDate || undefined,
        filters.categoryId || undefined
      );

      // Create download link (honor server-provided filename when available)
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      link.download = filename || 'rapport_reception.csv';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exporting CSV:', err);
      setError(err.response?.data?.detail || 'Erreur lors de l\'export CSV');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWeight = (weight: number) => {
    return weight.toLocaleString('fr-FR', { 
      minimumFractionDigits: 1,
      maximumFractionDigits: 3 
    });
  };

  if (loading && !data) {
    return (
      <ReportsContainer>
        <LoadingContainer>Chargement des données...</LoadingContainer>
      </ReportsContainer>
    );
  }

  return (
    <ReportsContainer>
      <Header>
        <Title>Rapports de Réception</Title>
        <Button
          variant="primary"
          onClick={handleExport}
          disabled={exporting}
          aria-label="Exporter les rapports de réception au format CSV"
        >
          {exporting ? 'Export en cours...' : '📊 Exporter CSV'}
        </Button>
      </Header>

      {error && (
        <ErrorContainer>{error}</ErrorContainer>
      )}

      <FiltersSection>
        <FiltersRow>
          <FilterGroup>
            <FilterLabel htmlFor="start-date">Date de début</FilterLabel>
            <FilterInput
              id="start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel htmlFor="end-date">Date de fin</FilterLabel>
            <FilterInput
              id="end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel htmlFor="category">Catégorie</FilterLabel>
            <FilterSelect
              id="category"
              value={filters.categoryId}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
            >
              <option value="">Toutes les catégories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel htmlFor="per-page">Éléments par page</FilterLabel>
            <FilterSelect
              id="per-page"
              value={pagination.perPage}
              onChange={(e) => handlePerPageChange(Number(e.target.value))}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </FilterSelect>
          </FilterGroup>
        </FiltersRow>
      </FiltersSection>

      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Bénévole</TableHeaderCell>
              <TableHeaderCell>Catégorie</TableHeaderCell>
              <TableHeaderCell>Poids (kg)</TableHeaderCell>
              <TableHeaderCell>Destination</TableHeaderCell>
              <TableHeaderCell>Notes</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {data?.lignes.map((ligne) => (
              <TableRow key={ligne.id}>
                <TableCell>{formatDate(ligne.created_at)}</TableCell>
                <TableCell>{ligne.benevole_username}</TableCell>
                <TableCell>{ligne.dom_category_label}</TableCell>
                <TableCell>{formatWeight(ligne.poids_kg)}</TableCell>
                <TableCell>{ligne.destination}</TableCell>
                <TableCell>{ligne.notes || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {data && data.lignes.length === 0 && (
          <EmptyState>
            Aucune donnée trouvée pour les filtres sélectionnés
          </EmptyState>
        )}

        {data && data.total_pages > 1 && (
          <PaginationContainer>
            <PaginationInfo aria-live="polite">
              Affichage de {((pagination.page - 1) * pagination.perPage) + 1} à{' '}
              {Math.min(pagination.page * pagination.perPage, data.total)} sur {data.total} éléments
            </PaginationInfo>
            <PaginationButtons>
              <PaginationButton
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                aria-label="Page précédente"
              >
                Précédent
              </PaginationButton>
              
              {Array.from({ length: Math.min(5, data.total_pages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(data.total_pages - 4, pagination.page - 2)) + i;
                if (pageNum > data.total_pages) return null;
                
                return (
                  <PaginationButton
                    key={pageNum}
                    active={pageNum === pagination.page}
                    onClick={() => handlePageChange(pageNum)}
                    aria-label={`Aller à la page ${pageNum}`}
                  >
                    {pageNum}
                  </PaginationButton>
                );
              })}
              
              <PaginationButton
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === data.total_pages}
                aria-label="Page suivante"
              >
                Suivant
              </PaginationButton>
            </PaginationButtons>
          </PaginationContainer>
        )}
      </TableContainer>
    </ReportsContainer>
  );
};

export default ReceptionReports;
