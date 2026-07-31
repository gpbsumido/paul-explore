"use client";

import { useState } from "react";
import { useFleetSalesAnalytics } from "@/hooks/useFleetSalesAnalytics";
import { formatCAD, type SalesGranularity } from "@/lib/operator-sales";
import SalesRangeToggle from "./SalesRangeToggle";
import Bone from "./Bone";

const MAX_RANKED_STORES = 6;

/**
 * Fleet-wide sales analytics for the dashboard. One aggregated request per
 * granularity (day/week/month/year) drives a revenue trend across the whole
 * fleet plus a per-store revenue ranking.
 */
export default function FleetSalesAnalytics() {
  const [granularity, setGranularity] = useState<SalesGranularity>("month");
  const { analytics, loading, error } = useFleetSalesAnalytics(granularity);

  const buckets = analytics?.buckets ?? [];
  const byStore = analytics?.byStore ?? [];
  const maxRevenue = Math.max(1, ...buckets.map((b) => b.revenue));
  const topStoreRevenue = Math.max(1, ...byStore.map((s) => s.totalRevenue));

  return (
    <section
      aria-labelledby="fleet-sales-heading"
      className="rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="fleet-sales-heading"
            className="text-sm font-semibold text-foreground"
          >
            Fleet sales
          </h2>
          <p className="text-xs text-muted">
            {analytics
              ? `${formatCAD(analytics.totalRevenue)} across the fleet`
              : "Revenue across every store"}
          </p>
        </div>
        <SalesRangeToggle
          value={granularity}
          onChange={setGranularity}
          label="Fleet sales range"
        />
      </div>

      {error ? (
        <p className="text-sm text-error-500">{error}</p>
      ) : loading && !analytics ? (
        <Bone style={{ height: 96, width: "100%", borderRadius: 8 }} />
      ) : (
        <>
          {/* Fleet revenue trend */}
          <div className="flex items-end gap-2" aria-hidden="true">
            {buckets.map((bucket, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary-500/70"
                  style={{
                    height: `${Math.round((bucket.revenue / maxRevenue) * 72)}px`,
                    minHeight: bucket.revenue > 0 ? 2 : 0,
                  }}
                />
                <span className="text-[10px] text-muted">{bucket.label}</span>
              </div>
            ))}
          </div>
          <ul className="sr-only">
            {buckets.map((bucket, i) => (
              <li key={i}>
                {bucket.label}: {formatCAD(bucket.revenue)}
              </li>
            ))}
          </ul>

          {/* Per-store ranking */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Top stores by revenue
            </h3>
            <ul className="space-y-1.5">
              {byStore.slice(0, MAX_RANKED_STORES).map((store) => (
                <li key={store.storeId} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 truncate text-xs text-foreground">
                    {store.storeName}
                  </span>
                  <span
                    className="h-2 rounded-full bg-primary-500/60"
                    style={{
                      width: `${Math.max(
                        4,
                        Math.round((store.totalRevenue / topStoreRevenue) * 100),
                      )}%`,
                    }}
                    aria-hidden="true"
                  />
                  <span className="ml-auto shrink-0 text-xs tabular-nums font-medium text-foreground">
                    {formatCAD(store.totalRevenue)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
