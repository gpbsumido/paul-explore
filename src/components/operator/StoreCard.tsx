"use client";

import Link from "next/link";
import type { Store } from "@/types/operator";
import FreshnessLabel from "./FreshnessLabel";

interface StoreCardProps {
  store: Store;
  alertCount: number;
  inventoryHealth: number;
}

const STATUS_CONFIG = {
  online: { label: "Online", dot: "bg-success-500", border: "" },
  degraded: {
    label: "Degraded",
    dot: "bg-warning-500",
    border: "border-warning-400/40",
  },
  offline: {
    label: "Offline",
    dot: "bg-error-500",
    border: "border-error-400/40",
  },
} as const;

/**
 * Fleet overview card for a single store. Shows status, location, alert count,
 * inventory health bar, and freshness. Clicking navigates to the store detail.
 */
export default function StoreCard({
  store,
  alertCount,
  inventoryHealth,
}: StoreCardProps) {
  const cfg = STATUS_CONFIG[store.status];

  return (
    <Link
      href={`/operator/stores/${store.id}`}
      className={`group flex flex-col gap-3 rounded-xl border bg-surface p-4 transition-colors hover:bg-surface-raised ${cfg.border || "border-border"}`}
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
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden
            >
              <path d="M8 1a1 1 0 0 1 .867.5l6.062 10.5A1 1 0 0 1 14.062 13.5H1.938a1 1 0 0 1-.867-1.5L7.133 1.5A1 1 0 0 1 8 1Zm0 4.5a.75.75 0 0 0-.75.75v2.5a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8 5.5ZM8 11a.75.75 0 1 0 0-1.5A.75.75 0 0 0 8 11Z" />
            </svg>
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
            className={`h-full rounded-full transition-all ${
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

      {/* Footer: freshness */}
      <div className="flex items-center justify-between">
        <FreshnessLabel lastPing={store.lastPing} />
        <span className="text-[11px] text-muted opacity-0 group-hover:opacity-100 transition-opacity">
          View details →
        </span>
      </div>
    </Link>
  );
}
