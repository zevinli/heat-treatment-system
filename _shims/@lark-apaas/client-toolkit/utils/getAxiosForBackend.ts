import axios from 'axios';

export const axiosForBackend = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

axiosForBackend.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  const orgCode = localStorage.getItem('currentOrgCode');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (orgCode) config.headers['X-Organization-Code'] = orgCode;
  return config;
});

axiosForBackend.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401 && !String(error?.config?.url || '').includes('/api/auth/login')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('heat_treatment_current_user');
    }
    return Promise.reject(error);
  },
);
