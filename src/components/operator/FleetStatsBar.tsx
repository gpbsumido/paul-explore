"use client";

import type { FleetStats } from "@/lib/operator-utils";

interface FleetStatsBarProps {
  stats: FleetStats;
}

interface StatItemProps {
  label: string;
  value: string | number;
  accent?: "default" | "warning" | "error";
}

function StatItem({ label, value, accent = "default" }: StatItemProps) {
  const valueColor =
    accent === "error"
      ? "text-error-600 dark:text-error-400"
      : accent === "warning"
        ? "text-warning-600 dark:text-warning-400"
        : "text-foreground";

  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-2">
      <span className={`text-lg font-bold tabular-nums ${valueColor}`}>
        {value}
      </span>
      <span className="text-[11px] text-muted whitespace-nowrap">{label}</span>
    </div>
  );
}

/**
 * Horizontal stats bar showing fleet-wide KPIs: total stores, stores needing
 * attention, low-stock items, and average inventory health.
 */
export default function FleetStatsBar({ stats }: FleetStatsBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-px rounded-xl border border-border bg-surface divide-x divide-border">
      <StatItem label="Total Stores" value={stats.totalStores} />
      <StatItem
        label="Needs Attention"
        value={stats.needsAttention}
        accent={stats.needsAttention > 0 ? "warning" : "default"}
      />
      <StatItem
        label="Low Stock Items"
        value={stats.lowStockItems}
        accent={stats.lowStockItems > 0 ? "error" : "default"}
      />
      <StatItem
        label="Avg Inventory"
        value={`${stats.avgInventoryHealth}%`}
        accent={stats.avgInventoryHealth < 50 ? "warning" : "default"}
      />
    </div>
  );
}
