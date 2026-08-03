"use client";

import type { FleetStats } from "@/lib/operator-utils";

interface FleetStatsBarProps {
  stats: FleetStats;
  /** While true the aggregate figures are unknown, not zero. */
  isLoading?: boolean;
}

interface StatItemProps {
  label: string;
  /** Null renders an em dash: unknown is not the same as none. */
  value: string | number | null;
  isLoading?: boolean;
  accent?: "default" | "warning" | "error";
}

function StatItem({
  label,
  value,
  accent = "default",
  isLoading = false,
}: StatItemProps) {
  const valueColor =
    accent === "error"
      ? "text-error-700 dark:text-error-400"
      : accent === "warning"
        ? "text-warning-700 dark:text-warning-400"
        : "text-foreground";

  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-2">
      {isLoading ? (
        // A pulsing placeholder rather than a number nobody has computed yet.
        <span
          aria-label={`${label}, loading`}
          className="my-1 h-4 w-10 animate-pulse rounded bg-surface-raised"
        />
      ) : (
        <span className={`text-lg font-bold tabular-nums ${valueColor}`}>
          {value === null ? "\u2014" : value}
        </span>
      )}
      <span className="text-[11px] text-muted whitespace-nowrap">{label}</span>
    </div>
  );
}

/**
 * Horizontal stats bar showing fleet-wide KPIs: total stores, stores needing
 * attention, low-stock items, and average inventory health.
 */
export default function FleetStatsBar({
  stats,
  isLoading = false,
}: FleetStatsBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl border border-border bg-surface divide-x divide-border">
      {/* These two come from the store list, so they are known immediately. */}
      <StatItem label="Total Stores" value={stats.totalStores} />
      <StatItem
        label="Needs Attention"
        value={stats.needsAttention}
        accent={stats.needsAttention > 0 ? "warning" : "default"}
      />
      <StatItem
        label="Low Stock Items"
        value={stats.lowStockItems}
        isLoading={isLoading}
        accent={(stats.lowStockItems ?? 0) > 0 ? "error" : "default"}
      />
      <StatItem
        label="Avg Inventory"
        value={
          stats.avgInventoryHealth === null
            ? null
            : `${stats.avgInventoryHealth}%`
        }
        isLoading={isLoading}
        // No colour when the number is unknown: an amber "warning" on absent
        // data reads as a real finding about the fleet.
        accent={
          stats.avgInventoryHealth !== null && stats.avgInventoryHealth < 50
            ? "warning"
            : "default"
        }
      />
    </div>
  );
}
