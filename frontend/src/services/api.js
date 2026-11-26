import axios from 'axios';

const API_BASE_URL = 'https://transparent-local-governance-budgeting-1.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('civicledger_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred.';
    return Promise.reject(new Error(message));
  }
);

export function getExportUrl(type, fiscalYear) {
  const params = new URLSearchParams({ type });
  if (fiscalYear) params.append('fiscalYear', fiscalYear);
  return `${API_BASE_URL}/reports/export?${params.toString()}`;
}

export function getAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${baseOrigin}${path.startsWith('/') ? path : `/${path}`}`;
}

export default api;
