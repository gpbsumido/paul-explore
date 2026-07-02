"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Alert, InventoryItem, ActivityEvent } from "@/types/operator";
import { queryKeys } from "@/lib/queryKeys";

// ---------------------------------------------------------------------------
// Dismiss alert
// ---------------------------------------------------------------------------

interface DismissAlertInput {
  alertId: string;
  storeId: string;
}

export interface UseDismissAlertReturn {
  dismissAlert: (input: DismissAlertInput) => Promise<Alert>;
  isDismissing: boolean;
}

/**
 * Mutation that dismisses (acknowledges) a single alert.
 *
 * Optimistically flips `acknowledged` to true in the alerts cache for the
 * given store so the UI removes the alert row immediately. If the server
 * rejects the dismiss, the snapshot is restored and the alert reappears.
 */
export function useDismissAlert(): UseDismissAlertReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ alertId }: DismissAlertInput): Promise<Alert> => {
      const res = await fetch(`/api/operator/alerts/${alertId}/dismiss`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to dismiss alert");
      const json = await res.json();
      return json.alert as Alert;
    },

    onMutate: async ({ alertId, storeId }) => {
      const key = queryKeys.operator.alerts(storeId);
      await queryClient.cancelQueries({ queryKey: key });

      const snapshot = queryClient.getQueryData<Alert[]>(key);

      queryClient.setQueryData<Alert[]>(key, (prev) =>
        (prev ?? []).map((a) =>
          a.id === alertId ? { ...a, acknowledged: true } : a,
        ),
      );

      return { snapshot, key };
    },

    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(context.key, context.snapshot);
      }
    },

    onSettled: (_data, _err, { storeId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.operator.alerts(storeId),
      });
    },
  });

  return {
    dismissAlert: (input) => mutation.mutateAsync(input),
    isDismissing: mutation.isPending,
  };
}

// ---------------------------------------------------------------------------
// Restock store
// ---------------------------------------------------------------------------

interface RestockStoreInput {
  storeId: string;
  itemIds: string[];
}

interface RestockResult {
  items: InventoryItem[];
  activity: ActivityEvent;
}

export interface UseRestockStoreReturn {
  restockStore: (input: RestockStoreInput) => Promise<RestockResult>;
  isRestocking: boolean;
}

/**
 * Mutation that restocks selected inventory items to full capacity.
 *
 * Optimistically sets `currentStock = capacity` for each targeted item in
 * the inventory cache. If the server rejects the restock, the snapshot is
 * restored so stock levels revert to their pre-mutation values.
 */
export function useRestockStore(): UseRestockStoreReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      storeId,
      itemIds,
    }: RestockStoreInput): Promise<RestockResult> => {
      const res = await fetch(`/api/operator/stores/${storeId}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds }),
      });
      if (!res.ok) throw new Error("Failed to restock items");
      const json = await res.json();
      return json as RestockResult;
    },

    onMutate: async ({ storeId, itemIds }) => {
      const key = queryKeys.operator.inventory(storeId);
      await queryClient.cancelQueries({ queryKey: key });

      const snapshot = queryClient.getQueryData<InventoryItem[]>(key);

      const targetIds = new Set(itemIds);
      queryClient.setQueryData<InventoryItem[]>(key, (prev) =>
        (prev ?? []).map((item) =>
          targetIds.has(item.id)
            ? { ...item, currentStock: item.capacity }
            : item,
        ),
      );

      return { snapshot, key };
    },

    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(context.key, context.snapshot);
      }
    },

    onSettled: (_data, _err, { storeId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.operator.inventory(storeId),
      });
    },
  });

  return {
    restockStore: (input) => mutation.mutateAsync(input),
    isRestocking: mutation.isPending,
  };
}
