import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4433';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
export const getSites = async () => {
  const response = await api.get('/api/v1/sites');
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

export default api;
