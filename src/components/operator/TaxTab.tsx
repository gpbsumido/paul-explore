"use client";

import { useMemo } from "react";
import { useOperatorSales } from "@/hooks/useOperatorSales";
import { useOperatorStore } from "@/hooks/useOperatorStore";
import {
  getProvinceTax,
  buildTaxHistory,
  summarizeRemittance,
} from "@/lib/operator-tax";
import { formatCAD } from "@/lib/operator-sales";

interface TaxTabProps {
  storeId: string;
}

/** Formats a tax rate fraction as a percent string, e.g. 0.09975 -> "9.975%". */
function pct(rate: number): string {
  return `${+(rate * 100).toFixed(3)}%`;
}

/**
 * Tax tab for the store detail page. Operators are assumed to be in Canada, so
 * this reads the store's province, computes GST/HST/PST/QST on the sales, and
 * shows the latest remittance period plus a per-month history — all derived
 * from the sales data so there is no separate ledger to drift.
 */
export default function TaxTab({ storeId }: TaxTabProps) {
  const { store, loading: storeLoading } = useOperatorStore(storeId);
  const { sales, loading: salesLoading, error } = useOperatorSales(storeId);

  const province = store ? getProvinceTax(store.province) : null;

  const history = useMemo(
    () => (store ? buildTaxHistory(sales, store.province) : []),
    [sales, store],
  );

  const owed = useMemo(() => summarizeRemittance(history), [history]);

  const provincialLabel = store?.province === "QC" ? "QST" : "PST";
  const rateSummary = province
    ? province.hst > 0
      ? `HST ${pct(province.hst)}`
      : [
          `GST ${pct(province.gst)}`,
          province.pst > 0 ? `${provincialLabel} ${pct(province.pst)}` : null,
        ]
          .filter(Boolean)
          .join(" + ")
    : "";

  if (error) {
    return <p className="text-sm text-error-500 py-4">{error}</p>;
  }

  if ((storeLoading || salesLoading) && sales.length === 0) {
    return <TaxTabSkeleton />;
  }

  const latest = history[0] ?? null;

  return (
    <div className="space-y-5">
      {/* Province + regime banner */}
      {province && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {province.name}
            </p>
            <p className="text-xs text-muted">Sales tax regime</p>
          </div>
          <span className="rounded-full bg-primary-500/10 px-2.5 py-1 text-xs font-medium text-primary-600 dark:text-primary-400">
            {rateSummary}
          </span>
        </div>
      )}

      {/* How much the operator needs to remit */}
      <section className="rounded-lg border border-primary-400/40 bg-primary-500/5 p-4">
        <h3 className="text-sm font-semibold text-foreground">Tax to remit</h3>
        <p className="mt-0.5 text-xs text-muted">
          Collected across all periods and owed to the tax authorities.
        </p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
          {formatCAD(owed.totalOwed)}
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md bg-surface px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-muted">
              Federal (GST/HST) &middot; CRA
            </dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
              {formatCAD(owed.federalOwed)}
            </dd>
          </div>
          <div className="rounded-md bg-surface px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-muted">
              Provincial ({provincialLabel}){province ? ` · ${province.name}` : ""}
            </dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
              {formatCAD(owed.provincialOwed)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Latest remittance period */}
      {latest ? (
        <section className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Latest period
            </h3>
            <span className="text-xs tabular-nums text-muted">
              {latest.period}
            </span>
          </div>
          <dl className="mt-3 space-y-1.5 text-sm">
            <TaxLine label="Sales (pre-tax)" value={latest.subtotal} />
            {latest.gst > 0 && <TaxLine label="GST" value={latest.gst} />}
            {latest.pst > 0 && (
              <TaxLine label={provincialLabel} value={latest.pst} />
            )}
            {latest.hst > 0 && <TaxLine label="HST" value={latest.hst} />}
            <TaxLine label="Tax collected" value={latest.taxTotal} emphasize />
            <div className="border-t border-border pt-1.5">
              <TaxLine label="Total billed" value={latest.total} emphasize />
            </div>
          </dl>
        </section>
      ) : (
        <p className="text-sm text-muted py-8 text-center">
          No sales yet, so no tax to remit.
        </p>
      )}

      {/* Remittance history */}
      {history.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            Remittance history
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <caption className="sr-only">
                Sales tax collected per month for {province?.name}
              </caption>
              <thead>
                <tr className="text-muted">
                  <th scope="col" className="py-1.5 pr-3 text-left font-medium">
                    Period
                  </th>
                  <th scope="col" className="py-1.5 pr-3 font-medium">
                    Sales
                  </th>
                  <th scope="col" className="py-1.5 pr-3 font-medium">
                    Tax
                  </th>
                  <th scope="col" className="py-1.5 font-medium">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.period} className="border-t border-border">
                    <th
                      scope="row"
                      className="py-1.5 pr-3 text-left font-normal tabular-nums text-foreground"
                    >
                      {row.period}
                    </th>
                    <td className="py-1.5 pr-3 tabular-nums text-muted">
                      {formatCAD(row.subtotal)}
                    </td>
                    <td className="py-1.5 pr-3 tabular-nums text-muted">
                      {formatCAD(row.taxTotal)}
                    </td>
                    <td className="py-1.5 tabular-nums font-medium text-foreground">
                      {formatCAD(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function TaxLine({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: number;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={emphasize ? "font-medium text-foreground" : "text-muted"}>
        {label}
      </dt>
      <dd
        className={`tabular-nums ${
          emphasize ? "font-semibold text-foreground" : "text-foreground"
        }`}
      >
        {formatCAD(value)}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

import Bone from "./Bone";

function TaxTabSkeleton() {
  return (
    <div className="space-y-5">
      <Bone style={{ height: 56, width: "100%", borderRadius: 8 }} />
      <Bone style={{ height: 180, width: "100%", borderRadius: 8 }} />
      <Bone style={{ height: 120, width: "100%", borderRadius: 8 }} />
    </div>
  );
}
