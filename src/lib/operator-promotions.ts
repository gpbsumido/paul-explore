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

export type PromotionStatus = "scheduled" | "active" | "ended";

export const DISCOUNT_PRESETS = [10, 15, 20, 25, 30, 40] as const;

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
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
  const safe = Math.min(Math.max(percent, 0), 100);
  return roundCents(listPrice * (1 - safe / 100));
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
