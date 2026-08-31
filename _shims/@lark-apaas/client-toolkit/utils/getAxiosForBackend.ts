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
    // 后端统一错误体为 { error: { message } }。保留该结构，同时补充
    // data.message 兼容现有页面，避免提交失败后只显示“失败”而没有原因。
    if (error?.response?.data?.error?.message && !error.response.data.message) {
      error.response.data.message = error.response.data.error.message;
    }
    if (error?.response?.data?.message) error.message = error.response.data.message;
    if (error?.response?.status === 401 && !String(error?.config?.url || '').includes('/api/auth/login')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('heat_treatment_current_user');
      localStorage.removeItem('currentOrgId');
      localStorage.removeItem('currentOrgCode');
      localStorage.removeItem('currentOrgName');
      (globalThis as { dispatchEvent?: (event: Event) => boolean })
        .dispatchEvent?.(new Event('heat-treatment:auth-invalidated'));
    }
    return Promise.reject(error);
  },
);
