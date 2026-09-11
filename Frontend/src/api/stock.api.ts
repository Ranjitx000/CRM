import { apiClient } from './api-client';
import type { StockMovement, CreateStockMovementPayload } from '@/types/stock';
import type { ApiResponse } from '@/types/api';

export const stockApi = {
  createMovement: async (payload: CreateStockMovementPayload): Promise<ApiResponse<StockMovement>> => {
    const response = await apiClient.post<ApiResponse<StockMovement>>('/stock-movements', payload);
    return response.data;
  },

  getProductHistory: async (productId: string, params?: any): Promise<ApiResponse<StockMovement[]>> => {
    const response = await apiClient.get<ApiResponse<StockMovement[]>>(`/products/${productId}/stock-movements`, { params });
    return response.data;
  }
};
