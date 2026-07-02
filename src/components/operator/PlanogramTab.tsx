"use client";

import { useMemo } from "react";
import { useOperatorInventory } from "@/hooks/useOperatorInventory";
import { generatePlanogramGrid } from "@/lib/operator-detail";
import PlanogramSlot from "./PlanogramSlot";

interface PlanogramTabProps {
  storeId: string;
}

const SHELF_WIDTH = 4;

/**
 * Planogram tab showing a simplified grid of the store layout. Inventory
 * items are laid out across shelves, each slot showing the product, stock
 * level, and whether the sensor reading matches the expected placement.
 * Mismatches highlight in amber. Built with CSS grid for accessibility.
 */
export default function PlanogramTab({ storeId }: PlanogramTabProps) {
  const { items, loading, error } = useOperatorInventory(storeId);

  const grid = useMemo(
    () => generatePlanogramGrid(items, SHELF_WIDTH),
    [items],
  );

  if (error) {
    return <p className="text-sm text-error-500 py-4">{error}</p>;
  }

  if (loading && items.length === 0) {
    return <PlanogramTabSkeleton />;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted py-8 text-center">
        No planogram data available.
      </p>
    );
  }

  const mismatchCount = grid.flat().filter((slot) => !slot.sensorMatch).length;

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
          <span className="text-warning-600 font-medium">
            {mismatchCount} sensor mismatch{mismatchCount !== 1 ? "es" : ""}
          </span>
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
              {shelf.map((slot, slotIndex) => (
                <PlanogramSlot key={`${shelfIndex}-${slotIndex}`} slot={slot} />
              ))}
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
