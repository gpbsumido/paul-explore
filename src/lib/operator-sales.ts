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

export type SalesGranularity = "day" | "week" | "month" | "year";

export type SalesPeriodBucket = {
  label: string;
  start: string;
  revenue: number;
  units: number;
};

export type FleetStoreSales = {
  storeId: string;
  storeName: string;
  sales: readonly Sale[];
};

export type FleetStoreTotal = {
  storeId: string;
  storeName: string;
  totalRevenue: number;
  unitsSold: number;
};

export type FleetSalesAnalytics = {
  granularity: SalesGranularity;
  buckets: readonly SalesPeriodBucket[];
  byStore: readonly FleetStoreTotal[];
  totalRevenue: number;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const PERIOD_COUNT: Record<SalesGranularity, number> = {
  day: 7,
  week: 8,
  month: 12,
  year: 5,
};

const CAD = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

/** Formats a number as a Canadian-dollar amount, e.g. 1234.5 -> "$1,234.50". */
export function formatCAD(value: number): string {
  return CAD.format(value);
}

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

type PeriodDef = { startMs: number; endMs: number; label: string };

/**
 * Builds the fixed set of period windows for a granularity, ending at `now` and
 * ordered oldest-first: 7 days, 8 weeks, 12 months, or 5 years.
 */
function buildPeriods(granularity: SalesGranularity, now: Date): PeriodDef[] {
  const count = PERIOD_COUNT[granularity];
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const periods: PeriodDef[] = [];

  for (let i = count - 1; i >= 0; i--) {
    if (granularity === "day") {
      const start = Date.UTC(y, m, d) - i * MS_PER_DAY;
      periods.push({
        startMs: start,
        endMs: start + MS_PER_DAY,
        label: DAY_LABELS[new Date(start).getUTCDay()],
      });
    } else if (granularity === "week") {
      const end = Date.UTC(y, m, d) + MS_PER_DAY - i * 7 * MS_PER_DAY;
      const start = end - 7 * MS_PER_DAY;
      const sd = new Date(start);
      periods.push({
        startMs: start,
        endMs: end,
        label: `${MONTH_LABELS[sd.getUTCMonth()]} ${sd.getUTCDate()}`,
      });
    } else if (granularity === "month") {
      const start = Date.UTC(y, m - i, 1);
      const end = Date.UTC(y, m - i + 1, 1);
      const sd = new Date(start);
      periods.push({
        startMs: start,
        endMs: end,
        label: `${MONTH_LABELS[sd.getUTCMonth()]} ${String(
          sd.getUTCFullYear(),
        ).slice(2)}`,
      });
    } else {
      const start = Date.UTC(y - i, 0, 1);
      const end = Date.UTC(y - i + 1, 0, 1);
      periods.push({ startMs: start, endMs: end, label: String(y - i) });
    }
  }

  return periods;
}

/**
 * Returns the sales that fall inside the visible window for a granularity
 * (last 7 days / 8 weeks / 12 months / 5 years). Used to scope every figure on
 * the sales tab — summary, top sellers, recent — to the selected range, not
 * just the trend chart.
 */
export function filterSalesForRange(
  sales: readonly Sale[],
  granularity: SalesGranularity,
  now: Date = new Date(),
): Sale[] {
  const periods = buildPeriods(granularity, now);
  const start = periods[0].startMs;
  const end = periods[periods.length - 1].endMs;
  return sales.filter((sale) => {
    const t = new Date(sale.timestamp).getTime();
    return t >= start && t < end;
  });
}

/**
 * Buckets sales into fixed windows for the chosen granularity (day/week/month/
 * year), oldest bucket first. Each bucket carries its label, ISO start, summed
 * revenue, and units. Sales outside the visible window are ignored.
 */
export function salesByPeriod(
  sales: readonly Sale[],
  granularity: SalesGranularity,
  now: Date = new Date(),
): readonly SalesPeriodBucket[] {
  const periods = buildPeriods(granularity, now);
  const buckets: SalesPeriodBucket[] = periods.map((p) => ({
    label: p.label,
    start: new Date(p.startMs).toISOString(),
    revenue: 0,
    units: 0,
  }));

  const rangeStart = periods[0].startMs;
  const rangeEnd = periods[periods.length - 1].endMs;

  for (const sale of sales) {
    const t = new Date(sale.timestamp).getTime();
    if (t < rangeStart || t >= rangeEnd) continue;
    for (let i = 0; i < periods.length; i++) {
      if (t >= periods[i].startMs && t < periods[i].endMs) {
        buckets[i].revenue += sale.total;
        buckets[i].units += sale.quantity;
        break;
      }
    }
  }

  return buckets.map((b) => ({ ...b, revenue: toCents(b.revenue) }));
}

/**
 * Rolls the whole fleet's sales up for a granularity: shared time buckets
 * across every store, a per-store revenue ranking (highest first), and the
 * fleet's total revenue.
 */
export function aggregateFleetSales(
  stores: readonly FleetStoreSales[],
  granularity: SalesGranularity,
  now: Date = new Date(),
): FleetSalesAnalytics {
  const allSales = stores.flatMap((s) => [...s.sales]);
  const buckets = salesByPeriod(allSales, granularity, now);

  // Per-store totals are windowed to the same range as the chart, so the
  // ranking and the fleet total move with the granularity toggle and stay
  // consistent with the bars. Summing each store's period buckets guarantees
  // the ranking totals equal the charted totals.
  const byStore = stores
    .map((s) => {
      const storeBuckets = salesByPeriod(s.sales, granularity, now);
      return {
        storeId: s.storeId,
        storeName: s.storeName,
        totalRevenue: toCents(
          storeBuckets.reduce((sum, b) => sum + b.revenue, 0),
        ),
        unitsSold: storeBuckets.reduce((sum, b) => sum + b.units, 0),
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const totalRevenue = toCents(
    byStore.reduce((sum, s) => sum + s.totalRevenue, 0),
  );

  return { granularity, buckets, byStore, totalRevenue };
}
