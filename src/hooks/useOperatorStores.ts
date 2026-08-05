"use client";

import type { Store } from "@/types/operator";
import { queryKeys } from "@/lib/queryKeys";
import { storeSchema } from "@/lib/operator-schemas";
import { z } from "zod";
import { useOperatorResource } from "./useOperatorResource";

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
  const { data, loading, error } = useOperatorResource<Store>({
    queryKey: queryKeys.operator.stores(),
    url: "/api/operator/stores",
    select: (json) =>
      z.object({ stores: z.array(storeSchema) }).parse(json).stores,
    fetchError: "Failed to fetch stores",
    loadError: "Failed to load stores.",
    refetchInterval: 30_000,
  });

  return { stores: data ?? EMPTY, loading, error };
}
