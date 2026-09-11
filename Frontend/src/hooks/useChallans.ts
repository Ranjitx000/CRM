import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { challanApi } from '@/api/challans.api';
import type { CreateChallanPayload, UpdateChallanPayload } from '@/types/challan';
import { toast } from 'sonner';

export function useChallans(params?: any) {
  return useQuery({
    queryKey: ['challans', params],
    queryFn: () => challanApi.getAll(params),
  });
}

export function useCreateChallan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateChallanPayload) => challanApi.create(payload),
    onSuccess: () => {
      toast.success('Challan created successfully');
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      // Might affect products stock if status is DELIVERED, good to invalidate products
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create challan');
    }
  });
}

export function useUpdateChallan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateChallanPayload }) => challanApi.update(id, payload),
    onSuccess: () => {
      toast.success('Challan updated successfully');
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update challan');
    }
  });
}
