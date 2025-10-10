import api from '../api/axiosClient';

// Health check
export const getHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Users
export const getUsers = async () => {
  const response = await api.get('/v1/users');
  return response.data;
};

export const getUser = async (id) => {
  const response = await api.get(`/v1/users/${id}`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/v1/users', userData);
  return response.data;
};

// Sites
export const getSites = async (params = {}) => {
  const response = await api.get('/v1/sites', { params });
  return response.data;
};

export const getSite = async (id) => {
  const response = await api.get(`/v1/sites/${id}`);
  return response.data;
};

export const createSite = async (siteData) => {
  const response = await api.post('/v1/sites', siteData);
  return response.data;
};

export const updateSite = async (id, siteData) => {
  const response = await api.patch(`/v1/sites/${id}`, siteData);
  return response.data;
};

export const deleteSite = async (id) => {
  await api.delete(`/v1/sites/${id}`);
};

// Check site dependencies before deletion
export const getSiteDependencies = async (id) => {
  try {
    // Check cash registers using this site
    const cashRegistersResponse = await api.get('/v1/cash-registers', {
      params: { site_id: id }
    });
    const cashRegisters = cashRegistersResponse.data;

    // Check cash sessions using this site
    const cashSessionsResponse = await api.get('/v1/cash-sessions', {
      params: { site_id: id }
    });
    const cashSessions = cashSessionsResponse.data;

    return {
      cashRegisters: cashRegisters || [],
      cashSessions: cashSessions || [],
      hasBlockingDependencies: (cashRegisters?.length > 0) || (cashSessions?.length > 0)
    };
  } catch (error) {
    console.error('Error checking site dependencies:', error);
    // If we can't check dependencies, err on the side of caution
    return {
      cashRegisters: [],
      cashSessions: [],
      hasBlockingDependencies: false,
      error: 'Impossible de vérifier les dépendances du site'
    };
  }
};

// Deposits
export const getDeposits = async () => {
  const response = await api.get('/v1/deposits');
  return response.data;
};

export const getDeposit = async (id) => {
  const response = await api.get(`/v1/deposits/${id}`);
  return response.data;
};

export const createDeposit = async (depositData) => {
  const response = await api.post('/v1/deposits', depositData);
  return response.data;
};

// Sales
export const getSales = async () => {
  const response = await api.get('/v1/sales');
  return response.data;
};

export const getSale = async (id) => {
  const response = await api.get(`/v1/sales/${id}`);
  return response.data;
};

export const createSale = async (saleData) => {
  const response = await api.post('/v1/sales', saleData);
  return response.data;
};

// Cash Sessions
export const getCashSessions = async () => {
  const response = await api.get('/v1/cash-sessions');
  return response.data;
};

export const getCashSession = async (id) => {
  const response = await api.get(`/v1/cash-sessions/${id}`);
  return response.data;
};

export const createCashSession = async (sessionData) => {
  const response = await api.post('/v1/cash-sessions', sessionData);
  return response.data;
};

// Cash Registers (Postes de caisse)
export const getCashRegisters = async (params = {}) => {
  const response = await api.get('/v1/cash-registers', { params });
  return response.data;
};

export const getCashRegister = async (id) => {
  const response = await api.get(`/v1/cash-registers/${id}`);
  return response.data;
};

export const createCashRegister = async (data) => {
  const response = await api.post('/v1/cash-registers', data);
  return response.data;
};

export const updateCashRegister = async (id, data) => {
  const response = await api.patch(`/v1/cash-registers/${id}`,
    data
  );
  return response.data;
};

export const deleteCashRegister = async (id) => {
  await api.delete(`/v1/cash-registers/${id}`);
};

// Link Telegram Account
export const linkTelegramAccount = async (linkData) => {
  const response = await api.post('/v1/users/link-telegram', linkData);
  return response.data;
};

// Reception Tickets
export const getReceptionTickets = async (page = 1, perPage = 10) => {
  const response = await api.get('/v1/reception/tickets', {
    params: { page, per_page: perPage }
  });
  return response.data;
};

export const getReceptionTicketDetail = async (ticketId) => {
  const response = await api.get(`/v1/reception/tickets/${ticketId}`);
  return response.data;
};

// Reception Statistics
export const getReceptionSummary = async (startDate, endDate) => {
  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await api.get('/v1/stats/reception/summary', { params });
  return response.data;
};

export const getReceptionByCategory = async (startDate, endDate) => {
  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await api.get('/v1/stats/reception/by-category', { params });
  return response.data;
};

// Reception Reports
export const getReceptionLignes = async (page = 1, perPage = 50, startDate, endDate, categoryId) => {
  const params = { page, per_page: perPage };
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (categoryId) params.category_id = categoryId;

  const response = await api.get('/v1/reception/lignes', { params });
  return response.data;
};

export const exportReceptionLignesCSV = async (startDate, endDate, categoryId) => {
  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (categoryId) params.category_id = categoryId;

  const response = await api.get('/v1/reception/lignes/export-csv', {
    params,
    responseType: 'blob'
  });

  // Essayer d'extraire le filename du Content-Disposition
  let filename = 'rapport_reception.csv';
  const cd = response.headers && (response.headers['content-disposition'] || response.headers['Content-Disposition']);
  if (cd && typeof cd === 'string') {
    const match = cd.match(/filename\*=UTF-8''([^;\n]+)|filename="?([^";\n]+)"?/i);
    const extracted = match ? (match[1] || match[2]) : null;
    if (extracted) {
      try {
        filename = decodeURIComponent(extracted);
      } catch (_) {
        filename = extracted;
      }
    }
  }

  return { blob: response.data, filename };
};

// Reception Categories
export const getReceptionCategories = async () => {
  const response = await api.get('/v1/reception/categories');
  return response.data;
};

export default api;
