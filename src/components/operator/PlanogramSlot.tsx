"use client";

import type { PlanogramSlot as SlotData } from "@/lib/operator-detail";
import { categorizeStock } from "@/lib/operator-detail";

interface PlanogramSlotProps {
  slot: SlotData;
}

const STOCK_DOT: Record<string, string> = {
  healthy: "bg-success-500",
  low: "bg-warning-500",
  critical: "bg-error-500",
  "out-of-stock": "bg-error-500",
};

/**
 * Single slot in the planogram grid showing the product, stock dot, and
 * sensor match status. Mismatches get an amber border highlight.
 */
export default function PlanogramSlot({ slot }: PlanogramSlotProps) {
  const status = categorizeStock(slot.currentStock, slot.capacity);
  const pct =
    slot.capacity > 0
      ? Math.round((slot.currentStock / slot.capacity) * 100)
      : 0;

  return (
    <div
      className={`flex flex-col gap-1.5 rounded-lg border p-3 ${
        slot.sensorMatch
          ? "border-border bg-surface"
          : "border-warning-400 bg-warning-500/5"
      }`}
    >
      <p className="text-xs font-medium text-foreground truncate">
        {slot.productName}
      </p>
      <p className="text-[10px] text-muted truncate">{slot.category}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${STOCK_DOT[status]}`}
          />
          <span className="text-[11px] tabular-nums text-muted">{pct}%</span>
        </div>
        {!slot.sensorMatch && (
          <span className="text-[10px] font-medium text-warning-700 dark:text-warning-500">
            Mismatch
          </span>
        )}
      </div>
    </div>
  );
}
