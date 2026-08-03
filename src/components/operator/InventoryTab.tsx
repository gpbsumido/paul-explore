"use client";

import { useMemo, useCallback, useState } from "react";
import { useOperatorInventory } from "@/hooks/useOperatorInventory";
import { useOperatorStore } from "@/hooks/useOperatorStore";
import { useRestockStore } from "@/hooks/useOperatorMutations";
import { useToast } from "@/contexts/ToastContext";
import { computeInventorySummary } from "@/lib/operator-detail";
import InventorySummary from "./InventorySummary";
import InventoryRow from "./InventoryRow";
import SensorOfflineCallout from "./SensorOfflineCallout";
import RestockFlow from "./restock/RestockFlow";

interface InventoryTabProps {
  storeId: string;
}

/**
 * Inventory tab content for the store detail page. Fetches the store's
 * inventory, shows a summary bar, and renders each item as a row with
 * stock bar, sparkline, status badge, and restock button.
 */
export default function InventoryTab({ storeId }: InventoryTabProps) {
  const { items, loading, error } = useOperatorInventory(storeId);
  const { store } = useOperatorStore(storeId);
  const { restockStore } = useRestockStore();
  const { addToast } = useToast();

  const [restockingIds, setRestockingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [restockedIds, setRestockedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [isRestocking, setIsRestocking] = useState(false);

  const summary = useMemo(() => computeInventorySummary(items), [items]);

  const handleRestock = useCallback(
    (itemId: string) => {
      setRestockingIds((prev) => new Set([...prev, itemId]));
      restockStore({ storeId, itemIds: [itemId] })
        .then(() => {
          setRestockedIds((prev) => new Set([...prev, itemId]));
          setTimeout(() => {
            setRestockedIds((prev) => {
              const next = new Set(prev);
              next.delete(itemId);
              return next;
            });
          }, 2000);
        })
        .catch(() => {
          addToast({ message: "Failed to restock item", variant: "error" });
        })
        .finally(() => {
          setRestockingIds((prev) => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
          });
        });
    },
    [storeId, restockStore, addToast],
  );

  if (error) {
    return <p className="text-sm text-error-500 py-4">{error}</p>;
  }

  if (loading && items.length === 0) {
    return <InventoryTabSkeleton />;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted py-8 text-center">
        No inventory data available.
      </p>
    );
  }

  if (isRestocking) {
    return (
      <RestockFlow storeId={storeId} onClose={() => setIsRestocking(false)} />
    );
  }

  return (
    <div className="space-y-4">
      {store && <SensorOfflineCallout lastPing={store.lastPing} />}
      <InventorySummary summary={summary} />
      {/*
        The full workflow, not the one-tap fill. Counting a shelf is the only
        way expiry and shrinkage ever get recorded, so it gets the primary
        button; Quick Actions still has the top-everything-up shortcut.
      */}
      <button
        type="button"
        onClick={() => setIsRestocking(true)}
        className="min-h-11 w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Start restock
      </button>
      <div className="space-y-2">
        {items.map((item) => (
          <InventoryRow
            key={item.id}
            item={item}
            onRestock={handleRestock}
            isRestocking={restockingIds.has(item.id)}
            isRestocked={restockedIds.has(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

import Bone from "./Bone";

function InventoryTabSkeleton() {
  return (
    <div className="space-y-4">
      {/* Summary skeleton */}
      <div className="flex gap-6 rounded-lg border border-border bg-surface px-4 py-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Bone style={{ height: 18, width: 40 }} />
            <Bone style={{ height: 11, width: 64 }} />
          </div>
        ))}
      </div>

      {/* Row skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3"
        >
          <div className="flex flex-col gap-1 flex-1">
            <Bone style={{ height: 14, width: 140 }} />
            <Bone style={{ height: 11, width: 60 }} />
          </div>
          <Bone style={{ height: 24, width: 64 }} />
          <Bone style={{ height: 6, width: 80, borderRadius: 999 }} />
          <Bone style={{ height: 20, width: 56, borderRadius: 999 }} />
          <Bone style={{ height: 12, width: 60 }} />
          <Bone style={{ height: 28, width: 72, borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );
}
