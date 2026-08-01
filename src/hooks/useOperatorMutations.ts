"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Alert,
  InventoryItem,
  ActivityEvent,
  PlanogramSlot,
} from "@/types/operator";
import { queryKeys } from "@/lib/queryKeys";
import {
  alertSchema,
  inventoryItemSchema,
  activityEventSchema,
  planogramSlotSchema,
} from "@/lib/operator-schemas";
import { z } from "zod";

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
      return alertSchema.parse(json.alert);
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
      return z.object({
        items: z.array(inventoryItemSchema),
        activity: activityEventSchema,
      }).parse(json);
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

// ---------------------------------------------------------------------------
// Reorder planogram
// ---------------------------------------------------------------------------

interface ReorderPlanogramInput {
  storeId: string;
  order: string[];
}

export interface UseReorderPlanogramReturn {
  reorderPlanogram: (input: ReorderPlanogramInput) => Promise<PlanogramSlot[]>;
  isReordering: boolean;
}

/** Reorders cached slots to match a new item-id order. */
function applyOrder(
  slots: readonly PlanogramSlot[],
  order: readonly string[],
): PlanogramSlot[] {
  const remaining = new Map(slots.map((s) => [s.itemId, s]));
  const reordered: PlanogramSlot[] = [];
  for (const id of order) {
    const slot = remaining.get(id);
    if (slot) {
      reordered.push(slot);
      remaining.delete(id);
    }
  }
  for (const slot of slots) {
    if (remaining.has(slot.itemId)) reordered.push(slot);
  }
  return reordered;
}

/**
 * Mutation that rearranges a store's planogram. Optimistically reorders the
 * cached slots so the shelf moves immediately; rolls back on failure.
 */
export function useReorderPlanogram(): UseReorderPlanogramReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      storeId,
      order,
    }: ReorderPlanogramInput): Promise<PlanogramSlot[]> => {
      const res = await fetch(`/api/operator/stores/${storeId}/planogram`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      if (!res.ok) throw new Error("Failed to rearrange planogram");
      const json = await res.json();
      return z.array(planogramSlotSchema).parse(json.slots);
    },

    onMutate: async ({ storeId, order }) => {
      const key = queryKeys.operator.planogram(storeId);
      await queryClient.cancelQueries({ queryKey: key });
      const snapshot = queryClient.getQueryData<PlanogramSlot[]>(key);
      queryClient.setQueryData<PlanogramSlot[]>(key, (prev) =>
        applyOrder(prev ?? [], order),
      );
      return { snapshot, key };
    },

    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(context.key, context.snapshot);
    },

    onSettled: (_data, _err, { storeId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.operator.planogram(storeId),
      });
    },
  });

  return {
    reorderPlanogram: (input) => mutation.mutateAsync(input),
    isReordering: mutation.isPending,
  };
}

// ---------------------------------------------------------------------------
// Re-sync a planogram slot's sensor
// ---------------------------------------------------------------------------

interface ResyncSlotInput {
  storeId: string;
  itemId: string;
}

export interface UseResyncSlotReturn {
  resyncSlot: (input: ResyncSlotInput) => Promise<PlanogramSlot[]>;
  isResyncing: boolean;
}

/**
 * Mutation that clears a slot's sensor mismatch. Optimistically flips the
 * cached slot's sensorMatch to true so the amber warning clears at once.
 */
export function useResyncSlot(): UseResyncSlotReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      storeId,
      itemId,
    }: ResyncSlotInput): Promise<PlanogramSlot[]> => {
      const res = await fetch(`/api/operator/stores/${storeId}/planogram`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resyncItemId: itemId }),
      });
      if (!res.ok) throw new Error("Failed to re-sync sensor");
      const json = await res.json();
      return z.array(planogramSlotSchema).parse(json.slots);
    },

    onMutate: async ({ storeId, itemId }) => {
      const key = queryKeys.operator.planogram(storeId);
      await queryClient.cancelQueries({ queryKey: key });
      const snapshot = queryClient.getQueryData<PlanogramSlot[]>(key);
      queryClient.setQueryData<PlanogramSlot[]>(key, (prev) =>
        (prev ?? []).map((s) =>
          s.itemId === itemId ? { ...s, sensorMatch: true } : s,
        ),
      );
      return { snapshot, key };
    },

    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(context.key, context.snapshot);
    },

    onSettled: (_data, _err, { storeId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.operator.planogram(storeId),
      });
    },
  });

  return {
    resyncSlot: (input) => mutation.mutateAsync(input),
    isResyncing: mutation.isPending,
  };
}
