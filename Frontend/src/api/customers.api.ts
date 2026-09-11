import { apiClient } from './api-client';
import type { Customer, CreateCustomerPayload, UpdateCustomerPayload } from '@/types/customer';
import type { ApiResponse } from '@/types/api';

export const customerApi = {
  getAll: async (params?: any): Promise<ApiResponse<Customer[]>> => {
    const response = await apiClient.get<ApiResponse<Customer[]>>('/customers', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Customer>> => {
    const response = await apiClient.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data;
  },

  create: async (payload: CreateCustomerPayload): Promise<ApiResponse<Customer>> => {
    const response = await apiClient.post<ApiResponse<Customer>>('/customers', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateCustomerPayload): Promise<ApiResponse<Customer>> => {
    const response = await apiClient.patch<ApiResponse<Customer>>(`/customers/${id}`, payload);
    return response.data;
  },

  addNote: async (id: string, note: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(`/customers/${id}/notes`, { note });
    return response.data;
  },

  getNotes: async (id: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get<ApiResponse<any[]>>(`/customers/${id}/notes`);
    return response.data;
  }
};
