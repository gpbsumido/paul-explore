"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PERFORMANCE_RANGES,
  productPerformanceResponseSchema,
  type PerformanceRangeId,
  type ProductPerformanceRow,
} from "@/lib/operator-product-performance";
import { formatCAD } from "@/lib/operator-sales";
import { toCsv } from "@/lib/csv";
import DataLoadError from "./DataLoadError";
import Bone from "./Bone";

/** Triggers a client-side download of a CSV string. */
function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** A relative-performance verdict, as text and colour (never colour alone). */
function verdict(row: ProductPerformanceRow): {
  label: string;
  className: string;
} {
  if (!row.hasSales) {
    return {
      label: "No sales",
      className:
        "bg-warning-100 text-warning-700 dark:bg-warning-950/40 dark:text-warning-400",
    };
  }
  if (row.performanceIndex >= 110) {
    return {
      label: "Above avg",
      className:
        "bg-success-100 text-success-700 dark:bg-success-950/40 dark:text-success-400",
    };
  }
  if (row.performanceIndex <= 90) {
    return {
      label: "Below avg",
      className:
        "bg-warning-100 text-warning-700 dark:bg-warning-950/40 dark:text-warning-400",
    };
  }
  return {
    label: "Average",
    className: "bg-surface text-muted border border-border",
  };
}

/**
 * Fleet product performance: every product ranked by revenue with its daily
 * sales rate and an index against its category average. Dead SKUs (stocked, no
 * sales in the window) stay in the table rather than disappearing, because a
 * report that only lists what sold cannot tell you what to cut.
 */
export default function ProductPerformance() {
  const [rangeId, setRangeId] = useState<PerformanceRangeId>("30d");

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["operator", "product-performance", rangeId],
    queryFn: async ({ signal }) => {
      const res = await fetch(
        `/api/operator/product-performance?range=${rangeId}`,
        { signal },
      );
      if (!res.ok) throw new Error("Failed to load product performance");
      return productPerformanceResponseSchema.parse(await res.json());
    },
    staleTime: 60_000,
  });

  const exportCsv = () => {
    if (!data) return;
    const csv = toCsv(data.products, [
      { header: "Product", value: (r) => r.productName },
      { header: "Category", value: (r) => r.category },
      { header: "Units", value: (r) => r.unitsSold },
      { header: "Avg per day", value: (r) => r.avgPerDay },
      { header: "Revenue", value: (r) => r.revenue },
      { header: "Category index", value: (r) => r.performanceIndex },
    ]);
    downloadCsv(`product-performance-${rangeId}.csv`, csv);
  };

  const hasRows = !isPending && !isError && data.products.length > 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Product performance
        </h2>
        <div className="flex items-center gap-2">
          {hasRows && (
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500"
            >
              Download CSV
            </button>
          )}
          <div
            role="group"
            aria-label="Performance range"
            className="inline-flex rounded-lg border border-border bg-surface p-0.5"
          >
            {PERFORMANCE_RANGES.map((range) => {
              const isActive = range.id === rangeId;
              return (
                <button
                  key={range.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setRangeId(range.id)}
                  className={`paul-touch-min rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500 ${
                    isActive
                      ? "bg-primary-600 text-white"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isError ? (
        <DataLoadError
          what="product performance"
          onRetry={() => void refetch()}
        />
      ) : isPending ? (
        <div className="space-y-2" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bone key={i} style={{ height: 40, width: "100%" }} />
          ))}
        </div>
      ) : data.products.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          No products stocked or sold in this window yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Fleet products over the last {data.days} days, ranked by revenue
            </caption>
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Product
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Category
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Units
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Avg / day
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Revenue
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Vs category
                </th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((row) => {
                const v = verdict(row);
                return (
                  <tr
                    key={row.productName}
                    className="border-b border-border/60 last:border-0"
                  >
                    <th
                      scope="row"
                      className="px-4 py-2.5 font-medium text-foreground"
                    >
                      {row.productName}
                    </th>
                    <td className="px-4 py-2.5 text-muted">{row.category}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                      {row.unitsSold}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                      {row.avgPerDay}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                      {formatCAD(row.revenue)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${v.className}`}
                      >
                        {v.label}
                        {row.hasSales && (
                          <span className="tabular-nums opacity-80">
                            {row.performanceIndex}
                          </span>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
