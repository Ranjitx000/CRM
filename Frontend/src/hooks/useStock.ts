import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockApi } from '@/api/stock.api';
import type { CreateStockMovementPayload } from '@/types/stock';
import { toast } from 'sonner';

export function useProductStockHistory(productId: string, params?: any) {
  return useQuery({
    queryKey: ['stockHistory', productId, params],
    queryFn: () => stockApi.getProductHistory(productId, params),
    enabled: !!productId,
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateStockMovementPayload) => stockApi.createMovement(payload),
    onSuccess: (_, variables) => {
      toast.success('Stock movement recorded successfully');
      // Invalidate both stock history for this product AND the global products list 
      // because product.currentStock is updated on the backend.
      queryClient.invalidateQueries({ queryKey: ['stockHistory', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record stock movement');
    }
  });
}
