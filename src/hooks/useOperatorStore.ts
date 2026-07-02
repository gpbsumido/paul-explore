"use client";

import { useQuery } from "@tanstack/react-query";
import type { Store } from "@/types/operator";
import { queryKeys } from "@/lib/queryKeys";

export interface UseOperatorStoreReturn {
  store: Store | undefined;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches a single operator store by ID.
 *
 * No polling — the detail view relies on the fleet list's 30s poll for
 * freshness and a manual refetch button if the operator wants an immediate
 * update.
 */
export function useOperatorStore(storeId: string): UseOperatorStoreReturn {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.operator.store(storeId),
    queryFn: async ({ signal }): Promise<Store> => {
      const res = await fetch(`/api/operator/stores/${storeId}`, { signal });
      if (!res.ok) throw new Error("Failed to fetch store");
      const json = await res.json();
      return json.store as Store;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  return {
    store: data,
    loading: isLoading || isFetching,
    error: isError
      ? queryError instanceof Error
        ? queryError.message
        : "Failed to load store."
      : null,
  };
}
