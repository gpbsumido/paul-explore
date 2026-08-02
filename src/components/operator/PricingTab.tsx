"use client";

import { useMemo, useState } from "react";
import { useOperatorInventory } from "@/hooks/useOperatorInventory";
import { useOperatorSales } from "@/hooks/useOperatorSales";
import { useOperatorStore } from "@/hooks/useOperatorStore";
import {
  DISCOUNT_STEPS,
  buildPricingTable,
  summarizePricing,
} from "@/lib/operator-pricing";
import { computeTax } from "@/lib/operator-tax";
import { formatCAD } from "@/lib/operator-sales";
import Bone from "./Bone";

interface PricingTabProps {
  storeId: string;
}

/**
 * Pricing & promotions tab: a client-side profit calculator. Operators pick a
 * per-product or store-wide discount and see the immediate weekly revenue
 * tradeoff, projected from the trailing-7-day sales demand at both the list and
 * the promo price. Everything is derived from inventory + sales already in
 * cache, the same derive-not-store approach as the Tax tab, so there is no
 * separate price ledger to drift and no write round-trip.
 */
export default function PricingTab({ storeId }: PricingTabProps) {
  const { items, loading: invLoading, error } = useOperatorInventory(storeId);
  const { sales, loading: salesLoading } = useOperatorSales(storeId);
  const { store } = useOperatorStore(storeId);

  // The chosen discount per item id. Absent means 0% (list price).
  const [promoByItemId, setPromoByItemId] = useState<Record<string, number>>(
    {},
  );

  const rows = useMemo(
    () => buildPricingTable(items, sales, promoByItemId),
    [items, sales, promoByItemId],
  );
  const summary = useMemo(() => summarizePricing(rows), [rows]);

  function setItemPromo(itemId: string, percent: number) {
    setPromoByItemId((prev) => ({ ...prev, [itemId]: percent }));
  }

  function applyToAll(percent: number) {
    setPromoByItemId(
      Object.fromEntries(items.map((item) => [item.id, percent])),
    );
  }

  if (error) {
    return <p className="text-sm text-error-500 py-4">{error}</p>;
  }

  if ((invLoading || salesLoading) && items.length === 0) {
    return <PricingTabSkeleton />;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted py-8 text-center">
        No products stocked, so there is nothing to price yet.
      </p>
    );
  }

  const givingUp = summary.revenueDelta < 0;

  return (
    <div className="space-y-5">
      {/* Store-wide campaign */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold text-foreground">
          Store-wide campaign
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          Apply one discount to every product, then fine-tune below.
        </p>
        <div
          className="mt-3 flex flex-wrap gap-1.5"
          role="group"
          aria-label="Apply a discount to every product"
        >
          {DISCOUNT_STEPS.map((step) => (
            <button
              type="button"
              key={step}
              onClick={() => applyToAll(step)}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-primary-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            >
              {step === 0 ? "Clear all" : `${step}% off`}
            </button>
          ))}
        </div>
      </section>

      {/* Calculator headline */}
      <section className="rounded-lg border border-primary-400/40 bg-primary-500/5 p-4">
        <h3 className="text-sm font-semibold text-foreground">
          Projected weekly revenue
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          Based on the last 7 days of sales, assuming volume holds at the new
          price.
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md bg-surface px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-muted">
              At list price
            </dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
              {formatCAD(summary.weeklyRevenueAtList)}
            </dd>
          </div>
          <div className="rounded-md bg-surface px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-muted">
              With promos
            </dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
              {formatCAD(summary.weeklyRevenueAtPromo)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-sm">
          <span className="text-muted">Revenue impact: </span>
          <span
            className={`font-semibold tabular-nums ${
              givingUp ? "text-warning-600 dark:text-warning-400" : "text-muted"
            }`}
          >
            {givingUp ? "−" : ""}
            {formatCAD(Math.abs(summary.revenueDelta))} / week
          </span>
          {summary.itemsOnPromo > 0 && (
            <span className="text-muted">
              {" "}
              &middot; {summary.itemsOnPromo} on promo at {summary.avgDiscount}%
              avg
            </span>
          )}
        </p>
      </section>

      {/* Per-product pricing */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Per-product pricing
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              List price, chosen discount, promo price and projected weekly
              revenue per product
            </caption>
            <thead>
              <tr className="text-muted">
                <th scope="col" className="py-1.5 pr-3 font-medium">
                  Product
                </th>
                <th scope="col" className="py-1.5 pr-3 text-right font-medium">
                  List
                </th>
                <th scope="col" className="py-1.5 pr-3 text-right font-medium">
                  Promo
                </th>
                <th scope="col" className="py-1.5 pr-3 text-right font-medium">
                  With tax
                </th>
                <th scope="col" className="py-1.5 font-medium">
                  Discount
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const taxed = store
                  ? computeTax(row.promoPrice, store.province).total
                  : row.promoPrice;
                const discounted = row.promoPercent > 0;
                return (
                  <tr key={row.itemId} className="border-t border-border">
                    <th
                      scope="row"
                      className="py-2 pr-3 text-left font-normal text-foreground"
                    >
                      {row.productName}
                      <span className="block text-[11px] text-muted">
                        {row.weeklyUnits}/wk
                      </span>
                    </th>
                    <td className="py-2 pr-3 text-right tabular-nums text-muted">
                      <span className={discounted ? "line-through" : ""}>
                        {formatCAD(row.listPrice)}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums font-medium text-foreground">
                      {formatCAD(row.promoPrice)}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-muted">
                      {formatCAD(taxed)}
                    </td>
                    <td className="py-2">
                      <div
                        className="flex flex-wrap gap-1"
                        role="group"
                        aria-label={`Discount for ${row.productName}`}
                      >
                        {DISCOUNT_STEPS.map((step) => {
                          const selected = row.promoPercent === step;
                          return (
                            <button
                              type="button"
                              key={step}
                              aria-pressed={selected}
                              aria-label={`Set ${row.productName} discount to ${step}%`}
                              onClick={() => setItemPromo(row.itemId, step)}
                              className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
                                selected
                                  ? "bg-primary-600 text-white"
                                  : "border border-border text-muted hover:text-foreground"
                              }`}
                            >
                              {step}%
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function PricingTabSkeleton() {
  return (
    <div className="space-y-5">
      <Bone style={{ height: 84, width: "100%", borderRadius: 8 }} />
      <Bone style={{ height: 140, width: "100%", borderRadius: 8 }} />
      <Bone style={{ height: 180, width: "100%", borderRadius: 8 }} />
    </div>
  );
}
