import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 1 minute
      staleTime: 1000 * 60,
      retry: 1, // Only retry failed requests once
      refetchOnWindowFocus: false, // Don't aggressively refetch on focus for this internal tool
    },
  },
});
