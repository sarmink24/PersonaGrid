import axios from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
http.interceptors.request.use((config) => {
  // Check if this is an admin route
  const isAdminRoute = config.url?.startsWith('/admin');

  if (isAdminRoute) {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
  } else {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Auto-logout on 401 responses (skip for auth routes where 401 is expected)
const AUTH_PATHS = ['/auth/login', '/auth/signup', '/admin/login'];

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthRoute = AUTH_PATHS.some((path) => requestUrl.includes(path));

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
