import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Health check
export const getHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Users
export const getUsers = async () => {
  const response = await api.get('/api/v1/users');
  return response.data;
};

export const getUser = async (id) => {
  const response = await api.get(`/api/v1/users/${id}`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/api/v1/users', userData);
  return response.data;
};

// Sites
export const getSites = async (params = {}) => {
  const response = await api.get('/api/v1/sites', { params });
  return response.data;
};

export const getSite = async (id) => {
  const response = await api.get(`/api/v1/sites/${id}`);
  return response.data;
};

export const createSite = async (siteData) => {
  const response = await api.post('/api/v1/sites', siteData);
  return response.data;
};

export const updateSite = async (id, siteData) => {
  const response = await api.patch(`/api/v1/sites/${id}`, siteData);
  return response.data;
};

export const deleteSite = async (id) => {
  await api.delete(`/api/v1/sites/${id}`);
};

// Check site dependencies before deletion
export const getSiteDependencies = async (id) => {
  try {
    // Check cash registers using this site
    const cashRegistersResponse = await api.get('/api/v1/cash-registers', {
      params: { site_id: id }
    });
    const cashRegisters = cashRegistersResponse.data;

    // Check cash sessions using this site
    const cashSessionsResponse = await api.get('/api/v1/cash-sessions', {
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
  const response = await api.get('/api/v1/deposits');
  return response.data;
};

export const getDeposit = async (id) => {
  const response = await api.get(`/api/v1/deposits/${id}`);
  return response.data;
};

export const createDeposit = async (depositData) => {
  const response = await api.post('/api/v1/deposits', depositData);
  return response.data;
};

// Sales
export const getSales = async () => {
  const response = await api.get('/api/v1/sales');
  return response.data;
};

export const getSale = async (id) => {
  const response = await api.get(`/api/v1/sales/${id}`);
  return response.data;
};

export const createSale = async (saleData) => {
  const response = await api.post('/api/v1/sales', saleData);
  return response.data;
};

// Cash Sessions
export const getCashSessions = async () => {
  const response = await api.get('/api/v1/cash-sessions');
  return response.data;
};

export const getCashSession = async (id) => {
  const response = await api.get(`/api/v1/cash-sessions/${id}`);
  return response.data;
};

export const createCashSession = async (sessionData) => {
  const response = await api.post('/api/v1/cash-sessions', sessionData);
  return response.data;
};

// Cash Registers (Postes de caisse)
export const getCashRegisters = async (params = {}) => {
  const response = await api.get('/api/v1/cash-registers', { params });
  return response.data;
};

export const getCashRegister = async (id) => {
  const response = await api.get(`/api/v1/cash-registers/${id}`);
  return response.data;
};

export const createCashRegister = async (data) => {
  const response = await api.post('/api/v1/cash-registers', data);
  return response.data;
};

export const updateCashRegister = async (id, data) => {
  const response = await api.patch(`/api/v1/cash-registers/${id}`,
    data
  );
  return response.data;
};

export const deleteCashRegister = async (id) => {
  await api.delete(`/api/v1/cash-registers/${id}`);
};

// Link Telegram Account
export const linkTelegramAccount = async (linkData) => {
  const response = await api.post('/api/v1/users/link-telegram', linkData);
  return response.data;
};

export default api;
