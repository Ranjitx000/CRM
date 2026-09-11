import axios from 'axios';
import { useAuthStore } from '@/features/auth/auth.store';

// Assuming the API is on localhost:5000 for now, or configured via env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // For HTTP-only cookies (e.g. refresh token)
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle global 401/403
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh token
        await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        // If successful, retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear user state and redirect to login
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      // In a real app we might just return the error and let the component show a toast
      // For now, it will be rejected and caught by the mutation/query error handler
    }

    return Promise.reject(error);
  }
);
