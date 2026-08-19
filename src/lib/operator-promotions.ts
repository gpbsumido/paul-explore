// ---------------------------------------------------------------------------
// Promotions: the client half
//
// The Pricing tab could model a discount but never run one, so it could predict
// and never be wrong out loud. These helpers answer the three questions about a
// scheduled promotion: is it on, does it cover this product, and what did it do.
//
// Status is derived here rather than trusted from the server payload, so a tab
// left open overnight does not keep calling a finished promotion "active".
// ---------------------------------------------------------------------------

import type { Promotion } from "@/types/operator";
import { clampPercent, toCents } from "@/lib/operator-utils";

export type PromotionStatus = "scheduled" | "active" | "ended";

export const DISCOUNT_PRESETS = [10, 15, 20, 25, 30, 40] as const;

export type PerformanceTotals = {
  units: number;
  revenue: number;
};

export type PromotionPerformance = {
  window: PerformanceTotals;
  baseline: PerformanceTotals;
  unitsChangePercent: number | null;
  revenueChangePercent: number | null;
  note: string;
};

/**
 * The longest stretch a promotion is measured over, matching the API.
 *
 * An open-ended promotion left running for a year gives a year-long window, and
 * the baseline doubles the work. Clamping keeps it bounded, and the clamp is
 * reported rather than hidden.
 */
export const MAX_MEASURE_DAYS = 180;

const DAY_MS = 24 * 60 * 60 * 1000;

export type MeasurementWindow = {
  start: Date;
  end: Date;
  clamped: boolean;
};

export type SaleLike = {
  productName: string;
  quantity: number;
  total: number;
  timestamp: string;
};

/** The window actually measured: the most recent MAX_MEASURE_DAYS of it. */
export function measurementWindow(start: Date, end: Date): MeasurementWindow {
  const maxMs = MAX_MEASURE_DAYS * DAY_MS;
  if (end.getTime() - start.getTime() <= maxMs) {
    return { start, end, clamped: false };
  }
  return { start: new Date(end.getTime() - maxMs), end, clamped: true };
}

function totalsFor(
  promo: Pick<Promotion, "productName">,
  sales: readonly SaleLike[],
  from: Date,
  to: Date,
): PerformanceTotals {
  let units = 0;
  let revenue = 0;

  for (const sale of sales) {
    const at = Date.parse(sale.timestamp);
    if (at < from.getTime() || at >= to.getTime()) continue;
    if (!appliesTo(promo, sale.productName)) continue;

    units += sale.quantity;
    revenue += sale.total;
  }

  return { units, revenue: toCents(revenue) };
}

function changePercent(current: number, before: number): number | null {
  if (before === 0) return null;
  return Math.round(((current - before) / before) * 100);
}

/**
 * The window against the equal-length period immediately before it.
 *
 * A before-and-after, not attribution. Used by the seed fallback so the demo
 * still shows a readout with the backend unreachable; the live path takes this
 * from the API, which does the same arithmetic in SQL.
 */
export function comparePerformance(
  promo: Pick<Promotion, "productName">,
  sales: readonly SaleLike[],
  windowStart: Date,
  windowEnd: Date,
): Omit<PromotionPerformance, "note"> {
  const span = windowEnd.getTime() - windowStart.getTime();
  const baselineStart = new Date(windowStart.getTime() - span);

  const window = totalsFor(promo, sales, windowStart, windowEnd);
  const baseline = totalsFor(promo, sales, baselineStart, windowStart);

  return {
    window,
    baseline,
    unitsChangePercent: changePercent(window.units, baseline.units),
    revenueChangePercent: changePercent(window.revenue, baseline.revenue),
  };
}

/** Derived from the window and the clock, so it cannot go stale in an open tab. */
export function promotionStatus(
  promo: Pick<Promotion, "startsAt" | "endsAt">,
  now: Date = new Date(),
): PromotionStatus {
  const start = Date.parse(promo.startsAt);
  if (now.getTime() < start) return "scheduled";

  if (promo.endsAt !== null) {
    if (now.getTime() >= Date.parse(promo.endsAt)) return "ended";
  }
  return "active";
}

/** A null product name means the promotion covers the whole store. */
export function appliesTo(
  promo: Pick<Promotion, "productName">,
  productName: string,
): boolean {
  return promo.productName === null || promo.productName === productName;
}

/** The promo price for a list price, clamped so a bad percent cannot invent one. */
export function discountedPrice(listPrice: number, percent: number): number {
  const safe = clampPercent(percent);
  return toCents(listPrice * (1 - safe / 100));
}

/**
 * The deepest active discount covering a product, or zero.
 *
 * Overlapping promotions are not merged. Stacking two discounts is almost never
 * what an operator means, and picking the deepest is both predictable and the
 * one that favours the customer standing at the fridge.
 */
export function bestDiscountFor(
  promos: readonly Promotion[],
  productName: string,
  now: Date = new Date(),
): number {
  let best = 0;
  for (const promo of promos) {
    if (promotionStatus(promo, now) !== "active") continue;
    if (!appliesTo(promo, productName)) continue;
    if (promo.percent > best) best = promo.percent;
  }
  return best;
}

/** Promotions that are on right now, newest window first. */
export function activePromotions(
  promos: readonly Promotion[],
  now: Date = new Date(),
): Promotion[] {
  return promos.filter((promo) => promotionStatus(promo, now) === "active");
}

/** How a promotion reads in a list: "20% off Energy Bar" / "15% off everything". */
export function describePromotion(promo: Promotion): string {
  const target = promo.productName ?? "everything";
  return `${promo.percent}% off ${target}`;
}
