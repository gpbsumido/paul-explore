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
  plannerInputsToQuery,
  plannerInputsFromParams,
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

  it("has a default input that projects a location which pays back", () => {
    const projection = projectLocation(DEFAULT_PLANNER_INPUTS);
    expect(projection.ordersPerMonth).toBeGreaterThan(0);
    expect(projection.netProfitMonthly).toBeGreaterThan(0);
    expect(projection.paybackMonths).not.toBeNull();
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
    expect(p.paybackMonths).toBe(4.9);
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

  it("returns null payback when fees leave exactly zero profit", () => {
    // 7% of $3,000 is $210, which is the $60 platform fee plus the $150 txn fee
    const breakEven = projectLocation({ ...PROFITABLE, margin: 7 });
    expect(breakEven.netProfitMonthly).toBe(0);
    expect(breakEven.paybackMonths).toBeNull();
  });

  it("scales orders, revenue per unit and hardware cost with the unit count", () => {
    const p = projectLocation({ ...PROFITABLE, units: 3 });
    expect(p.ordersPerMonth).toBe(900);
    expect(p.grossRevenueMonthly).toBe(9000);
    expect(p.revenuePerUnitAnnual).toBe(36000);
    // three units get the bulk price each
    expect(p.hardwareCost).toBe(UNIT_PRICE_BULK * 3);
  });

  it("counts a fractional unit count as whole units, and at least one", () => {
    const fractional = projectLocation({ ...PROFITABLE, units: 2.9 });
    const none = projectLocation({ ...PROFITABLE, units: 0 });
    expect(fractional.platformFeesMonthly).toBe(PLATFORM_FEE_PER_UNIT_MONTHLY * 2);
    expect(none.platformFeesMonthly).toBe(PLATFORM_FEE_PER_UNIT_MONTHLY);
    expect(none.ordersPerMonth).toBe(300);
  });

  it("caps a conversion rate above 100% at everyone buying", () => {
    const capped = projectLocation({ ...PROFITABLE, conversionRate: 250 });
    // 100 people a day, all buying, 30 days
    expect(capped.ordersPerMonth).toBe(3000);
  });

  it("treats negative traffic as no traffic", () => {
    const p = projectLocation({ ...PROFITABLE, dailyFootTraffic: -50 });
    expect(p.ordersPerMonth).toBe(0);
    expect(p.grossRevenueMonthly).toBe(0);
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
    // total revenue 13 over 3 items -> 4.33/item; 3 items over 2 orders -> 1.5
    expect(fleetBenchmarks(sales)).toEqual({
      avgItemPrice: 4.33,
      itemsPerOrder: 1.5,
      sampleSize: 2,
    });
  });

  it("rounds items per order to one decimal", () => {
    const sales = [
      buildSale({ quantity: 1, total: 1 }),
      buildSale({ quantity: 1, total: 1 }),
      buildSale({ quantity: 2, total: 2 }),
    ];
    // 4 items over 3 orders is 1.333...
    expect(fleetBenchmarks(sales)?.itemsPerOrder).toBe(1.3);
  });

  it("reports a zero price rather than NaN when no items were sold", () => {
    const sales = [buildSale({ quantity: 0, total: 0 })];
    expect(fleetBenchmarks(sales)?.avgItemPrice).toBe(0);
  });

  it("is null when there are no sales to learn from", () => {
    expect(fleetBenchmarks([])).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// URL round-trip: a planned location is a shareable link
// ---------------------------------------------------------------------------

describe("planner URL state", () => {
  it("round-trips inputs through a query string", () => {
    const params = new URLSearchParams(plannerInputsToQuery(PROFITABLE));
    const { inputs, hasQuery } = plannerInputsFromParams(
      Object.fromEntries(params.entries()),
    );
    expect(hasQuery).toBe(true);
    expect(inputs).toEqual(PROFITABLE);
  });

  it("falls back to defaults and reports no query for an empty URL", () => {
    const { inputs, hasQuery } = plannerInputsFromParams({});
    expect(hasQuery).toBe(false);
    expect(inputs).toEqual(DEFAULT_PLANNER_INPUTS);
  });

  it("reads the first value when a param is repeated", () => {
    const { inputs } = plannerInputsFromParams({ un: ["4", "9"] });
    expect(inputs.units).toBe(4);
  });

  it("reports a query when only one planner param is present", () => {
    expect(plannerInputsFromParams({ mg: "30" }).hasQuery).toBe(true);
  });

  it("ignores params that are not planner state", () => {
    expect(plannerInputsFromParams({ utm_source: "mail" }).hasQuery).toBe(false);
  });

  // Known bug: Number("") is 0, so a blank param quietly zeroes the input instead of
  // falling back to the default like any other unparseable value does.
  it.fails("falls back to the default for a blank param", () => {
    const { inputs } = plannerInputsFromParams({ ft: "" });
    expect(inputs.dailyFootTraffic).toBe(DEFAULT_PLANNER_INPUTS.dailyFootTraffic);
  });

  it("ignores an unparseable param and keeps the rest", () => {
    const { inputs } = plannerInputsFromParams({ ft: "not-a-number", un: "3" });
    expect(inputs.dailyFootTraffic).toBe(DEFAULT_PLANNER_INPUTS.dailyFootTraffic);
    expect(inputs.units).toBe(3);
  });
});
