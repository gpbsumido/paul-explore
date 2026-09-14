"use client";

import { useState } from "react";
import { formatCents } from "@/lib/budget/format";
import {
  historicalTotals,
  periodComparison,
  type Granularity,
} from "@/lib/budget/analytics";
import type { Budget } from "@/lib/budget/types";

const card = "rounded-2xl border border-border bg-surface p-4";

/** How many periods each granularity looks back over, and what to call one. */
const SPAN: Record<Granularity, { count: number; noun: string; label: string }> = {
  week: { count: 8, noun: "week", label: "Week" },
  month: { count: 6, noun: "month", label: "Month" },
  year: { count: 3, noun: "year", label: "Year" },
};

const GRANULARITIES: Granularity[] = ["week", "month", "year"];

/**
 * Historical spend rolled up by week, month, or year, with the current period
 * compared to the one before it. Takes `now` so the buckets are testable
 * against a fixed date rather than whatever day the suite runs on.
 */
export default function HistoryPanel({
  budget,
  now = new Date(),
}: {
  budget: Budget;
  now?: Date;
}) {
  const [granularity, setGranularity] = useState<Granularity>("month");
  const span = SPAN[granularity];
  const buckets = historicalTotals(budget.expenses, now, granularity, span.count);
  const cmp = periodComparison(budget.expenses, now, granularity);
  const max = Math.max(1, ...buckets.map((b) => b.totalCents));

  const up = cmp.deltaCents > 0;
  const sign = up ? "+" : cmp.deltaCents < 0 ? "−" : "";
  const deltaLabel = `${sign}${formatCents(Math.abs(cmp.deltaCents))}`;
  const pctLabel = cmp.deltaPct === null ? "—" : `${sign}${Math.abs(cmp.deltaPct)}%`;

  return (
    <section aria-label="History" className={card}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          History
        </p>
        <div role="group" aria-label="Group spending by" className="flex gap-1">
          {GRANULARITIES.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={granularity === g}
              onClick={() => setGranularity(g)}
              className={`rounded-lg px-3 py-1 text-sm transition ${
                granularity === g
                  ? "bg-[var(--color-feature-budget)] text-background"
                  : "border border-border text-foreground hover:bg-background"
              }`}
            >
              {SPAN[g].label}
            </button>
          ))}
        </div>
      </div>

      <p data-testid="period-comparison" className="mb-4 text-sm text-muted">
        This {span.noun}:{" "}
        <span className="font-semibold text-foreground">
          {formatCents(cmp.currentCents)}
        </span>{" "}
        <span className={up ? "text-error-600 dark:text-error-400" : "text-foreground"}>
          ({deltaLabel}, {pctLabel})
        </span>{" "}
        vs last {span.noun} {formatCents(cmp.previousCents)}
      </p>

      <ul aria-label="History" className="space-y-1.5">
        {buckets.map((b) => (
          <li key={b.start} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 text-muted">{b.label}</span>
            <span className="h-3 flex-1 overflow-hidden rounded bg-background">
              <span
                className="block h-full rounded bg-[var(--color-feature-budget)]"
                style={{ width: `${(b.totalCents / max) * 100}%` }}
              />
            </span>
            <span className="w-20 shrink-0 text-right tabular-nums font-medium text-foreground">
              {formatCents(b.totalCents)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
