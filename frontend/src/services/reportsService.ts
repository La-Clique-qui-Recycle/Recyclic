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

  async downloadCashSessionReport(filename: string): Promise<Blob> {
    const response = await ApiClient.client.get<Blob>(
      `/v1/admin/reports/cash-sessions/${filename}`,
      {
        headers: getAuthHeader(),
        responseType: 'blob',
      }
    );
    return response.data;
  },
};

export default reportsService;
