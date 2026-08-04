import { describe, it, expect } from "vitest";
import { fleetBenchmarks } from "@/lib/operator-planner";
import { fleetProductPerformance } from "@/lib/operator-product-performance";
import { fleetShrink } from "@/lib/operator-shrink";
import { summarizeFinance, FEE_MODEL } from "@/lib/operator-finance";
import { buildSale, buildInventoryItem } from "@/test/factories/operator";

/**
 * Cross-repo parity guard (twin of portfolio_api's parity.test).
 *
 * The aggregation math is duplicated: these models and portfolio_api's
 * aggregations.ts compute the same numbers so the app's seed fallback and the
 * live API agree. Nothing structural stops the copies drifting. So both repos
 * assert the SAME canonical scenarios against the SAME expected outputs (the
 * literals below are identical to portfolio_api's). If a formula changes in
 * either repo, its parity test fails against the shared expectation. Change the
 * two together.
 */

const NOW = new Date("2026-08-04T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

describe("operator aggregation parity (keep in sync with portfolio_api)", () => {
  it("the fee model matches", () => {
    expect(FEE_MODEL).toEqual({
      transactionRate: 0.04,
      transactionFlat: 0.1,
      platformPerUnitMonthly: 60,
    });
  });

  it("benchmarks", () => {
    const sales = [
      buildSale({ quantity: 2, total: 10 }),
      buildSale({ quantity: 1, total: 3 }),
    ];
    expect(fleetBenchmarks(sales)).toEqual({
      avgItemPrice: 4.33,
      itemsPerOrder: 1.5,
      sampleSize: 2,
    });
  });

  it("product performance category index and dead SKU", () => {
    const rows = fleetProductPerformance(
      [buildInventoryItem({ productName: "Kombucha", category: "beverages" })],
      [
        buildSale({ productName: "Cola", category: "beverages", quantity: 50, total: 100 }),
        buildSale({ productName: "Water", category: "beverages", quantity: 25, total: 50 }),
      ],
      7,
    );
    expect(
      rows.map((r) => [r.productName, r.performanceIndex, r.hasSales]),
    ).toEqual([
      ["Cola", 200, true],
      ["Water", 100, true],
      ["Kombucha", 0, false],
    ]);
  });

  it("shrink split, valuation and worst-first ranking", () => {
    const result = fleetShrink([
      {
        storeId: "s2",
        storeName: "Busy Gym",
        lines: [
          { itemId: "a", expectedQty: 10, countedQty: 4, removed: 0, removalReason: null },
        ],
        priceByItemId: { a: 3 },
      },
      {
        storeId: "s1",
        storeName: "Quiet Lobby",
        lines: [
          { itemId: "b", expectedQty: 5, countedQty: 4, removed: 2, removalReason: "expired" },
        ],
        priceByItemId: { b: 2 },
      },
    ]);
    expect(result.stores.map((s) => s.storeId)).toEqual(["s2", "s1"]);
    expect(result.totals.unexplainedUnits).toBe(7);
    expect(result.totals.unexplainedValue).toBe(20);
    expect(result.totals.explainedByReason).toEqual({ expired: 2 });
  });

  it("finance nets a week after both fees", () => {
    // 200 sales of $5 in the most recent week -> gross 1000, 200 transactions.
    const sales = Array.from({ length: 200 }, () =>
      buildSale({
        quantity: 1,
        total: 5,
        timestamp: new Date(NOW.getTime() - 1 * DAY).toISOString(),
      }),
    );
    const { weeks, totals } = summarizeFinance(sales, 1, NOW, 8);
    expect(weeks).toHaveLength(8);
    expect([
      weeks[0].transactionFees,
      weeks[0].platformFees,
      weeks[0].netPayout,
    ]).toEqual([60, 14, 926]);
    expect(totals.grossRevenue).toBe(1000);
  });
});
