"use client";

import { useQuery } from "@tanstack/react-query";
import type { Store } from "@/types/operator";
import { queryKeys } from "@/lib/queryKeys";
import { storeSchema } from "@/lib/operator-schemas";
import { queryErrorMessage } from "./queryErrorMessage";

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
 *
 * Pass `initialData` (the store the page already loaded on the server) to seed
 * the cache, so the detail view paints its header on first render instead of
 * waiting on a client round-trip — the round-trip that was the LCP. The query
 * still refetches in the background to pick up anything fresher.
 */
export function useOperatorStore(
  storeId: string,
  { initialData }: { initialData?: Store } = {},
): UseOperatorStoreReturn {
  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.operator.store(storeId),
    queryFn: async ({ signal }): Promise<Store> => {
      const res = await fetch(`/api/operator/stores/${storeId}`, { signal });
      if (!res.ok) throw new Error("Failed to fetch store");
      const json = await res.json();
      return storeSchema.parse(json.store);
    },
    initialData,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  return {
    store: data,
    loading: isLoading,
    error: queryErrorMessage(isError, queryError, "Failed to load store."),
  };
}
