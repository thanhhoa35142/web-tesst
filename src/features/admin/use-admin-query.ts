"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useAdminQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
): {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  refetch: () => void;
} {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", key],
    queryFn: fetcher,
  });
  return {
    data: query.data,
    error: query.error ?? undefined,
    loading: query.isPending,
    refetch: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", key] });
    },
  };
}
