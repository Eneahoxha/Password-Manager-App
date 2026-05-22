import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api',
  withCredentials: true,
  headers: {
    Accept: 'application/json'
  }
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    if (
      !error.response
      || error.response.status !== 401
      || originalRequest?._retry
      || requestUrl.includes('/auth/refresh')
      || requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/register')
      || requestUrl.includes('/auth/me')
    ) {
      throw error;
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = api.post('/auth/refresh').finally(() => {
        refreshPromise = null;
      });
    }

    try {
      await refreshPromise;
      return api(originalRequest);
    } catch (refreshError) {
      if (typeof window !== 'undefined') {
        window.location.assign('/login');
      }
      throw refreshError;
    }
  }
);

export default api;
