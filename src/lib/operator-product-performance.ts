// ---------------------------------------------------------------------------
// Product performance: which products carry the fleet and which are dead
// weight. Pure functions over sales and inventory. A product's revenue is
// indexed against its own category's average, so "good" is relative to what it
// competes with (a $1 gum is not judged against a $12 sandwich), and stocked
// products with no sales are kept in so the shelf's dead SKUs surface rather
// than vanishing from a report that only lists what sold.
// ---------------------------------------------------------------------------

import { z } from "zod";
import type { InventoryItem, Sale } from "@/types/operator";

/** The day windows the performance view can be scoped to. */
export const PERFORMANCE_RANGES = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
] as const;

export type PerformanceRangeId = (typeof PERFORMANCE_RANGES)[number]["id"];

export type ProductPerformanceRow = {
  productName: string;
  category: string;
  unitsSold: number;
  revenue: number;
  /** Units sold per day over the window, to one decimal. */
  avgPerDay: number;
  /** Revenue as a percentage of the category's average product revenue; 100 is average. */
  performanceIndex: number;
  hasSales: boolean;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Rounds a currency value to the nearest cent. */
function toCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Rounds to a single decimal place. */
function toTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

type Accumulator = { category: string; unitsSold: number; revenue: number };

/**
 * Rolls fleet sales and inventory into a per-product performance table over the
 * trailing `days` window ending at `now`. Every product that either sold or is
 * stocked gets a row; each row's revenue is indexed against the average product
 * revenue in its category. Ranked by revenue, highest first.
 */
export function fleetProductPerformance(
  items: readonly InventoryItem[],
  sales: readonly Sale[],
  days: number,
  now: Date = new Date(),
): readonly ProductPerformanceRow[] {
  const windowDays = Math.max(1, days);
  const cutoff = now.getTime() - windowDays * MS_PER_DAY;

  const byProduct = new Map<string, Accumulator>();

  // Sales first: they carry the category and the money.
  for (const sale of sales) {
    if (new Date(sale.timestamp).getTime() < cutoff) continue;
    const existing = byProduct.get(sale.productName);
    if (existing) {
      existing.unitsSold += sale.quantity;
      existing.revenue = toCents(existing.revenue + sale.total);
    } else {
      byProduct.set(sale.productName, {
        category: sale.category,
        unitsSold: sale.quantity,
        revenue: toCents(sale.total),
      });
    }
  }

  // Stocked products with no sales in the window are dead SKUs, not absences.
  for (const item of items) {
    if (!byProduct.has(item.productName)) {
      byProduct.set(item.productName, {
        category: item.category,
        unitsSold: 0,
        revenue: 0,
      });
    }
  }

  // Category means, for the relative index.
  const categoryTotals = new Map<string, { revenue: number; count: number }>();
  for (const { category, revenue } of byProduct.values()) {
    const total = categoryTotals.get(category) ?? { revenue: 0, count: 0 };
    total.revenue += revenue;
    total.count += 1;
    categoryTotals.set(category, total);
  }

  const rows: ProductPerformanceRow[] = [...byProduct.entries()].map(
    ([productName, acc]) => {
      const total = categoryTotals.get(acc.category);
      const mean = total && total.count > 0 ? total.revenue / total.count : 0;
      return {
        productName,
        category: acc.category,
        unitsSold: acc.unitsSold,
        revenue: acc.revenue,
        avgPerDay: toTenth(acc.unitsSold / windowDays),
        performanceIndex: mean > 0 ? Math.round((acc.revenue / mean) * 100) : 0,
        hasSales: acc.unitsSold > 0,
      };
    },
  );

  return rows.sort(
    (a, b) => b.revenue - a.revenue || a.productName.localeCompare(b.productName),
  );
}

/** Resolves a range id to its day window, defaulting to 30 days. */
export function daysForRange(rangeId: string): number {
  return (
    PERFORMANCE_RANGES.find((r) => r.id === rangeId)?.days ?? 30
  );
}

/** Runtime shape of a performance row, for validating the API response. */
export const productPerformanceRowSchema = z.object({
  productName: z.string(),
  category: z.string(),
  unitsSold: z.number().int().min(0),
  revenue: z.number().min(0),
  avgPerDay: z.number().min(0),
  performanceIndex: z.number().int().min(0),
  hasSales: z.boolean(),
});

/** The product-performance endpoint response. */
export const productPerformanceResponseSchema = z.object({
  rangeId: z.string(),
  days: z.number().int().positive(),
  products: z.array(productPerformanceRowSchema),
});

export type ProductPerformanceResponse = z.infer<
  typeof productPerformanceResponseSchema
>;
