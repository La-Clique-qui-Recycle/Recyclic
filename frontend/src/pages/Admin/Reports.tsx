import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Download, RefreshCcw } from 'lucide-react';

import { reportsService, CashSessionReport } from '../../services/reportsService';

const PageContainer = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 2rem;
  color: #1b5e20;
  font-weight: 600;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'ghost'; }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background-color 0.2s ease;
  background: ${props => props.$variant === 'ghost' ? 'transparent' : '#2e7d32'};
  color: ${props => props.$variant === 'ghost' ? '#2e7d32' : '#ffffff'};
  border: ${props => props.$variant === 'ghost' ? '1px solid #2e7d32' : 'none'};

  &:hover {
    background: ${props => props.$variant === 'ghost' ? 'rgba(46, 125, 50, 0.1)' : '#1b5e20'};
  }
`;

const TableContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const Table = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr 2fr 180px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: contents;
  background: #f5f5f5;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  color: #666;
`;

const HeaderCell = styled.div`
  padding: 16px 20px;
  border-bottom: 2px solid #e0e0e0;
`;

const TableRow = styled.div`
  display: contents;
  transition: background-color 0.15s ease;

  &:hover div {
    background: #f8f9fa;
  }

  &:nth-child(even) div {
    background: #fafafa;
  }

  &:nth-child(even):hover div {
    background: #f0f2f5;
  }
`;

const Cell = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.95rem;
  color: #333;
  display: flex;
  align-items: center;
`;

const EmptyState = styled.div`
  padding: 48px;
  text-align: center;
  color: #666;
  background: #fafafa;
  border-radius: 8px;
  border: 1px dashed #d0d0d0;
`;

const ErrorState = styled.div`
  padding: 16px;
  border: 1px solid #e53935;
  background: #ffebee;
  color: #b71c1c;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const LoadingState = styled.div`
  padding: 48px;
  text-align: center;
  color: #777;
`;

const DownloadButton = styled(Button)`
  font-size: 0.9rem;
  padding: 8px 16px;
  justify-content: center;
  min-width: 140px;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const FilenameCell = styled(Cell)`
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 0.9rem;
  color: #2e7d32;
  font-weight: 500;
`;

function formatSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} o`;
  }
  const kilobytes = sizeBytes / 1024;
  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} ko`;
  }
  const megabytes = kilobytes / 1024;
  return `${megabytes.toFixed(2)} Mo`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('fr-FR');
}

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<CashSessionReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await reportsService.listCashSessionReports();
      setReports(payload.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les rapports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDownload = async (report: CashSessionReport) => {
    try {
      setDownloading(report.filename);
      // Utiliser directement l'URL complète avec le token
      const blob = await reportsService.downloadCashSessionReport(report.download_url);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = report.filename;
      document.body.appendChild(link);

      try {
        if (typeof link.click === 'function') {
          link.click();
        } else {
          link.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      } catch (navigationError) {
        if (!(navigationError instanceof Error) || !navigationError.message?.includes('navigation')) {
          throw navigationError;
        }
      } finally {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Le téléchargement du rapport a échoué.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <PageContainer>
      <Header>
        <Title>Rapports de Sessions de Caisse</Title>
        <HeaderActions>
          <Button $variant="ghost" onClick={loadReports} disabled={loading}>
            <RefreshCcw size={16} /> Rafraîchir
          </Button>
        </HeaderActions>
      </Header>

      {error && (
        <ErrorState>
          {error}
        </ErrorState>
      )}

      {loading ? (
        <LoadingState>Chargement des rapports...</LoadingState>
      ) : reports.length === 0 ? (
        <EmptyState>
          Aucun rapport n'a encore été généré.
          <br />
          <span style={{ fontSize: '0.9rem', color: '#999', marginTop: '8px', display: 'block' }}>
            Les rapports sont générés automatiquement lors de la fermeture d'une session de caisse.
          </span>
        </EmptyState>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <HeaderCell>Nom du fichier</HeaderCell>
              <HeaderCell>Taille</HeaderCell>
              <HeaderCell>Généré le</HeaderCell>
              <HeaderCell>Actions</HeaderCell>
            </TableHeader>
            {reports.map((report) => (
              <TableRow key={report.filename}>
                <FilenameCell>{report.filename}</FilenameCell>
                <Cell>{formatSize(report.size_bytes)}</Cell>
                <Cell>{formatDate(report.modified_at)}</Cell>
                <Cell>
                  <DownloadButton
                    onClick={() => handleDownload(report)}
                    disabled={downloading === report.filename}
                    data-testid="download-report-button"
                  >
                    <Download size={16} /> {downloading === report.filename ? 'Téléchargement...' : 'Télécharger'}
                  </DownloadButton>
                </Cell>
              </TableRow>
            ))}
          </Table>
        </TableContainer>
      )}
    </PageContainer>
  );
};

export default AdminReports;

