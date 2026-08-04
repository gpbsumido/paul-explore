import { describe, it, expect } from "vitest";
import {
  PLATFORM_FEE_PER_UNIT_MONTHLY,
  TXN_FEE_RATE,
  TXN_FEE_FLAT,
  UNIT_PRICE_SINGLE,
  UNIT_PRICE_BULK,
  LOCATION_TYPES,
  PRICE_TIERS,
  MARGIN_TIERS,
  DEFAULT_PLANNER_INPUTS,
  unitHardwarePrice,
  projectLocation,
  fleetBenchmarks,
  type PlannerInputs,
} from "@/lib/operator-planner";
import { buildSale } from "@/test/factories/operator";

/**
 * A profitable workplace location, hand-checkable. Traffic 100 at 10% converts
 * to 10 orders/day; 2 items/order at $5 is $100/day of revenue per unit.
 */
const PROFITABLE: PlannerInputs = {
  dailyFootTraffic: 100,
  conversionRate: 10,
  avgItemPrice: 5,
  itemsPerOrder: 2,
  margin: 50,
  units: 1,
};

// ---------------------------------------------------------------------------
// presets and defaults
// ---------------------------------------------------------------------------

describe("planner presets", () => {
  it("offers location, price and margin presets with stable ids", () => {
    expect(LOCATION_TYPES.map((t) => t.id)).toEqual([
      "semi-public",
      "residential",
      "workplace",
    ]);
    expect(PRICE_TIERS.map((t) => t.id)).toEqual([
      "vending",
      "micro-market",
      "retail",
    ]);
    expect(MARGIN_TIERS.map((t) => t.id)).toEqual([
      "fresh-food",
      "snacks-drinks",
      "specialty",
    ]);
  });

  it("has a complete default input the UI can start from", () => {
    expect(DEFAULT_PLANNER_INPUTS.units).toBeGreaterThanOrEqual(1);
    expect(DEFAULT_PLANNER_INPUTS.avgItemPrice).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// unitHardwarePrice
// ---------------------------------------------------------------------------

describe("unitHardwarePrice", () => {
  it("charges the single-unit price below the bulk threshold", () => {
    expect(unitHardwarePrice(1)).toBe(UNIT_PRICE_SINGLE);
    expect(unitHardwarePrice(2)).toBe(UNIT_PRICE_SINGLE);
  });

  it("drops to the bulk price at three or more units", () => {
    expect(unitHardwarePrice(3)).toBe(UNIT_PRICE_BULK);
    expect(unitHardwarePrice(10)).toBe(UNIT_PRICE_BULK);
  });
});

// ---------------------------------------------------------------------------
// projectLocation
// ---------------------------------------------------------------------------

describe("projectLocation", () => {
  it("projects orders, items and revenue from traffic and conversion", () => {
    const p = projectLocation(PROFITABLE);
    // 100 * 10% = 10 orders/day * 30 = 300 orders/month
    expect(p.ordersPerMonth).toBe(300);
    // 300 orders * 2 items = 600 items/month
    expect(p.itemsPerMonth).toBe(600);
    // 600 items * $5 = $3,000/month
    expect(p.grossRevenueMonthly).toBe(3000);
    expect(p.grossRevenueAnnual).toBe(36000);
    expect(p.revenuePerUnitAnnual).toBe(36000);
  });

  it("charges a flat platform fee per unit per month", () => {
    const one = projectLocation(PROFITABLE);
    const three = projectLocation({ ...PROFITABLE, units: 3 });
    expect(one.platformFeesMonthly).toBe(PLATFORM_FEE_PER_UNIT_MONTHLY);
    expect(three.platformFeesMonthly).toBe(PLATFORM_FEE_PER_UNIT_MONTHLY * 3);
  });

  it("charges a transaction fee of a rate plus a flat cut per order", () => {
    const p = projectLocation(PROFITABLE);
    // 4% of $3,000 + $0.10 * 300 orders = 120 + 30 = 150
    expect(p.transactionFeesMonthly).toBe(
      3000 * TXN_FEE_RATE + 300 * TXN_FEE_FLAT,
    );
    expect(p.transactionFeesMonthly).toBe(150);
  });

  it("derives net profit after cost of goods and both fees", () => {
    const p = projectLocation(PROFITABLE);
    // 50% margin -> gross profit $1,500. minus $60 platform minus $150 txn.
    expect(p.grossProfitMonthly).toBe(1500);
    expect(p.netProfitMonthly).toBe(1290);
    expect(p.netProfitAnnual).toBe(1290 * 12);
  });

  it("reports payback as hardware cost over monthly net profit", () => {
    const p = projectLocation(PROFITABLE);
    // $6,295 / $1,290 = 4.879... -> one decimal
    expect(p.hardwareCost).toBe(UNIT_PRICE_SINGLE);
    expect(p.paybackMonths).toBeCloseTo(4.9, 1);
  });

  it("returns null payback when the location never pays back", () => {
    // Tiny traffic, thin margin: fees swallow the profit.
    const doomed = projectLocation({
      dailyFootTraffic: 5,
      conversionRate: 2,
      avgItemPrice: 2,
      itemsPerOrder: 1,
      margin: 30,
      units: 1,
    });
    expect(doomed.netProfitMonthly).toBeLessThanOrEqual(0);
    expect(doomed.paybackMonths).toBeNull();
  });

  it("caps a margin above 100% rather than inventing profit", () => {
    const capped = projectLocation({ ...PROFITABLE, margin: 120 });
    const full = projectLocation({ ...PROFITABLE, margin: 100 });
    expect(capped.grossProfitMonthly).toBe(full.grossProfitMonthly);
    expect(capped.grossProfitMonthly).toBe(3000);
  });

  it("treats zero conversion as zero revenue", () => {
    const p = projectLocation({ ...PROFITABLE, conversionRate: 0 });
    expect(p.grossRevenueMonthly).toBe(0);
    expect(p.paybackMonths).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fleetBenchmarks
// ---------------------------------------------------------------------------

describe("fleetBenchmarks", () => {
  it("derives mean price per item and mean items per order from sales", () => {
    const sales = [
      buildSale({ quantity: 2, total: 10 }), // $5/item, 2 items
      buildSale({ quantity: 1, total: 3 }), //  $3/item, 1 item
    ];
    const b = fleetBenchmarks(sales);
    expect(b).not.toBeNull();
    // total revenue 13 over 3 items -> 4.33/item; 3 items over 2 orders -> 1.5
    expect(b?.avgItemPrice).toBeCloseTo(4.33, 2);
    expect(b?.itemsPerOrder).toBeCloseTo(1.5, 2);
    expect(b?.sampleSize).toBe(2);
  });

  it("is null when there are no sales to learn from", () => {
    expect(fleetBenchmarks([])).toBeNull();
  });
});
