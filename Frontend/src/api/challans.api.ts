import { apiClient } from './api-client';
import type { Challan, CreateChallanPayload, UpdateChallanPayload } from '@/types/challan';
import type { ApiResponse } from '@/types/api';

export const challanApi = {
  getAll: async (params?: any): Promise<ApiResponse<Challan[]>> => {
    const response = await apiClient.get<ApiResponse<Challan[]>>('/challans', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Challan>> => {
    const response = await apiClient.get<ApiResponse<Challan>>(`/challans/${id}`);
    return response.data;
  },

  create: async (payload: CreateChallanPayload): Promise<ApiResponse<Challan>> => {
    const response = await apiClient.post<ApiResponse<Challan>>('/challans', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateChallanPayload): Promise<ApiResponse<Challan>> => {
    const response = await apiClient.patch<ApiResponse<Challan>>(`/challans/${id}`, payload);
    return response.data;
  },

  confirm: async (id: string): Promise<ApiResponse<Challan>> => {
    const response = await apiClient.post<ApiResponse<Challan>>(`/challans/${id}/confirm`);
    return response.data;
  },

  cancel: async (id: string): Promise<ApiResponse<Challan>> => {
    const response = await apiClient.post<ApiResponse<Challan>>(`/challans/${id}/cancel`);
    return response.data;
  }
};
