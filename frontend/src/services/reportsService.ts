import ApiClient from '../generated/api';
import { getAuthHeader } from './authService';

export interface CashSessionReport {
  filename: string;
  size_bytes: number;
  modified_at: string;
  download_url: string;
}

export interface CashSessionReportList {
  reports: CashSessionReport[];
  total: number;
}

export const reportsService = {
  async listCashSessionReports(): Promise<CashSessionReportList> {
    const response = await ApiClient.client.get<CashSessionReportList>(
      '/v1/admin/reports/cash-sessions',
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  async downloadCashSessionReport(filenameOrUrl: string): Promise<Blob> {
    // Si c'est une URL complète (avec token), l'utiliser directement
    // Sinon, utiliser le filename (pour compatibilité)
    const url = filenameOrUrl.startsWith('/v1/') || filenameOrUrl.startsWith('http')
      ? filenameOrUrl
      : `/v1/admin/reports/cash-sessions/${filenameOrUrl}`;
    
    const response = await ApiClient.client.get<Blob>(
      url,
      {
        headers: getAuthHeader(),
        responseType: 'blob',
      }
    );
    return response.data;
  },
};

export default reportsService;
