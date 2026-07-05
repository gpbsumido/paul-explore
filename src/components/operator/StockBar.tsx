"use client";

import { categorizeStock, type StockStatus } from "@/lib/operator-detail";

interface StockBarProps {
  currentStock: number;
  capacity: number;
}

const BAR_COLORS: Record<StockStatus, string> = {
  healthy: "bg-success-500",
  low: "bg-warning-500",
  critical: "bg-error-500",
  "out-of-stock": "bg-error-500",
};

/**
 * Visual bar showing current stock relative to capacity. Color shifts from
 * green to amber to red as stock drops through the threshold tiers.
 */
export default function StockBar({ currentStock, capacity }: StockBarProps) {
  const status = categorizeStock(currentStock, capacity);
  const pct = capacity > 0 ? Math.round((currentStock / capacity) * 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className={`h-full rounded-full transition-[width,background-color] ${BAR_COLORS[status]}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted">
        {currentStock}/{capacity}
      </span>
    </div>
  );
}
