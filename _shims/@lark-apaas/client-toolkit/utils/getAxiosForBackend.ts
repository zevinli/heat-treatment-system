import axios from 'axios';

export const axiosForBackend = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

axiosForBackend.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  const orgCode = localStorage.getItem('currentOrgCode');
  const userRole = localStorage.getItem('userRole');
  if (userId) config.headers['X-User-Id'] = userId;
  if (userName) config.headers['X-User-Name'] = encodeURIComponent(userName);
  if (orgCode) config.headers['X-Organization-Code'] = orgCode;
  if (userRole) config.headers['X-User-Role'] = userRole;
  return config;
});
