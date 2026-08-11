"use client";

import { useQuery } from "@tanstack/react-query";
import { financeResponseSchema } from "@/lib/operator-finance";
import { formatCAD } from "@/lib/operator-sales";
import { toCsv, downloadCsv } from "@/lib/csv";
import DataLoadError from "./DataLoadError";
import Bone from "./Bone";

/** Formats an ISO week start as a short "Mmm D" label. */
function weekLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

/**
 * Fleet finance: weekly payout history with the fees shown, not folded in.
 * Gross revenue minus the transaction cut minus the platform fee is what
 * actually lands, and separating them lets an operator tell a slow week from an
 * expensive one.
 */
export default function FinanceReport() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["operator", "finance"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/operator/finance", { signal });
      if (!res.ok) throw new Error("Failed to load finance");
      return financeResponseSchema.parse(await res.json());
    },
    staleTime: 60_000,
  });

  if (isError) {
    return <DataLoadError what="finance" onRetry={() => void refetch()} />;
  }

  if (isPending) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Bone key={i} style={{ height: 92, width: "100%" }} />
          ))}
        </div>
        <Bone style={{ height: 240, width: "100%" }} />
      </div>
    );
  }

  const { totals, weeks, fees } = data;

  const exportCsv = () => {
    const csv = toCsv(weeks, [
      { header: "Week of", value: (w) => weekLabel(w.weekStart) },
      { header: "Gross revenue", value: (w) => w.grossRevenue },
      { header: "Transactions", value: (w) => w.transactionCount },
      { header: "Transaction fees", value: (w) => w.transactionFees },
      { header: "Platform fees", value: (w) => w.platformFees },
      { header: "Net payout", value: (w) => w.netPayout },
    ]);
    downloadCsv("fleet-finance-weekly.csv", csv);
  };

  // A payout is only good news when it's positive; a loss shown in green is the
  // kind of dishonest state the rest of this dashboard avoids.
  const positive = totals.netPayout >= 0;
  const payoutCard = positive
    ? "border-success-300 bg-success-50 dark:border-success-900 dark:bg-success-950/30"
    : "border-error-300 bg-error-50 dark:border-error-900 dark:bg-error-950/30";
  const payoutText = positive
    ? "text-success-700 dark:text-success-400"
    : "text-error-700 dark:text-error-400";

  return (
    <div className="space-y-6">
      {/* Headline totals over the window */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={`rounded-xl border p-4 ${payoutCard}`}>
          <p
            className={`text-xs font-medium uppercase tracking-wide ${payoutText}`}
          >
            Net payout (8 weeks)
          </p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${payoutText}`}>
            {formatCAD(totals.netPayout)}
          </p>
          <p className={`text-xs opacity-80 ${payoutText}`}>
            {totals.transactionCount.toLocaleString()} transactions
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Gross revenue
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {formatCAD(totals.grossRevenue)}
          </p>
          <p className="text-xs text-muted">before fees</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Fees
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {formatCAD(totals.transactionFees + totals.platformFees)}
          </p>
          <p className="text-xs text-muted">transaction + platform</p>
        </div>
      </div>

      {/* Fee transparency: the model, stated */}
      <p className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted">
        <span className="font-medium text-foreground">How fees work:</span>{" "}
        {Math.round(fees.transactionRate * 100)}% +{" "}
        {formatCAD(fees.transactionFlat)} per transaction, plus{" "}
        {formatCAD(fees.platformPerUnitMonthly)} per unit per month. Payouts run
        weekly.
      </p>

      {/* Weekly payout history, newest first */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Weekly payouts
        </h2>
        {/* No server action exists for a payout, so the honest next step is
            getting the numbers somewhere they can be reconciled. */}
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover"
        >
          Download CSV
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Weekly payouts, newest first, with gross revenue, fees and net
            payout
          </caption>
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="px-4 py-2.5 font-medium">
                Week of
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                Gross
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                Txns
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                Fees
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                Net payout
              </th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr
                key={week.weekStart}
                className="border-b border-border/60 last:border-0"
              >
                <th
                  scope="row"
                  className="px-4 py-2.5 font-medium text-foreground"
                >
                  {weekLabel(week.weekStart)}
                </th>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                  {formatCAD(week.grossRevenue)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                  {week.transactionCount}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                  {formatCAD(week.transactionFees + week.platformFees)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-foreground">
                  {formatCAD(week.netPayout)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
