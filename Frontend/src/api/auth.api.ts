import { apiClient } from './api-client';
import type { LoginResponse } from '@/types/auth';
import type { ApiResponse } from '@/types/api';

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
    return response.data.data;
  },
  
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  }
};
