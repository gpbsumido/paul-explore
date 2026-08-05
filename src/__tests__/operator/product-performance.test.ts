import { describe, it, expect } from "vitest";
import {
  PERFORMANCE_RANGES,
  fleetProductPerformance,
} from "@/lib/operator-product-performance";
import { buildInventoryItem, buildSale } from "@/test/factories/operator";

const NOW = new Date("2026-08-04T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

/** A sale of `productName` in `category`, `daysAgo` days before NOW. */
function saleDaysAgo(
  productName: string,
  category: string,
  quantity: number,
  total: number,
  daysAgo: number,
) {
  return buildSale({
    productName,
    category,
    quantity,
    total,
    timestamp: new Date(NOW.getTime() - daysAgo * DAY).toISOString(),
  });
}

// ---------------------------------------------------------------------------
// ranges
// ---------------------------------------------------------------------------

describe("performance ranges", () => {
  it("offers stable day-window ranges", () => {
    expect(PERFORMANCE_RANGES.map((r) => r.days)).toEqual([7, 30, 90]);
  });
});

// ---------------------------------------------------------------------------
// fleetProductPerformance
// ---------------------------------------------------------------------------

describe("fleetProductPerformance", () => {
  it("rolls a product's windowed units, revenue and daily rate together", () => {
    const sales = [
      saleDaysAgo("Cola", "beverages", 3, 6, 1),
      saleDaysAgo("Cola", "beverages", 1, 2, 3),
    ];
    const [row] = fleetProductPerformance([], sales, 4, NOW);

    expect(row.productName).toBe("Cola");
    expect(row.unitsSold).toBe(4);
    expect(row.revenue).toBe(8);
    expect(row.avgPerDay).toBe(1); // 4 units / 4 days
    expect(row.hasSales).toBe(true);
  });

  it("ignores sales outside the window", () => {
    const sales = [
      saleDaysAgo("Cola", "beverages", 5, 10, 2),
      saleDaysAgo("Cola", "beverages", 9, 18, 40), // outside a 7-day window
    ];
    const [row] = fleetProductPerformance([], sales, 7, NOW);
    expect(row.unitsSold).toBe(5);
    expect(row.revenue).toBe(10);
  });

  it("includes a stocked product with no sales as a dead SKU", () => {
    const items = [
      buildInventoryItem({ productName: "Kombucha", category: "beverages" }),
    ];
    const sales = [saleDaysAgo("Cola", "beverages", 2, 4, 1)];

    const rows = fleetProductPerformance(items, sales, 7, NOW);
    const dead = rows.find((r) => r.productName === "Kombucha");

    expect(dead).toBeDefined();
    expect(dead?.unitsSold).toBe(0);
    expect(dead?.revenue).toBe(0);
    expect(dead?.hasSales).toBe(false);
  });

  it("indexes each product against its category's average revenue", () => {
    const sales = [
      saleDaysAgo("Cola", "beverages", 50, 100, 1),
      saleDaysAgo("Water", "beverages", 25, 50, 1),
    ];
    const rows = fleetProductPerformance([], sales, 7, NOW);
    const cola = rows.find((r) => r.productName === "Cola");
    const water = rows.find((r) => r.productName === "Water");

    // category mean revenue is (100 + 50) / 2 = 75.
    expect(cola?.performanceIndex).toBe(133); // 100 / 75 * 100
    expect(water?.performanceIndex).toBe(67); //  50 / 75 * 100
  });

  it("ranks products by revenue, highest first", () => {
    const sales = [
      saleDaysAgo("Chips", "snacks", 2, 5, 1),
      saleDaysAgo("Cola", "beverages", 10, 40, 1),
      saleDaysAgo("Gum", "snacks", 1, 1, 1),
    ];
    const rows = fleetProductPerformance([], sales, 7, NOW);
    expect(rows.map((r) => r.productName)).toEqual(["Cola", "Chips", "Gum"]);
  });

  it("returns nothing to rank when there is neither stock nor sales", () => {
    expect(fleetProductPerformance([], [], 7, NOW)).toEqual([]);
  });
});
