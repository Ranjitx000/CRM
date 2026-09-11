import { apiClient } from './api-client';
import type { Product, CreateProductPayload, UpdateProductPayload } from '@/types/product';
import type { ApiResponse } from '@/types/api';

export const productApi = {
  getAll: async (params?: any): Promise<ApiResponse<Product[]>> => {
    const response = await apiClient.get<ApiResponse<Product[]>>('/products', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },

  create: async (payload: CreateProductPayload): Promise<ApiResponse<Product>> => {
    const response = await apiClient.post<ApiResponse<Product>>('/products', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateProductPayload): Promise<ApiResponse<Product>> => {
    const response = await apiClient.patch<ApiResponse<Product>>(`/products/${id}`, payload);
    return response.data;
  }
};
