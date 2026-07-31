// ---------------------------------------------------------------------------
// Sales history helpers: headline totals, per-product rollups, and a last-7-day
// revenue trend. All pure, all take explicit inputs, all round money to cents.
// ---------------------------------------------------------------------------

import type { Sale } from "@/types/operator";

export type SalesSummary = {
  totalRevenue: number;
  unitsSold: number;
  transactionCount: number;
  averageSale: number;
};

export type ProductSales = {
  productName: string;
  unitsSold: number;
  revenue: number;
};

export type SalesDayBucket = {
  day: string;
  revenue: number;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Rounds a currency value to the nearest cent. */
function toCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Rolls a sales list up into the headline numbers: total revenue, units sold,
 * transaction count, and the average value of a single sale.
 */
export function summarizeSales(sales: readonly Sale[]): SalesSummary {
  if (sales.length === 0) {
    return {
      totalRevenue: 0,
      unitsSold: 0,
      transactionCount: 0,
      averageSale: 0,
    };
  }

  let totalRevenue = 0;
  let unitsSold = 0;
  for (const sale of sales) {
    totalRevenue += sale.total;
    unitsSold += sale.quantity;
  }

  return {
    totalRevenue: toCents(totalRevenue),
    unitsSold,
    transactionCount: sales.length,
    averageSale: toCents(totalRevenue / sales.length),
  };
}

/**
 * Aggregates sales per product name and returns the top sellers by revenue,
 * highest first. Pass a limit to cap the list (defaults to 5).
 */
export function topSellingProducts(
  sales: readonly Sale[],
  limit: number = 5,
): readonly ProductSales[] {
  const byProduct = new Map<string, ProductSales>();
  for (const sale of sales) {
    const existing = byProduct.get(sale.productName);
    if (existing) {
      existing.unitsSold += sale.quantity;
      existing.revenue = toCents(existing.revenue + sale.total);
    } else {
      byProduct.set(sale.productName, {
        productName: sale.productName,
        unitsSold: sale.quantity,
        revenue: toCents(sale.total),
      });
    }
  }

  return [...byProduct.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/** The UTC calendar-day index (days since epoch) a timestamp falls in. */
function dayIndex(ms: number): number {
  return Math.floor(ms / MS_PER_DAY);
}

/**
 * Buckets sale revenue into the last 7 calendar days ending at `now`, oldest
 * bucket first. Sales outside the window are ignored. Each bucket is labelled
 * with its weekday so a chart can render it without more date math.
 */
export function salesByDay(
  sales: readonly Sale[],
  now: Date = new Date(),
): readonly SalesDayBucket[] {
  const todayIndex = dayIndex(now.getTime());
  const revenueByOffset = new Array<number>(7).fill(0);

  for (const sale of sales) {
    const saleIndex = dayIndex(new Date(sale.timestamp).getTime());
    const offset = 6 - (todayIndex - saleIndex);
    if (offset >= 0 && offset < 7) {
      revenueByOffset[offset] += sale.total;
    }
  }

  return revenueByOffset.map((revenue, offset) => {
    const dayMs = (todayIndex - (6 - offset)) * MS_PER_DAY;
    return {
      day: DAY_LABELS[new Date(dayMs).getUTCDay()],
      revenue: toCents(revenue),
    };
  });
}
