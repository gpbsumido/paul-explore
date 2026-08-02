// ---------------------------------------------------------------------------
// Pricing & promotions: a client-side profit calculator over the store's list
// prices and recent sales. All pure, all take explicit inputs, all round money
// to cents. The revenue projection assumes weekly volume holds at the promo
// price, so it measures the immediate revenue an operator gives up (or keeps),
// not a demand/elasticity model.
// ---------------------------------------------------------------------------

import type { InventoryItem, Sale } from "@/types/operator";

/** The discount options an operator can pick, per product or store-wide. */
export const DISCOUNT_STEPS = [0, 5, 10, 15, 20, 25] as const;
export type DiscountStep = (typeof DISCOUNT_STEPS)[number];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Rounds a currency value to the nearest cent. */
function toCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Clamps a discount percentage into the sensible 0-100 range. */
function clampPercent(percent: number): number {
  return Math.max(0, Math.min(100, percent));
}

/**
 * The price after applying a discount, rounded to the cent. A 0% discount
 * returns the list price unchanged; anything outside 0-100 is clamped first.
 */
export function promoPrice(listPrice: number, promoPercent: number): number {
  return toCents(listPrice * (1 - clampPercent(promoPercent) / 100));
}

/**
 * Units of a given product sold within the trailing `days` window ending at
 * `now`. This is the demand signal the calculator multiplies against price to
 * project a week of revenue.
 */
export function weeklyUnitsFor(
  sales: readonly Sale[],
  productName: string,
  now: Date = new Date(),
  days: number = 7,
): number {
  const cutoff = now.getTime() - days * MS_PER_DAY;
  let units = 0;
  for (const sale of sales) {
    if (
      sale.productName === productName &&
      new Date(sale.timestamp).getTime() >= cutoff
    ) {
      units += sale.quantity;
    }
  }
  return units;
}

export type ProductPricing = {
  itemId: string;
  productName: string;
  category: string;
  listPrice: number;
  promoPercent: number;
  promoPrice: number;
  weeklyUnits: number;
  weeklyRevenueAtList: number;
  weeklyRevenueAtPromo: number;
};

/**
 * Builds a single pricing row: the product's list price and chosen discount
 * joined with its recent weekly demand, projecting a week of revenue at both
 * the list and the promo price.
 */
export function buildProductPricing(
  item: InventoryItem,
  sales: readonly Sale[],
  promoPercent: number,
  now: Date = new Date(),
): ProductPricing {
  const percent = clampPercent(promoPercent);
  const price = promoPrice(item.price, percent);
  const weeklyUnits = weeklyUnitsFor(sales, item.productName, now);
  return {
    itemId: item.id,
    productName: item.productName,
    category: item.category,
    listPrice: item.price,
    promoPercent: percent,
    promoPrice: price,
    weeklyUnits,
    weeklyRevenueAtList: toCents(item.price * weeklyUnits),
    weeklyRevenueAtPromo: toCents(price * weeklyUnits),
  };
}

/**
 * Builds a pricing row for every inventory item, applying the per-item discount
 * from `promoByItemId` (defaulting to 0 for items with no chosen discount).
 */
export function buildPricingTable(
  items: readonly InventoryItem[],
  sales: readonly Sale[],
  promoByItemId: Record<string, number> = {},
  now: Date = new Date(),
): readonly ProductPricing[] {
  return items.map((item) =>
    buildProductPricing(item, sales, promoByItemId[item.id] ?? 0, now),
  );
}

export type PricingSummary = {
  itemCount: number;
  itemsOnPromo: number;
  avgDiscount: number;
  weeklyRevenueAtList: number;
  weeklyRevenueAtPromo: number;
  revenueDelta: number;
};

/**
 * Rolls the pricing rows into the calculator headline: projected weekly revenue
 * at list vs with the chosen promos, the delta between them (negative when the
 * operator is giving revenue up now), and how many products are on promo at
 * what average discount.
 */
export function summarizePricing(
  rows: readonly ProductPricing[],
): PricingSummary {
  let weeklyRevenueAtList = 0;
  let weeklyRevenueAtPromo = 0;
  let itemsOnPromo = 0;
  let discountSum = 0;

  for (const row of rows) {
    weeklyRevenueAtList += row.weeklyRevenueAtList;
    weeklyRevenueAtPromo += row.weeklyRevenueAtPromo;
    if (row.promoPercent > 0) {
      itemsOnPromo += 1;
      discountSum += row.promoPercent;
    }
  }

  return {
    itemCount: rows.length,
    itemsOnPromo,
    avgDiscount: itemsOnPromo > 0 ? toCents(discountSum / itemsOnPromo) : 0,
    weeklyRevenueAtList: toCents(weeklyRevenueAtList),
    weeklyRevenueAtPromo: toCents(weeklyRevenueAtPromo),
    revenueDelta: toCents(weeklyRevenueAtPromo - weeklyRevenueAtList),
  };
}
