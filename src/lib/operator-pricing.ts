// ---------------------------------------------------------------------------
// Pricing & promotions: a client-side profit calculator over the store's list
// prices and recent sales. All pure, all take explicit inputs, all round money
// to cents. The revenue projection assumes weekly volume holds at the promo
// price, so it measures the immediate revenue an operator gives up (or keeps),
// not a demand/elasticity model.
// ---------------------------------------------------------------------------

import type { InventoryItem, Sale } from "@/types/operator";

/**
 * The discount options an operator can pick, per product or store-wide. Goes up
 * to a steep clearance cut, so a promotion can realistically dip below cost and
 * the profit calculator has something to warn about.
 */
export const DISCOUNT_STEPS = [0, 10, 20, 30, 40, 50] as const;

/**
 * The assumed gross-margin options for the profit calculator. Inventory only
 * carries a sale price, not a cost, so the operator plugs in a margin and cost
 * is derived from it (the "plug in your numbers" model of a profit calculator).
 */
export const MARGIN_STEPS = [30, 40, 50, 60] as const;

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

// ---------------------------------------------------------------------------
// Profit: cost of goods is modelled from an assumed gross margin on the list
// price, so an operator can see profit, not just revenue, and how a discount
// eats into the margin.
// ---------------------------------------------------------------------------

/**
 * The assumed unit cost of a product, derived from its list price and a gross
 * margin percentage. A 40% margin means cost is 60% of the list price.
 */
export function unitCost(listPrice: number, marginPercent: number): number {
  return toCents(listPrice * (1 - clampPercent(marginPercent) / 100));
}

export type ProductProfit = ProductPricing & {
  unitCost: number;
  weeklyProfitAtList: number;
  weeklyProfitAtPromo: number;
  belowCost: boolean;
};

/**
 * Layers profit onto a pricing row: the assumed unit cost, projected weekly
 * profit at both the list and promo price, and whether the promo price has
 * dipped below cost (a discount deeper than the margin).
 */
export function buildProductProfit(
  row: ProductPricing,
  marginPercent: number,
): ProductProfit {
  const cost = unitCost(row.listPrice, marginPercent);
  return {
    ...row,
    unitCost: cost,
    weeklyProfitAtList: toCents((row.listPrice - cost) * row.weeklyUnits),
    weeklyProfitAtPromo: toCents((row.promoPrice - cost) * row.weeklyUnits),
    belowCost: row.promoPrice < cost,
  };
}

/**
 * Builds a profit row for every inventory item: the pricing table with the
 * assumed-cost profit projection layered on each row.
 */
export function buildProfitTable(
  items: readonly InventoryItem[],
  sales: readonly Sale[],
  promoByItemId: Record<string, number> = {},
  marginPercent: number = 45,
  now: Date = new Date(),
): readonly ProductProfit[] {
  return buildPricingTable(items, sales, promoByItemId, now).map((row) =>
    buildProductProfit(row, marginPercent),
  );
}

export type ProfitSummary = {
  weeklyProfitAtList: number;
  weeklyProfitAtPromo: number;
  profitDelta: number;
  itemsBelowCost: number;
};

/**
 * Rolls the profit rows into the calculator headline: projected weekly profit
 * at list vs with the promos, the delta between them, and how many products the
 * chosen discounts have pushed below cost.
 */
export function summarizeProfit(
  rows: readonly ProductProfit[],
): ProfitSummary {
  let weeklyProfitAtList = 0;
  let weeklyProfitAtPromo = 0;
  let itemsBelowCost = 0;

  for (const row of rows) {
    weeklyProfitAtList += row.weeklyProfitAtList;
    weeklyProfitAtPromo += row.weeklyProfitAtPromo;
    if (row.belowCost) itemsBelowCost += 1;
  }

  return {
    weeklyProfitAtList: toCents(weeklyProfitAtList),
    weeklyProfitAtPromo: toCents(weeklyProfitAtPromo),
    profitDelta: toCents(weeklyProfitAtPromo - weeklyProfitAtList),
    itemsBelowCost,
  };
}
