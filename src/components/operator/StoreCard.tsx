"use client";

import { memo } from "react";
import Link from "next/link";
import type { Store } from "@/types/operator";
import { STATUS_CONFIG } from "@/lib/operator-detail";
import { isStaleData } from "@/lib/operator-freshness";
import FreshnessLabel from "./FreshnessLabel";
import { WarningTriangleIcon } from "./icons";

interface StoreCardProps {
  store: Store;
  alertCount: number;
  inventoryHealth: number;
  hasQueryError?: boolean;
}

/**
 * Fleet overview card for a single store. Shows status, location, alert count,
 * inventory health bar, and freshness. Clicking navigates to the store detail.
 */
const StoreCard = memo(function StoreCard({
  store,
  alertCount,
  inventoryHealth,
  hasQueryError = false,
}: StoreCardProps) {
  const cfg = STATUS_CONFIG[store.status];
  const stale = isStaleData(store.lastPing);
  const borderClass = stale
    ? "border-warning-400/60 border-2"
    : cfg.border || "border-border";

  return (
    <Link
      href={`/operator/stores/${store.id}`}
      className={`group flex flex-col gap-3 rounded-xl border bg-surface p-4 transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${borderClass}`}
    >
      {/* Header row: name + status badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary-600 transition-colors">
            {store.name}
          </h3>
          <p className="text-xs text-muted truncate">{store.location}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-muted">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${cfg.dot}`}
          />
          {cfg.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-muted">
        {alertCount > 0 && (
          <span className="flex items-center gap-1 text-warning-600 font-medium">
            <WarningTriangleIcon size={12} />
            {alertCount} alert{alertCount !== 1 ? "s" : ""}
          </span>
        )}
        <span>{store.temperature.toFixed(1)}°C</span>
        <span>{store.uptime.toFixed(0)}% up</span>
      </div>

      {/* Inventory health bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted">Inventory</span>
          <span className="font-medium text-foreground">
            {inventoryHealth}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className={`h-full rounded-full transition-[width,background-color] ${
              inventoryHealth > 50
                ? "bg-success-500"
                : inventoryHealth > 20
                  ? "bg-warning-500"
                  : "bg-error-500"
            }`}
            style={{ width: `${Math.min(inventoryHealth, 100)}%` }}
          />
        </div>
      </div>

      {/* Footer: freshness + error indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FreshnessLabel lastPing={store.lastPing} />
          {hasQueryError && (
            <span
              className="flex items-center gap-1 text-[11px] text-error-500"
              title="Some data for this store failed to load"
            >
              <WarningTriangleIcon size={11} className="text-error-500" />
              Data error
            </span>
          )}
        </div>
        <span className="text-[11px] text-muted opacity-0 group-hover:opacity-100 transition-opacity">
          View details →
        </span>
      </div>
    </Link>
  );
});

export default StoreCard;
