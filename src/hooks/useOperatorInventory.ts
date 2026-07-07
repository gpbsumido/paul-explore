"use client";

import { useQuery } from "@tanstack/react-query";
import type { InventoryItem } from "@/types/operator";
import { queryKeys } from "@/lib/queryKeys";

const EMPTY: InventoryItem[] = [];

export interface UseOperatorInventoryReturn {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches inventory items for a specific operator store.
 *
 * Polls every 60 seconds — stock levels change less frequently than store
 * status so a longer interval keeps network traffic reasonable while still
 * surfacing low-stock situations within a minute.
 */
export function useOperatorInventory(
  storeId: string,
): UseOperatorInventoryReturn {
  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.operator.inventory(storeId),
    queryFn: async ({ signal }): Promise<InventoryItem[]> => {
      const res = await fetch(`/api/operator/stores/${storeId}/inventory`, {
        signal,
      });
      if (!res.ok) throw new Error("Failed to fetch inventory");
      const json = await res.json();
      return json.items as InventoryItem[];
    },
    staleTime: 0,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  return {
    items: data ?? EMPTY,
    loading: isLoading,
    error: isError
      ? queryError instanceof Error
        ? queryError.message
        : "Failed to load inventory."
      : null,
  };
}
