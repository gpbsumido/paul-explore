"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  fleetShrinkResponseSchema,
  type ShrinkSummary,
} from "@/lib/operator-shrink";
import { formatCAD } from "@/lib/operator-sales";
import { REMOVAL_REASON_LABELS } from "@/lib/operator-restock";
import DataLoadError from "./DataLoadError";
import Bone from "./Bone";

/** A labelled reason breakdown, e.g. "3 expired, 2 damaged". */
function reasonBreakdown(byReason: Record<string, number>): string {
  const parts = Object.entries(byReason)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, units]) => {
      const label =
        REMOVAL_REASON_LABELS[
          reason as keyof typeof REMOVAL_REASON_LABELS
        ]?.toLowerCase();
      return `${units} ${label ?? reason}`;
    });
  return parts.join(", ");
}

/** Reconciled coverage as a share of counted slots, for the honest caveat. */
function coverageNote(totals: ShrinkSummary): string {
  const total = totals.countedLines + totals.notCountedLines;
  if (total === 0) return "";
  const pct = Math.round((totals.countedLines / total) * 100);
  return `${pct}% of slots were counted (${totals.notCountedLines} skipped)`;
}

/**
 * Fleet shrink and loss. The headline is unexplained shrink — stock the system
 * expected that a physical count could not find, with no reason logged. That is
 * the theft-or-miscount signal, kept apart from reasoned removals, because
 * netting the two would hide the number an operator actually needs to chase.
 */
export default function LossReport() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["operator", "shrink-summary"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/operator/shrink-summary", { signal });
      if (!res.ok) throw new Error("Failed to load the loss report");
      return fleetShrinkResponseSchema.parse(await res.json());
    },
    staleTime: 60_000,
  });

  if (isError) {
    return (
      <DataLoadError what="the loss report" onRetry={() => void refetch()} />
    );
  }

  if (isPending) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Bone key={i} style={{ height: 92, width: "100%" }} />
          ))}
        </div>
        <Bone style={{ height: 200, width: "100%" }} />
      </div>
    );
  }

  const { totals, stores } = data;

  if (totals.countedLines === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-4 py-8 text-center">
        <p className="text-sm text-muted">
          No completed restock counts yet, so there is nothing to reconcile.
          Shrink shows up once a restocker confirms physical counts.
        </p>
        {/* An empty state that only explains itself leaves you nowhere. The
            fix for "no counts" is going and starting one. */}
        <Link
          href="/operator"
          className="mt-4 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Pick a store to count
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Headline: three numbers, worst one first and loudest */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-error-300 bg-error-50 p-4 dark:border-error-900 dark:bg-error-950/30">
          <p className="text-xs font-medium uppercase tracking-wide text-error-700 dark:text-error-400">
            Unexplained shrink
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-error-700 dark:text-error-400">
            {formatCAD(totals.unexplainedValue)}
          </p>
          <p className="text-xs text-error-700/80 dark:text-error-400/80">
            {totals.unexplainedUnits} units, no reason logged
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Explained loss
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {formatCAD(totals.explainedValue)}
          </p>
          <p className="text-xs text-muted">
            {Object.keys(totals.explainedByReason).length > 0
              ? reasonBreakdown(totals.explainedByReason)
              : `${totals.explainedUnits} units`}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Count coverage
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {totals.countedLines}
          </p>
          <p className="text-xs text-muted">{coverageNote(totals)}</p>
        </div>
      </div>

      <p className="text-xs text-muted">
        Unexplained shrink is stock the system expected that a count could not
        find, with no removal logged. Explained loss is stock pulled with a
        reason. Skipped counts can hide shrink, so coverage is part of the
        picture.
      </p>

      {/* Per-store, worst first */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Stores ranked by the value of unexplained shrink, worst first
          </caption>
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="px-4 py-2.5 font-medium">
                Store
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                Unexplained
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                Explained
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                Counted
              </th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr
                key={store.storeId}
                className="border-b border-border/60 last:border-0"
              >
                <th
                  scope="row"
                  className="px-4 py-2.5 font-medium text-foreground"
                >
                  {/* The whole point of ranking these is chasing the worst one,
                      so the name is the way into the counts behind the number. */}
                  <Link
                    href={`/operator/stores/${store.storeId}?tab=restock-history`}
                    className="text-primary-600 hover:underline dark:text-primary-400"
                  >
                    {store.storeName}
                  </Link>
                </th>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  <span
                    className={
                      store.unexplainedValue > 0
                        ? "font-semibold text-error-600 dark:text-error-400"
                        : "text-muted"
                    }
                  >
                    {formatCAD(store.unexplainedValue)}
                  </span>
                  <span className="ml-1 text-xs text-muted">
                    ({store.unexplainedUnits}u)
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                  {formatCAD(store.explainedValue)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                  {store.countedLines}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
