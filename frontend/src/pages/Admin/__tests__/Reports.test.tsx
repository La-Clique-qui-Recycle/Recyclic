import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import AdminReports from '../Reports';
import { reportsService } from '../../../services/reportsService';

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
        Download: (props: React.SVGProps<SVGSVGElement>) => <span data-testid="download-icon" {...props} />,
    RefreshCcw: (props: React.SVGProps<SVGSVGElement>) => <span data-testid="refresh-icon" {...props} />,
  };
});

vi.mock('../../../services/reportsService', () => ({
  reportsService: {
    listCashSessionReports: vi.fn(),
    downloadCashSessionReport: vi.fn(),
  },
}));

const mockReports = {
  total: 2,
  reports: [
    {
      filename: 'cash_session_1.csv',
      size_bytes: 2048,
      modified_at: '2025-09-20T10:15:00Z',
      download_url: '/v1/admin/reports/cash-sessions/cash_session_1.csv?token=abc',
    },
    {
      filename: 'cash_session_2.csv',
      size_bytes: 8192,
      modified_at: '2025-09-20T12:45:00Z',
      download_url: '/v1/admin/reports/cash-sessions/cash_session_2.csv?token=xyz',
    },
  ],
};

const createObjectURLSpy = vi.fn(() => 'blob:url');
const revokeObjectURLSpy = vi.fn();

beforeAll(() => {
  global.URL.createObjectURL = createObjectURLSpy as any;
  global.URL.revokeObjectURL = revokeObjectURLSpy as any;
});

beforeEach(() => {
  createObjectURLSpy.mockClear();
  revokeObjectURLSpy.mockClear();
});

describe('AdminReports page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche un indicateur de chargement initial', () => {
    (reportsService.listCashSessionReports as any).mockImplementation(() => new Promise(() => {}));

    render(<AdminReports />);

    expect(screen.getByText('Chargement des rapports...')).toBeInTheDocument();
  });

  it('affiche la liste des rapports', async () => {
    (reportsService.listCashSessionReports as any).mockResolvedValue(mockReports);

    render(<AdminReports />);

    await waitFor(() => {
      expect(screen.getByText('Rapports de sessions de caisse')).toBeInTheDocument();
    });

    expect(screen.getByText('cash_session_1.csv')).toBeInTheDocument();
    expect(screen.getByText('2.0 ko')).toBeInTheDocument();
    // Use specific test IDs for download buttons
    expect(screen.getAllByTestId('download-report-button')).toHaveLength(2);
  });

  it('affiche un état vide quand aucun rapport', async () => {
    (reportsService.listCashSessionReports as any).mockResolvedValue({ total: 0, reports: [] });

    render(<AdminReports />);

    await waitFor(() => {
      expect(screen.getByText(/Aucun rapport n'a encore été généré/)).toBeInTheDocument();
    });
  });

  it('affiche un message d\'erreur en cas d\'échec', async () => {
    (reportsService.listCashSessionReports as any).mockRejectedValue(new Error('Impossible de charger'));

    render(<AdminReports />);

    await waitFor(() => {
      expect(screen.getByText('Impossible de charger')).toBeInTheDocument();
    });
  });

  it('permet de télécharger un rapport', async () => {
    (reportsService.listCashSessionReports as any).mockResolvedValue(mockReports);
    (reportsService.downloadCashSessionReport as any).mockResolvedValue(new Blob(['content'], { type: 'text/csv' }));

    render(<AdminReports />);

    await waitFor(() => {
      expect(screen.getByText('cash_session_1.csv')).toBeInTheDocument();
    });

    const downloadButton = screen.getAllByTestId('download-report-button')[0];
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(reportsService.downloadCashSessionReport).toHaveBeenCalledWith('/v1/admin/reports/cash-sessions/cash_session_1.csv?token=abc');
    });
  });
});
