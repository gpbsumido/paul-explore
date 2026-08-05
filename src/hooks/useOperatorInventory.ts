"use client";

import type { InventoryItem } from "@/types/operator";
import { queryKeys } from "@/lib/queryKeys";
import { inventoryItemSchema } from "@/lib/operator-schemas";
import { z } from "zod";
import { useOperatorResource } from "./useOperatorResource";

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
  const { data, loading, error } = useOperatorResource<InventoryItem>({
    queryKey: queryKeys.operator.inventory(storeId),
    url: `/api/operator/stores/${storeId}/inventory`,
    select: (json) =>
      z.object({ items: z.array(inventoryItemSchema) }).parse(json).items,
    fetchError: "Failed to fetch inventory",
    loadError: "Failed to load inventory.",
    refetchInterval: 60_000,
  });

  return { items: data ?? EMPTY, loading, error };
}
