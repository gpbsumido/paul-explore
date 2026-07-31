"use client";

import type { DragEvent } from "react";
import type { AssembledSlot } from "@/lib/operator-detail";
import { categorizeStock } from "@/lib/operator-detail";

interface PlanogramSlotProps {
  slot: AssembledSlot;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onResync: () => void;
  onDropItem: (sourceItemId: string) => void;
}

const STOCK_DOT: Record<string, string> = {
  healthy: "bg-success-500",
  low: "bg-warning-500",
  critical: "bg-error-500",
  "out-of-stock": "bg-error-500",
};

const CONTROL_CLASS =
  "flex h-6 w-6 items-center justify-center rounded border border-border text-muted transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500 disabled:opacity-30 disabled:pointer-events-none";

/**
 * Single slot in the planogram grid: product, address, stock dot, and sensor
 * status. The operator can rearrange it (drag onto another slot, or the arrow
 * buttons) and re-sync its sensor when it reads as a mismatch. Mismatched slots
 * get an amber border.
 */
export default function PlanogramSlot({
  slot,
  canMoveLeft,
  canMoveRight,
  onMoveLeft,
  onMoveRight,
  onResync,
  onDropItem,
}: PlanogramSlotProps) {
  const status = categorizeStock(slot.currentStock, slot.capacity);
  const pct =
    slot.capacity > 0
      ? Math.round((slot.currentStock / slot.capacity) * 100)
      : 0;

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("text/plain", slot.itemId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const sourceItemId = e.dataTransfer.getData("text/plain");
    if (sourceItemId) onDropItem(sourceItemId);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={`flex flex-col gap-1.5 rounded-lg border p-3 ${
        slot.sensorMatch
          ? "border-border bg-surface"
          : "border-warning-400 bg-warning-500/5"
      }`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <p className="text-xs font-medium text-foreground truncate">
          {slot.productName}
        </p>
        <span className="shrink-0 rounded bg-primary-500/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary-600 dark:text-primary-400">
          {slot.slotLabel}
        </span>
      </div>
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

      {/* Controls */}
      <div className="mt-1 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={CONTROL_CLASS}
            disabled={!canMoveLeft}
            aria-label={`Move ${slot.productName} to the previous slot`}
            onClick={onMoveLeft}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            className={CONTROL_CLASS}
            disabled={!canMoveRight}
            aria-label={`Move ${slot.productName} to the next slot`}
            onClick={onMoveRight}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
        {!slot.sensorMatch && (
          <button
            type="button"
            className="rounded border border-warning-400 px-2 py-0.5 text-[10px] font-medium text-warning-700 transition-colors hover:bg-warning-500/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500 dark:text-warning-500"
            aria-label={`Re-sync sensor for ${slot.productName}`}
            onClick={onResync}
          >
            Re-sync
          </button>
        )}
      </div>
    </div>
  );
}
