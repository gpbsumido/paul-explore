"use client";

import { useCallback, useMemo } from "react";
import { useOperatorInventory } from "@/hooks/useOperatorInventory";
import { useOperatorPlanogram } from "@/hooks/useOperatorPlanogram";
import {
  useReorderPlanogram,
  useResyncSlot,
} from "@/hooks/useOperatorMutations";
import { useToast } from "@/contexts/ToastContext";
import {
  assemblePlanogram,
  getRefillList,
  moveSlot,
} from "@/lib/operator-detail";
import type { InventoryItem } from "@/types/operator";
import PlanogramSlot from "./PlanogramSlot";

interface PlanogramTabProps {
  storeId: string;
}

const SHELF_WIDTH = 4;

/**
 * Planogram tab showing the store layout the operator can act on. Each slot
 * carries its address, and the operator can rearrange slots (arrow buttons or
 * drag) and re-sync a slot whose sensor reading has drifted. Layout persists
 * server-side so it survives the poll. Built with CSS grid for accessibility.
 */
export default function PlanogramTab({ storeId }: PlanogramTabProps) {
  const {
    items,
    loading: itemsLoading,
    error: itemsError,
  } = useOperatorInventory(storeId);
  const {
    slots,
    loading: planogramLoading,
    error: planogramError,
  } = useOperatorPlanogram(storeId);
  const { reorderPlanogram } = useReorderPlanogram();
  const { resyncSlot } = useResyncSlot();
  const { addToast } = useToast();

  const itemsById = useMemo(() => {
    const map = new Map<string, InventoryItem>();
    for (const item of items) map.set(item.id, item);
    return map;
  }, [items]);

  const order = useMemo(() => slots.map((s) => s.itemId), [slots]);

  const grid = useMemo(
    () => assemblePlanogram(slots, itemsById, SHELF_WIDTH),
    [slots, itemsById],
  );

  const refillList = useMemo(() => {
    const orderedItems = slots
      .map((s) => itemsById.get(s.itemId))
      .filter((item): item is InventoryItem => item !== undefined);
    return getRefillList(orderedItems, SHELF_WIDTH);
  }, [slots, itemsById]);

  const move = useCallback(
    (itemId: string, delta: number) => {
      const from = order.indexOf(itemId);
      if (from === -1) return;
      const next = moveSlot(order, from, from + delta);
      reorderPlanogram({ storeId, order: next }).catch(() => {
        addToast({ message: "Failed to rearrange slot", variant: "error" });
      });
    },
    [order, storeId, reorderPlanogram, addToast],
  );

  const handleDrop = useCallback(
    (targetItemId: string, sourceItemId: string) => {
      if (targetItemId === sourceItemId) return;
      const from = order.indexOf(sourceItemId);
      const to = order.indexOf(targetItemId);
      if (from === -1 || to === -1) return;
      const next = moveSlot(order, from, to);
      reorderPlanogram({ storeId, order: next }).catch(() => {
        addToast({ message: "Failed to rearrange slot", variant: "error" });
      });
    },
    [order, storeId, reorderPlanogram, addToast],
  );

  const handleResync = useCallback(
    (itemId: string) => {
      resyncSlot({ storeId, itemId }).catch(() => {
        addToast({ message: "Failed to re-sync sensor", variant: "error" });
      });
    },
    [storeId, resyncSlot, addToast],
  );

  const error = itemsError ?? planogramError;
  if (error) {
    return <p className="text-sm text-error-500 py-4">{error}</p>;
  }

  const loading = planogramLoading || itemsLoading;
  if (loading && slots.length === 0) {
    return <PlanogramTabSkeleton />;
  }

  if (grid.flat().length === 0) {
    return (
      <p className="text-sm text-muted py-8 text-center">
        No planogram data available.
      </p>
    );
  }

  const mismatchCount = grid.flat().filter((slot) => !slot.sensorMatch).length;
  const lastIndex = order.length - 1;

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
        <span className="font-medium text-foreground">Store Layout</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-success-500" />
          Stocked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-warning-500" />
          Low
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-error-500" />
          Critical
        </span>
        {mismatchCount > 0 && (
          <span className="text-warning-700 dark:text-warning-500 font-medium">
            {mismatchCount} sensor mismatch{mismatchCount !== 1 ? "es" : ""}
          </span>
        )}
      </div>

      <p className="text-xs text-muted">
        Drag a slot onto another, or use the arrows, to rearrange. Re-sync a
        slot to clear a sensor mismatch.
      </p>

      {/* Refill run — which slot needs restocking, most urgent first */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Refill run</h3>
          <span className="text-xs text-muted">
            {refillList.length} slot{refillList.length !== 1 ? "s" : ""} to
            refill
          </span>
        </div>
        {refillList.length === 0 ? (
          <p className="mt-2 text-xs text-muted">
            Every slot is stocked. Nothing to refill.
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {refillList.map((entry) => (
              <li
                key={entry.slotLabel}
                className="flex items-center gap-3 text-xs"
              >
                <span className="w-8 shrink-0 rounded bg-primary-500/10 px-1.5 py-0.5 text-center font-semibold tabular-nums text-primary-600 dark:text-primary-400">
                  {entry.slotLabel}
                </span>
                <span className="flex-1 truncate text-foreground">
                  {entry.productName}
                </span>
                <span className="shrink-0 tabular-nums text-muted">
                  {entry.currentStock}/{entry.capacity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Shelf grid */}
      <div className="space-y-3">
        {grid.map((shelf, shelfIndex) => (
          <div key={shelfIndex}>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted mb-1.5">
              Shelf {shelfIndex + 1}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {shelf.map((slot) => {
                const idx = order.indexOf(slot.itemId);
                return (
                  <PlanogramSlot
                    key={slot.itemId}
                    slot={slot}
                    canMoveLeft={idx > 0}
                    canMoveRight={idx < lastIndex}
                    onMoveLeft={() => move(slot.itemId, -1)}
                    onMoveRight={() => move(slot.itemId, 1)}
                    onResync={() => handleResync(slot.itemId)}
                    onDropItem={(sourceItemId) =>
                      handleDrop(slot.itemId, sourceItemId)
                    }
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

import Bone from "./Bone";

function PlanogramTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} style={{ height: 12, width: 60 }} />
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, row) => (
        <div key={row} className="space-y-1.5">
          <Bone style={{ height: 10, width: 48 }} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Array.from({ length: SHELF_WIDTH }).map((_, col) => (
              <Bone
                key={col}
                style={{ height: 72, width: "100%", borderRadius: 8 }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
