"use client";

import { useQuery } from "@tanstack/react-query";
import type { Store } from "@/types/operator";
import { queryKeys } from "@/lib/queryKeys";

const EMPTY: Store[] = [];

export interface UseOperatorStoresReturn {
  stores: Store[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches the full fleet list of operator stores.
 *
 * Polls every 30 seconds so the dashboard stays current without manual
 * refreshes. staleTime is 0 because store status, temperature, and uptime
 * can change at any moment and we always want the freshest snapshot.
 */
export function useOperatorStores(): UseOperatorStoresReturn {
  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.operator.stores(),
    queryFn: async ({ signal }): Promise<Store[]> => {
      const res = await fetch("/api/operator/stores", { signal });
      if (!res.ok) throw new Error("Failed to fetch stores");
      const json = await res.json();
      return json.stores as Store[];
    },
    staleTime: 0,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  return {
    stores: data ?? EMPTY,
    loading: isLoading,
    error: isError
      ? queryError instanceof Error
        ? queryError.message
        : "Failed to load stores."
      : null,
  };
}
