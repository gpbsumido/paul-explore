import { describe, it, expect } from "vitest";
import { salesByPeriod, aggregateFleetSales } from "@/lib/operator-sales";
import { buildSale } from "@/test/factories/operator";

const NOW = new Date("2026-07-15T12:00:00Z");

// ---------------------------------------------------------------------------
// salesByPeriod — daily / weekly / monthly / yearly buckets
// ---------------------------------------------------------------------------

describe("salesByPeriod bucket counts", () => {
  it("returns 7 daily buckets", () => {
    expect(salesByPeriod([], "day", NOW)).toHaveLength(7);
  });

  it("returns 8 weekly buckets", () => {
    expect(salesByPeriod([], "week", NOW)).toHaveLength(8);
  });

  it("returns 12 monthly buckets", () => {
    expect(salesByPeriod([], "month", NOW)).toHaveLength(12);
  });

  it("returns 5 yearly buckets", () => {
    expect(salesByPeriod([], "year", NOW)).toHaveLength(5);
  });

  it("labels every bucket", () => {
    for (const g of ["day", "week", "month", "year"] as const) {
      for (const bucket of salesByPeriod([], g, NOW)) {
        expect(bucket.label).toBeTruthy();
      }
    }
  });
});

describe("salesByPeriod bucketing", () => {
  it("puts today's sale in the last daily bucket", () => {
    const sales = [
      buildSale({ total: 12, quantity: 2, timestamp: "2026-07-15T09:00:00Z" }),
    ];
    const buckets = salesByPeriod(sales, "day", NOW);
    expect(buckets[6].revenue).toBe(12);
    expect(buckets[6].units).toBe(2);
  });

  it("buckets sales into the right calendar month", () => {
    const sales = [
      buildSale({ total: 100, timestamp: "2026-07-01T09:00:00Z" }),
      buildSale({ total: 50, timestamp: "2026-06-20T09:00:00Z" }),
    ];
    const buckets = salesByPeriod(sales, "month", NOW);
    expect(buckets[11].revenue).toBe(100); // Jul 2026 (newest)
    expect(buckets[10].revenue).toBe(50); // Jun 2026
  });

  it("buckets sales into the right year", () => {
    const sales = [
      buildSale({ total: 30, timestamp: "2026-02-01T09:00:00Z" }),
      buildSale({ total: 70, timestamp: "2024-11-01T09:00:00Z" }),
    ];
    const buckets = salesByPeriod(sales, "year", NOW);
    expect(buckets[4].revenue).toBe(30); // 2026 (newest)
    expect(buckets[2].revenue).toBe(70); // 2024
  });

  it("ignores sales outside the visible window", () => {
    const sales = [buildSale({ total: 999, timestamp: "2019-01-01T00:00:00Z" })];
    const total = salesByPeriod(sales, "year", NOW).reduce(
      (sum, b) => sum + b.revenue,
      0,
    );
    expect(total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// aggregateFleetSales — fleet-wide rollup across stores
// ---------------------------------------------------------------------------

describe("aggregateFleetSales", () => {
  const input = [
    {
      storeId: "s1",
      storeName: "Store One",
      sales: [
        buildSale({ total: 100, quantity: 5, timestamp: "2026-07-10T09:00:00Z" }),
      ],
    },
    {
      storeId: "s2",
      storeName: "Store Two",
      sales: [
        buildSale({ total: 40, quantity: 2, timestamp: "2026-07-10T09:00:00Z" }),
        buildSale({ total: 50, quantity: 3, timestamp: "2026-06-10T09:00:00Z" }),
      ],
    },
  ];

  it("sums fleet-wide revenue across all stores", () => {
    const result = aggregateFleetSales(input, "month", NOW);
    expect(result.totalRevenue).toBe(190);
  });

  it("adds each store's revenue into the shared time buckets", () => {
    const result = aggregateFleetSales(input, "month", NOW);
    // Jul 2026: 100 + 40 = 140 in the newest bucket
    expect(result.buckets[result.buckets.length - 1].revenue).toBe(140);
  });

  it("ranks stores by revenue, highest first", () => {
    const result = aggregateFleetSales(input, "month", NOW);
    expect(result.byStore[0].storeId).toBe("s1");
    expect(result.byStore[0].totalRevenue).toBe(100);
    expect(result.byStore[1].storeId).toBe("s2");
    expect(result.byStore[1].totalRevenue).toBe(90);
  });

  it("returns zeroes for an empty fleet", () => {
    const result = aggregateFleetSales([], "day", NOW);
    expect(result.totalRevenue).toBe(0);
    expect(result.byStore).toEqual([]);
    expect(result.buckets).toHaveLength(7);
  });
});

describe("aggregateFleetSales windows totals by granularity", () => {
  const fleet = [
    {
      storeId: "s1",
      storeName: "One",
      sales: [
        buildSale({ total: 10, quantity: 1, timestamp: "2026-07-14T09:00:00Z" }), // last 7 days
        buildSale({ total: 90, quantity: 1, timestamp: "2026-05-01T09:00:00Z" }), // ~75 days ago
      ],
    },
  ];

  it("counts only in-window sales for the day range", () => {
    const day = aggregateFleetSales(fleet, "day", NOW);
    expect(day.byStore[0].totalRevenue).toBe(10);
    expect(day.totalRevenue).toBe(10);
  });

  it("counts more sales for the month range", () => {
    const month = aggregateFleetSales(fleet, "month", NOW);
    expect(month.byStore[0].totalRevenue).toBe(100);
    expect(month.totalRevenue).toBe(100);
  });

  it("keeps per-store totals consistent with the charted buckets", () => {
    const month = aggregateFleetSales(fleet, "month", NOW);
    const charted = month.buckets.reduce((sum, b) => sum + b.revenue, 0);
    const ranked = month.byStore.reduce((sum, s) => sum + s.totalRevenue, 0);
    expect(ranked).toBe(charted);
  });
});
