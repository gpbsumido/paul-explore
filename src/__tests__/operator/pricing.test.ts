import { describe, it, expect } from "vitest";
import {
  DISCOUNT_STEPS,
  MARGIN_STEPS,
  promoPrice,
  weeklyUnitsFor,
  buildProductPricing,
  buildPricingTable,
  summarizePricing,
  unitCost,
  buildProfitTable,
  summarizeProfit,
} from "@/lib/operator-pricing";
import { buildInventoryItem, buildSale } from "@/test/factories/operator";

const NOW = new Date("2026-08-02T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

/** A sale of `productName` `daysAgo` days before NOW. */
function saleDaysAgo(productName: string, quantity: number, daysAgo: number) {
  return buildSale({
    productName,
    quantity,
    total: 0,
    timestamp: new Date(NOW.getTime() - daysAgo * DAY).toISOString(),
  });
}

// ---------------------------------------------------------------------------
// promoPrice
// ---------------------------------------------------------------------------

describe("promoPrice", () => {
  it("applies a discount and rounds to the cent", () => {
    expect(promoPrice(2.5, 10)).toBe(2.25);
    expect(promoPrice(6.99, 15)).toBe(5.94);
  });

  it("returns the list price unchanged at 0%", () => {
    expect(promoPrice(4.25, 0)).toBe(4.25);
  });

  it("clamps a discount outside 0-100", () => {
    expect(promoPrice(5, 150)).toBe(0);
    expect(promoPrice(5, -20)).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// weeklyUnitsFor
// ---------------------------------------------------------------------------

describe("weeklyUnitsFor", () => {
  it("counts only in-window units for the named product", () => {
    const sales = [
      saleDaysAgo("Energy Bar", 3, 1),
      saleDaysAgo("Energy Bar", 2, 6),
      saleDaysAgo("Energy Bar", 5, 30), // out of the 7-day window
      saleDaysAgo("Coca-Cola 355ml", 4, 1), // different product
    ];
    expect(weeklyUnitsFor(sales, "Energy Bar", NOW)).toBe(5);
  });

  it("includes a sale made exactly seven days ago and drops one a moment earlier", () => {
    const justInside = saleDaysAgo("Bar", 2, 7);
    const justOutside = buildSale({
      productName: "Bar",
      quantity: 5,
      timestamp: new Date(NOW.getTime() - 7 * DAY - 1).toISOString(),
    });
    expect(weeklyUnitsFor([justInside, justOutside], "Bar", NOW)).toBe(2);
  });

  it("looks back as far as the days argument says", () => {
    const sales = [saleDaysAgo("Bar", 2, 10), saleDaysAgo("Bar", 3, 20)];
    expect(weeklyUnitsFor(sales, "Bar", NOW, 14)).toBe(2);
  });

  it("is zero when the product has no recent sales", () => {
    expect(weeklyUnitsFor([saleDaysAgo("Cola", 9, 40)], "Cola", NOW)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildProductPricing
// ---------------------------------------------------------------------------

describe("buildProductPricing", () => {
  it("joins list price, discount and weekly demand into a row", () => {
    const item = buildInventoryItem({
      id: "item-1",
      productName: "Energy Bar",
      category: "snacks",
      price: 3,
    });
    const sales = [saleDaysAgo("Energy Bar", 10, 2)];

    const row = buildProductPricing(item, sales, 20, NOW);

    expect(row).toMatchObject({
      itemId: "item-1",
      productName: "Energy Bar",
      category: "snacks",
      listPrice: 3,
      promoPercent: 20,
      promoPrice: 2.4,
      weeklyUnits: 10,
      weeklyRevenueAtList: 30,
      weeklyRevenueAtPromo: 24,
    });
  });
});

describe("buildPricingTable", () => {
  it("gives an item with no chosen discount a 0% promo", () => {
    const items = [buildInventoryItem({ id: "a", price: 4 })];
    const [row] = buildPricingTable(items, [], {}, NOW);
    expect(row.promoPercent).toBe(0);
    expect(row.promoPrice).toBe(4);
  });

  it("clamps a discount outside 0-100 on the row itself", () => {
    const item = buildInventoryItem({ id: "a", price: 4 });
    expect(buildProductPricing(item, [], 150, NOW)).toMatchObject({
      promoPercent: 100,
      promoPrice: 0,
    });
    expect(buildProductPricing(item, [], -10, NOW)).toMatchObject({
      promoPercent: 0,
      promoPrice: 4,
    });
  });
});

// ---------------------------------------------------------------------------
// summarizePricing
// ---------------------------------------------------------------------------

describe("summarizePricing", () => {
  it("totals list vs promo revenue and reports the delta as revenue given up", () => {
    const items = [
      buildInventoryItem({ id: "a", productName: "A", price: 2 }),
      buildInventoryItem({ id: "b", productName: "B", price: 5 }),
    ];
    const sales = [
      saleDaysAgo("A", 10, 1), // 10 units
      saleDaysAgo("B", 4, 1), // 4 units
    ];
    const rows = buildPricingTable(items, sales, { a: 10, b: 0 }, NOW);

    const summary = summarizePricing(rows);

    // A: 10 units, list 2 -> 20, promo 1.80 -> 18. B: 4 units * 5 = 20 both.
    expect(summary.weeklyRevenueAtList).toBe(40);
    expect(summary.weeklyRevenueAtPromo).toBe(38);
    expect(summary.revenueDelta).toBe(-2);
  });

  it("reports items-on-promo and the average discount across them", () => {
    const items = [
      buildInventoryItem({ id: "a", productName: "A", price: 2 }),
      buildInventoryItem({ id: "b", productName: "B", price: 5 }),
      buildInventoryItem({ id: "c", productName: "C", price: 1 }),
    ];
    const rows = buildPricingTable(items, [], { a: 10, b: 20, c: 0 }, NOW);

    const summary = summarizePricing(rows);

    expect(summary.itemCount).toBe(3);
    expect(summary.itemsOnPromo).toBe(2);
    expect(summary.avgDiscount).toBe(15);
  });

  it("reports a zero average discount when nothing is on promo", () => {
    const items = [buildInventoryItem({ id: "a", productName: "A", price: 2 })];
    const summary = summarizePricing(buildPricingTable(items, [], {}, NOW));
    expect(summary.itemsOnPromo).toBe(0);
    expect(summary.avgDiscount).toBe(0);
  });

  it("has a stable set of discount steps from zero to a clearance cut", () => {
    expect(DISCOUNT_STEPS[0]).toBe(0);
    expect([...DISCOUNT_STEPS]).toEqual([0, 10, 20, 30, 40, 50]);
  });
});

// ---------------------------------------------------------------------------
// Profit: cost is modelled from an assumed gross margin on the list price
// ---------------------------------------------------------------------------

describe("unitCost", () => {
  it("derives cost of goods from the list-price margin", () => {
    // 40% margin on a $3 item means cost is 60% of list = $1.80.
    expect(unitCost(3, 40)).toBe(1.8);
    expect(unitCost(6.99, 50)).toBe(3.5);
  });

  it("caps a margin above 100% so cost never goes negative", () => {
    expect(unitCost(3, 150)).toBe(0);
  });

  it("offers a stable set of margin steps", () => {
    expect([...MARGIN_STEPS]).toEqual([30, 40, 50, 60]);
  });
});

describe("buildProfitTable", () => {
  it("projects weekly profit at list and promo against the assumed cost", () => {
    const items = [
      buildInventoryItem({ id: "bar", productName: "Bar", price: 3 }),
    ];
    const sales = [saleDaysAgo("Bar", 10, 1)];

    // 40% margin -> unit cost $1.80. 20% off -> promo $2.40.
    const [row] = buildProfitTable(items, sales, { bar: 20 }, 40, NOW);

    expect(row.unitCost).toBe(1.8);
    expect(row.weeklyProfitAtList).toBe(12); // (3 - 1.8) * 10
    expect(row.weeklyProfitAtPromo).toBe(6); // (2.4 - 1.8) * 10
    expect(row.belowCost).toBe(false);
  });

  it("flags a product whose promo price dips below cost", () => {
    const items = [
      buildInventoryItem({ id: "bar", productName: "Bar", price: 2 }),
    ];
    const sales = [saleDaysAgo("Bar", 4, 1)];
    // 10% margin -> cost $1.80. A steep 50% discount -> promo $1.00, below cost.
    const [row] = buildProfitTable(items, sales, { bar: 50 }, 10, NOW);

    expect(row.belowCost).toBe(true);
    expect(row.weeklyProfitAtPromo).toBe(-3.2); // (1.00 - 1.80) * 4
  });
});

describe("buildProfitTable defaults", () => {
  it("assumes a 45% margin when none is given", () => {
    const items = [buildInventoryItem({ id: "bar", price: 4 })];
    const [row] = buildProfitTable(items, [], {}, undefined, NOW);
    // cost is 55% of the $4 list price
    expect(row.unitCost).toBe(2.2);
  });

  it("does not flag a promo price that lands exactly on cost", () => {
    const items = [buildInventoryItem({ id: "bar", productName: "Bar", price: 4 })];
    // 50% margin -> cost $2.00; 50% off -> promo $2.00
    const [row] = buildProfitTable(items, [], { bar: 50 }, 50, NOW);
    expect(row.promoPrice).toBe(row.unitCost);
    expect(row.belowCost).toBe(false);
  });
});

describe("summarizeProfit", () => {
  it("totals weekly profit at list vs promo and counts below-cost items", () => {
    const items = [
      buildInventoryItem({ id: "a", productName: "A", price: 3 }),
      buildInventoryItem({ id: "b", productName: "B", price: 2 }),
    ];
    const sales = [saleDaysAgo("A", 10, 1), saleDaysAgo("B", 5, 1)];
    // 10% margin: A costs $2.70 and B costs $1.80.
    // A stays at list, so $0.30 * 10 = $3 either way.
    // B at 50% off sells at $1.00, below its $1.80 cost.
    const rows = buildProfitTable(items, sales, { a: 0, b: 50 }, 10, NOW);

    expect(summarizeProfit(rows)).toEqual({
      weeklyProfitAtList: 4, // A $3 + B $0.20 * 5
      weeklyProfitAtPromo: -1, // A $3 + B -$0.80 * 5
      profitDelta: -5,
      itemsBelowCost: 1,
    });
  });
});
