"use client";

import type { FleetStats } from "@/lib/operator-utils";

interface FleetStatsBarProps {
  stats: FleetStats;
  /** While true the aggregate figures are unknown, not zero. */
  isLoading?: boolean;
  /**
   * Narrows the store grid to the degraded and offline stores this tile counts.
   * Optional so the bar still renders anywhere that has nothing to filter.
   */
  onFilterNeedsAttention?: () => void;
}

interface StatItemProps {
  label: string;
  /** Null renders an em dash: unknown is not the same as none. */
  value: string | number | null;
  isLoading?: boolean;
  accent?: "default" | "warning" | "error";
  /** When given, the tile becomes a button that narrows the list below it. */
  onSelect?: () => void;
}

function StatItem({
  label,
  value,
  accent = "default",
  isLoading = false,
  onSelect,
}: StatItemProps) {
  const valueColor =
    accent === "error"
      ? "text-error-700 dark:text-error-400"
      : accent === "warning"
        ? "text-warning-700 dark:text-warning-400"
        : "text-foreground";

  const body = (
    <>
      {isLoading ? (
        // A pulsing placeholder rather than a number nobody has computed yet.
        // The bar itself is hidden from assistive tech and the state is spoken
        // by the text beside it: aria-label on a bare span is prohibited, since
        // a span carries no role for the label to name, and axe rates that
        // serious. Bone.tsx already sets the pattern -- hide the shape, say the
        // words.
        <>
          <span
            aria-hidden="true"
            className="my-1 h-4 w-10 animate-pulse rounded bg-surface-raised"
          />
          <span className="sr-only">{`${label}, loading`}</span>
        </>
      ) : (
        <span className={`text-lg font-bold tabular-nums ${valueColor}`}>
          {value === null ? "\u2014" : value}
        </span>
      )}
      <span className="text-[11px] text-muted whitespace-nowrap">{label}</span>
    </>
  );

  // A tile with somewhere to go is a button; one without stays a plain div, so
  // nothing advertises an interaction it does not have.
  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-col items-center gap-0.5 px-4 py-2 hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
      >
        {body}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-2">{body}</div>
  );
}

/**
 * Horizontal stats bar showing fleet-wide KPIs: total stores, stores needing
 * attention, low-stock items, and average inventory health.
 */
export default function FleetStatsBar({
  stats,
  isLoading = false,
  onFilterNeedsAttention,
}: FleetStatsBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl border border-border bg-surface divide-x divide-border">
      {/* These two come from the store list, so they are known immediately. */}
      <StatItem label="Total Stores" value={stats.totalStores} />
      <StatItem
        label="Needs Attention"
        value={stats.needsAttention}
        accent={stats.needsAttention > 0 ? "warning" : "default"}
        // Only actionable when there is something to look at; zero degraded
        // stores should not offer to filter the list down to nothing.
        onSelect={
          stats.needsAttention > 0 ? onFilterNeedsAttention : undefined
        }
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
