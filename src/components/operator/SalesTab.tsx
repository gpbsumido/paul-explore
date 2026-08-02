"use client";

import { useMemo, useState } from "react";
import { useOperatorSales } from "@/hooks/useOperatorSales";
import {
  summarizeSales,
  topSellingProducts,
  salesByPeriod,
  filterSalesForRange,
  formatCAD,
  type SalesGranularity,
} from "@/lib/operator-sales";
import { useOperatorStore } from "@/hooks/useOperatorStore";
import { storeTimeZone } from "@/lib/operator-timezone";
import SalesRangeToggle from "./SalesRangeToggle";
import TimeZoneNote from "./TimeZoneNote";

interface SalesTabProps {
  storeId: string;
}

const MAX_TOP_PRODUCTS = 5;

/**
 * Sales history tab for the store detail page. Fetches the store's sales,
 * shows headline totals, a 7-day revenue trend, the top sellers, and a feed
 * of the most recent transactions.
 */
export default function SalesTab({ storeId }: SalesTabProps) {
  const { sales, loading, error } = useOperatorSales(storeId);
  // Already in cache from the page above, so this costs nothing extra.
  const { store } = useOperatorStore(storeId);
  const [granularity, setGranularity] = useState<SalesGranularity>("month");

  // A store's day belongs to the store, not to whoever is looking at it. An
  // operator checking a Vancouver fridge from a hotel in Toronto should still
  // see Vancouver's days.
  const timeZone = useMemo(() => storeTimeZone(store), [store]);

  // Scope every figure to the selected range, not just the trend chart, so the
  // toggle actually filters the summary, top sellers, and recent list too.
  const windowed = useMemo(
    () => filterSalesForRange(sales, granularity, new Date(), timeZone),
    [sales, granularity, timeZone],
  );

  const summary = useMemo(() => summarizeSales(windowed), [windowed]);
  const topProducts = useMemo(
    () => topSellingProducts(windowed, MAX_TOP_PRODUCTS),
    [windowed],
  );
  const trend = useMemo(
    () => salesByPeriod(windowed, granularity, new Date(), timeZone),
    [windowed, granularity, timeZone],
  );
  const recent = useMemo(
    () =>
      [...windowed]
        .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
        .slice(0, 8),
    [windowed],
  );

  const maxTrend = Math.max(1, ...trend.map((t) => t.revenue));

  if (error) {
    return <p className="text-sm text-error-500 py-4">{error}</p>;
  }

  if (loading && sales.length === 0) {
    return <SalesTabSkeleton />;
  }

  if (sales.length === 0) {
    return (
      <p className="text-sm text-muted py-8 text-center">No sales yet.</p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Headline summary */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Revenue" value={formatCAD(summary.totalRevenue)} />
        <SummaryStat label="Units sold" value={String(summary.unitsSold)} />
        <SummaryStat
          label="Transactions"
          value={String(summary.transactionCount)}
        />
        <SummaryStat label="Avg sale" value={formatCAD(summary.averageSale)} />
      </dl>

      {/* Revenue trend with a day/week/month/year range */}
      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            Revenue trend
          </h3>
          <SalesRangeToggle value={granularity} onChange={setGranularity} />
        </div>
        <div className="mb-2">
          <TimeZoneNote timeZone={timeZone} />
        </div>
        <div className="flex items-end gap-2" aria-hidden="true">
          {trend.map((bucket, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary-500/70"
                style={{
                  height: `${Math.round((bucket.revenue / maxTrend) * 64)}px`,
                  minHeight: bucket.revenue > 0 ? 2 : 0,
                }}
              />
              <span className="text-[10px] text-muted">{bucket.label}</span>
            </div>
          ))}
        </div>
        <ul className="sr-only">
          {trend.map((bucket, i) => (
            <li key={i}>
              {bucket.label}: {formatCAD(bucket.revenue)}
            </li>
          ))}
        </ul>
      </section>

      {/* Top sellers */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Top sellers
        </h3>
        <ul className="space-y-1.5">
          {topProducts.map((product) => (
            <li
              key={product.productName}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <span className="flex-1 truncate text-foreground">
                {product.productName}
              </span>
              <span className="shrink-0 tabular-nums text-muted">
                {product.unitsSold} units
              </span>
              <span className="w-20 shrink-0 text-right tabular-nums font-medium text-foreground">
                {formatCAD(product.revenue)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Recent transactions */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Recent sales
        </h3>
        <ul className="space-y-1.5">
          {recent.map((sale) => (
            <li
              key={sale.id}
              className="flex items-center gap-3 text-xs text-muted"
            >
              <span className="flex-1 truncate text-foreground">
                {sale.productName}
              </span>
              <span className="shrink-0 tabular-nums">×{sale.quantity}</span>
              <span className="w-16 shrink-0 text-right tabular-nums font-medium text-foreground">
                {formatCAD(sale.total)}
              </span>
              <time
                className="w-24 shrink-0 text-right tabular-nums"
                dateTime={sale.timestamp}
              >
                {new Date(sale.timestamp).toLocaleDateString("en-CA", {
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
      <dt className="text-[11px] uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

import Bone from "./Bone";

function SalesTabSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-3 py-2.5"
          >
            <Bone style={{ height: 11, width: 56 }} />
            <Bone style={{ height: 20, width: 72 }} />
          </div>
        ))}
      </div>
      <Bone style={{ height: 80, width: "100%", borderRadius: 8 }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <Bone key={i} style={{ height: 36, width: "100%", borderRadius: 8 }} />
      ))}
    </div>
  );
}
