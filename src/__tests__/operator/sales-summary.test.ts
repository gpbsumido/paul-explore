import { describe, it, expect } from "vitest";
import {
  summarizeSales,
  topSellingProducts,
  salesByDay,
} from "@/lib/operator-sales";
import { buildSale } from "@/test/factories/operator";

// ---------------------------------------------------------------------------
// summarizeSales — headline totals across a sales list
// ---------------------------------------------------------------------------

describe("summarizeSales", () => {
  it("sums total revenue across sales", () => {
    const sales = [
      buildSale({ total: 10 }),
      buildSale({ total: 5.5 }),
      buildSale({ total: 4.5 }),
    ];
    expect(summarizeSales(sales).totalRevenue).toBe(20);
  });

  it("sums units sold across sales", () => {
    const sales = [
      buildSale({ quantity: 2 }),
      buildSale({ quantity: 3 }),
    ];
    expect(summarizeSales(sales).unitsSold).toBe(5);
  });

  it("counts the number of transactions", () => {
    const sales = [buildSale(), buildSale(), buildSale()];
    expect(summarizeSales(sales).transactionCount).toBe(3);
  });

  it("computes the average sale value", () => {
    const sales = [
      buildSale({ total: 10 }),
      buildSale({ total: 20 }),
    ];
    expect(summarizeSales(sales).averageSale).toBe(15);
  });

  it("returns zeroes for an empty sales list", () => {
    const result = summarizeSales([]);
    expect(result.totalRevenue).toBe(0);
    expect(result.unitsSold).toBe(0);
    expect(result.transactionCount).toBe(0);
    expect(result.averageSale).toBe(0);
  });

  it("rounds revenue to the nearest cent", () => {
    const sales = [buildSale({ total: 0.1 }), buildSale({ total: 0.2 })];
    expect(summarizeSales(sales).totalRevenue).toBe(0.3);
  });
});

// ---------------------------------------------------------------------------
// topSellingProducts — per-product rollup ordered by revenue
// ---------------------------------------------------------------------------

describe("topSellingProducts", () => {
  it("aggregates units and revenue per product name", () => {
    const sales = [
      buildSale({ productName: "Cola", quantity: 2, total: 5 }),
      buildSale({ productName: "Cola", quantity: 1, total: 2.5 }),
      buildSale({ productName: "Water", quantity: 4, total: 8 }),
    ];
    const top = topSellingProducts(sales);
    const cola = top.find((p) => p.productName === "Cola");
    expect(cola?.unitsSold).toBe(3);
    expect(cola?.revenue).toBe(7.5);
  });

  it("orders products by revenue descending", () => {
    const sales = [
      buildSale({ productName: "Cola", quantity: 1, total: 2.5 }),
      buildSale({ productName: "Sandwich", quantity: 1, total: 6.99 }),
    ];
    const top = topSellingProducts(sales);
    expect(top[0].productName).toBe("Sandwich");
    expect(top[1].productName).toBe("Cola");
  });

  it("limits the number of products returned", () => {
    const sales = [
      buildSale({ productName: "A", total: 5 }),
      buildSale({ productName: "B", total: 4 }),
      buildSale({ productName: "C", total: 3 }),
    ];
    expect(topSellingProducts(sales, 2)).toHaveLength(2);
  });

  it("returns an empty list for no sales", () => {
    expect(topSellingProducts([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// salesByDay — last-7-day revenue buckets for a chart
// ---------------------------------------------------------------------------

describe("salesByDay", () => {
  const now = new Date("2026-07-15T12:00:00Z");

  it("returns exactly 7 day buckets", () => {
    expect(salesByDay([], now)).toHaveLength(7);
  });

  it("buckets a sale's revenue into its calendar day", () => {
    const sales = [
      buildSale({ total: 12, timestamp: "2026-07-15T09:00:00Z" }),
      buildSale({ total: 8, timestamp: "2026-07-15T18:00:00Z" }),
    ];
    const buckets = salesByDay(sales, now);
    expect(buckets[6].revenue).toBe(20);
  });

  it("ignores sales older than the 7-day window", () => {
    const sales = [buildSale({ total: 99, timestamp: "2026-07-01T09:00:00Z" })];
    const buckets = salesByDay(sales, now);
    const totalCharted = buckets.reduce((sum, b) => sum + b.revenue, 0);
    expect(totalCharted).toBe(0);
  });

  it("labels each bucket with a weekday", () => {
    for (const bucket of salesByDay([], now)) {
      expect(bucket.day).toBeTruthy();
      expect(typeof bucket.day).toBe("string");
    }
  });
});
