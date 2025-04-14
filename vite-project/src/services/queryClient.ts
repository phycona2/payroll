import { QueryClient } from '@tanstack/react-query';

// Create a client with default settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep cached data for 5 minutes before considering it stale
      staleTime: 5 * 60 * 1000,
      // Retry failed queries 3 times
      retry: 3,
      // Cache successful responses for 30 minutes
      cacheTime: 30 * 60 * 1000,
      // Refetch on window focus (when user returns to the app)
      refetchOnWindowFocus: true,
      // Don't refetch on mount if the data is not stale
      refetchOnMount: false,
    },
  },
}); 