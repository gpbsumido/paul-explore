"use client";

import type { Store } from "@/types/operator";
import { STATUS_CONFIG } from "@/lib/operator-detail";
import ConnectionQuality from "./ConnectionQuality";
import FreshnessLabel from "./FreshnessLabel";

interface StoreHeaderProps {
  store: Store;
}

/**
 * Store detail header showing the store's identity, live status, uptime,
 * sensor connection quality, and when the last reading came in. Sits above
 * the tab bar on the store detail page.
 */
export default function StoreHeader({ store }: StoreHeaderProps) {
  const cfg = STATUS_CONFIG[store.status];

  return (
    <div className="space-y-4">
      {/* Top row: name + status badge */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">
            {store.name}
          </h1>
          <p className="text-sm text-muted">{store.location}</p>
        </div>
        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg}`}
        >
          <span className={`inline-block h-2 w-2 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        <span className="font-medium text-foreground">
          {store.uptime.toFixed(1)}% uptime
        </span>
        <ConnectionQuality lastPing={store.lastPing} />
        <span className="flex items-center gap-1">
          Last reading <FreshnessLabel lastPing={store.lastPing} />
        </span>
      </div>
    </div>
  );
}
