// ---------------------------------------------------------------------------
// Sales history helpers: headline totals, per-product rollups, and a last-7-day
// revenue trend. All pure, all take explicit inputs, all round money to cents.
// ---------------------------------------------------------------------------

import type { Sale } from "@/types/operator";
import {
  DEFAULT_ZONE,
  weekdayOf,
  zonedInstant,
  zonedParts,
} from "@/lib/operator-timezone";

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

/**
 * The 8 local-midnight boundaries around the last 7 days, oldest first. Bucket
 * `i` covers `[bounds[i], bounds[i + 1])`.
 *
 * Computed once so the per-sale work stays numeric. Resolving a zone costs an
 * Intl.DateTimeFormat call, and doing that per sale over eighteen months of
 * history is the difference between a chart that renders instantly and one that
 * janks -- so the zone is resolved 8 times, and every sale is then placed with
 * plain integer comparisons.
 */
function dayBoundaries(now: Date, timeZone: string): number[] {
  const { year, month, day } = zonedParts(now, timeZone);
  return Array.from({ length: 8 }, (_, i) =>
    zonedInstant(year, month, day - 6 + i, 0, timeZone).getTime(),
  );
}

/** The index of the bucket an instant falls in, or -1 when it is outside. */
function bucketOf(ms: number, bounds: readonly number[]): number {
  if (ms < bounds[0] || ms >= bounds[bounds.length - 1]) return -1;

  let index = 0;
  while (index < bounds.length - 2 && ms >= bounds[index + 1]) index += 1;
  return index;
}

/**
 * Buckets sale revenue into the last 7 calendar days ending at `now`, oldest
 * bucket first. Sales outside the window are ignored. Each bucket is labelled
 * with its weekday so a chart can render it without more date math.
 *
 * Days are the store's local days, so a sale rung up at 23:30 stays on the day
 * the operator made it rather than sliding into tomorrow.
 */
export function salesByDay(
  sales: readonly Sale[],
  now: Date = new Date(),
  timeZone: string = DEFAULT_ZONE,
): readonly SalesDayBucket[] {
  const bounds = dayBoundaries(now, timeZone);
  const revenueByOffset = new Array<number>(7).fill(0);

  for (const sale of sales) {
    const offset = bucketOf(Date.parse(sale.timestamp), bounds);
    if (offset >= 0) revenueByOffset[offset] += sale.total;
  }

  return revenueByOffset.map((revenue, offset) => ({
    day: DAY_LABELS[weekdayOf(zonedParts(new Date(bounds[offset]), timeZone))],
    revenue: toCents(revenue),
  }));
}

type PeriodDef = { startMs: number; endMs: number; label: string };

/**
 * Builds the fixed set of period windows for a granularity, ending at `now` and
 * ordered oldest-first: 7 days, 8 weeks, 12 months, or 5 years.
 */
function buildPeriods(
  granularity: SalesGranularity,
  now: Date,
  timeZone: string,
): PeriodDef[] {
  const count = PERIOD_COUNT[granularity];
  const { year: y, month: m, day: d } = zonedParts(now, timeZone);
  const at = (
    year: number,
    month: number,
    day: number,
  ): number => zonedInstant(year, month, day, 0, timeZone).getTime();
  const periods: PeriodDef[] = [];

  for (let i = count - 1; i >= 0; i--) {
    if (granularity === "day") {
      const start = at(y, m, d - i);
      periods.push({
        startMs: start,
        endMs: at(y, m, d - i + 1),
        label: DAY_LABELS[weekdayOf(zonedParts(new Date(start), timeZone))],
      });
    } else if (granularity === "week") {
      // A rolling 7-day window ending at tomorrow's local midnight, which is
      // the range this tab has always shown.
      const start = at(y, m, d + 1 - i * 7 - 7);
      const sd = zonedParts(new Date(start), timeZone);
      periods.push({
        startMs: start,
        endMs: at(y, m, d + 1 - i * 7),
        label: `${MONTH_LABELS[sd.month - 1]} ${sd.day}`,
      });
    } else if (granularity === "month") {
      const start = at(y, m - i, 1);
      const sd = zonedParts(new Date(start), timeZone);
      periods.push({
        startMs: start,
        endMs: at(y, m - i + 1, 1),
        label: `${MONTH_LABELS[sd.month - 1]} ${String(sd.year).slice(2)}`,
      });
    } else {
      periods.push({
        startMs: at(y - i, 1, 1),
        endMs: at(y - i + 1, 1, 1),
        label: String(y - i),
      });
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
  timeZone: string = DEFAULT_ZONE,
): Sale[] {
  const periods = buildPeriods(granularity, now, timeZone);
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
  timeZone: string = DEFAULT_ZONE,
): readonly SalesPeriodBucket[] {
  const periods = buildPeriods(granularity, now, timeZone);
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
  timeZone: string = DEFAULT_ZONE,
): FleetSalesAnalytics {
  const allSales = stores.flatMap((s) => [...s.sales]);
  const buckets = salesByPeriod(allSales, granularity, now, timeZone);

  // Per-store totals are windowed to the same range as the chart, so the
  // ranking and the fleet total move with the granularity toggle and stay
  // consistent with the bars. Summing each store's period buckets guarantees
  // the ranking totals equal the charted totals.
  const byStore = stores
    .map((s) => {
      const storeBuckets = salesByPeriod(s.sales, granularity, now, timeZone);
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
