"use client";

import type { InventorySummary as Summary } from "@/lib/operator-detail";

interface InventorySummaryProps {
  summary: Summary;
}

/**
 * Summary bar at the top of the inventory tab showing total items,
 * count needing restock, and overall fill percentage.
 */
export default function InventorySummary({ summary }: InventorySummaryProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-surface px-4 py-3">
      <Stat label="Total Items" value={String(summary.totalItems)} />
      <Stat
        label="Needs Restock"
        value={String(summary.needsRestock)}
        warn={summary.needsRestock > 0}
      />
      <Stat label="Avg Fill" value={`${summary.fillPercentage}%`} />
    </div>
  );
}

function Stat({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span
        className={`text-base font-semibold tabular-nums ${warn ? "text-error-500" : "text-foreground"}`}
      >
        {value}
      </span>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  );
}
