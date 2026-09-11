import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '@/api/customers.api';
import type { CreateCustomerPayload, UpdateCustomerPayload } from '@/types/customer';
import { toast } from 'sonner';

export function useCustomers(params?: any) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customerApi.getAll(params),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) => customerApi.create(payload),
    onSuccess: () => {
      toast.success('Customer created successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create customer');
    }
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCustomerPayload }) => customerApi.update(id, payload),
    onSuccess: () => {
      toast.success('Customer updated successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update customer');
    }
  });
}

export function useCustomerNotes(id?: string) {
  return useQuery({
    queryKey: ['customerNotes', id],
    queryFn: () => customerApi.getNotes(id!),
    enabled: !!id,
  });
}

export function useAddCustomerNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => customerApi.addNote(id, note),
    onSuccess: (_, variables) => {
      toast.success('Note added successfully');
      queryClient.invalidateQueries({ queryKey: ['customerNotes', variables.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add note');
    }
  });
}
