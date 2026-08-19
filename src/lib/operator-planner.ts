// ---------------------------------------------------------------------------
// Location planner: model a new location's revenue and payback before an
// operator commits to it. All pure, all take explicit inputs, all round money
// to cents. Mirrors the shape of MicroMart's Smart-Pantry profit calculator:
// foot traffic and conversion drive orders, a basket size and price drive
// revenue, a margin and the platform's fees drive profit, and hardware cost
// over monthly net profit is the payback period.
// ---------------------------------------------------------------------------

import { z } from "zod";
import type { Sale } from "@/types/operator";
import { clampPercent, toCents } from "@/lib/operator-utils";

/** Flat platform fee charged per unit per month. */
export const PLATFORM_FEE_PER_UNIT_MONTHLY = 60;
/** Transaction fee taken as a fraction of revenue. */
export const TXN_FEE_RATE = 0.04;
/** Transaction fee taken as a flat cut per order, in dollars. */
export const TXN_FEE_FLAT = 0.1;
/** Hardware price for a single unit. */
export const UNIT_PRICE_SINGLE = 6295;
/** Discounted hardware price once ordering in bulk. */
export const UNIT_PRICE_BULK = 5995;
/** The unit count at which the bulk price kicks in. */
export const BULK_THRESHOLD = 3;
/** A month is modelled as 30 days for the projection. */
export const DAYS_PER_MONTH = 30;

/**
 * Location presets with a representative conversion rate each. A workplace with
 * captive foot traffic converts far more of it than a semi-public lobby.
 */
export const LOCATION_TYPES = [
  { id: "semi-public", label: "Semi-public", conversionRate: 2 },
  { id: "residential", label: "Residential", conversionRate: 5 },
  { id: "workplace", label: "Workplace", conversionRate: 9 },
] as const;

/** Basket-price presets, from a vending price point up to a retail one. */
export const PRICE_TIERS = [
  { id: "vending", label: "Vending", avgItemPrice: 2.5 },
  { id: "micro-market", label: "Micro-market", avgItemPrice: 4.5 },
  { id: "retail", label: "Retail", avgItemPrice: 7 },
] as const;

/** Gross-margin presets by product mix. Fresh food carries the least margin. */
export const MARGIN_TIERS = [
  { id: "fresh-food", label: "Fresh food", margin: 35 },
  { id: "snacks-drinks", label: "Snacks & drinks", margin: 45 },
  { id: "specialty", label: "Specialty", margin: 55 },
] as const;

export type PlannerInputs = {
  /** People passing the location per day. */
  dailyFootTraffic: number;
  /** Share of that traffic that buys, as a percentage. */
  conversionRate: number;
  /** Average price of a single item, in dollars. */
  avgItemPrice: number;
  /** Average number of items in one order. */
  itemsPerOrder: number;
  /** Gross margin on revenue, as a percentage. */
  margin: number;
  /** Number of units deployed at the location. */
  units: number;
};

/**
 * A sensible starting point for the UI: a mid-sized residential location at a
 * micro-market price point. Overridden by real fleet benchmarks when available.
 */
export const DEFAULT_PLANNER_INPUTS: PlannerInputs = {
  dailyFootTraffic: 75,
  conversionRate: 5,
  avgItemPrice: 4.5,
  itemsPerOrder: 1.9,
  margin: 45,
  units: 1,
};

export type LocationProjection = {
  ordersPerMonth: number;
  itemsPerMonth: number;
  grossRevenueMonthly: number;
  grossRevenueAnnual: number;
  revenuePerUnitAnnual: number;
  platformFeesMonthly: number;
  transactionFeesMonthly: number;
  grossProfitMonthly: number;
  netProfitMonthly: number;
  netProfitAnnual: number;
  hardwareCost: number;
  /**
   * Months to recover the hardware cost from monthly net profit, or null when
   * the location never pays back because net profit is zero or negative. Null
   * is the honest answer; a fabricated number would read as a promise.
   */
  paybackMonths: number | null;
};

/** Rounds to a single decimal place, for whole-ish figures like months. */
function toTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Clamps a value to be non-negative. */
function nonNeg(value: number): number {
  return Math.max(0, value);
}

/** The whole number of units, floored to at least one. */
function unitCount(units: number): number {
  return Math.max(1, Math.floor(units));
}

/**
 * The per-unit hardware price for an order of `units`, dropping to the bulk
 * price at or above the bulk threshold.
 */
export function unitHardwarePrice(units: number): number {
  return unitCount(units) >= BULK_THRESHOLD ? UNIT_PRICE_BULK : UNIT_PRICE_SINGLE;
}

/**
 * Projects a location's monthly and annual economics from the planner inputs:
 * orders and items from traffic and conversion, revenue from the basket,
 * profit after cost of goods and both platform fees, and the payback period.
 */
export function projectLocation(inputs: PlannerInputs): LocationProjection {
  const traffic = nonNeg(inputs.dailyFootTraffic);
  const conversion = clampPercent(inputs.conversionRate);
  const price = nonNeg(inputs.avgItemPrice);
  const basket = nonNeg(inputs.itemsPerOrder);
  const margin = clampPercent(inputs.margin);
  const units = unitCount(inputs.units);

  const ordersPerMonth = traffic * (conversion / 100) * DAYS_PER_MONTH * units;
  const itemsPerMonth = ordersPerMonth * basket;
  const grossRevenueMonthly = toCents(itemsPerMonth * price);
  const grossRevenueAnnual = toCents(grossRevenueMonthly * 12);

  const platformFeesMonthly = toCents(PLATFORM_FEE_PER_UNIT_MONTHLY * units);
  const transactionFeesMonthly = toCents(
    grossRevenueMonthly * TXN_FEE_RATE + ordersPerMonth * TXN_FEE_FLAT,
  );
  const grossProfitMonthly = toCents(grossRevenueMonthly * (margin / 100));
  const netProfitMonthly = toCents(
    grossProfitMonthly - platformFeesMonthly - transactionFeesMonthly,
  );

  const hardwareCost = toCents(unitHardwarePrice(units) * units);

  return {
    ordersPerMonth,
    itemsPerMonth,
    grossRevenueMonthly,
    grossRevenueAnnual,
    revenuePerUnitAnnual: toCents(grossRevenueAnnual / units),
    platformFeesMonthly,
    transactionFeesMonthly,
    grossProfitMonthly,
    netProfitMonthly,
    netProfitAnnual: toCents(netProfitMonthly * 12),
    hardwareCost,
    paybackMonths:
      netProfitMonthly > 0 ? toTenth(hardwareCost / netProfitMonthly) : null,
  };
}

/**
 * Short URL param keys for each input, so a planned location is a shareable
 * link. Kept terse because they show in the address bar.
 */
const PARAM_KEYS: Record<keyof PlannerInputs, string> = {
  dailyFootTraffic: "ft",
  conversionRate: "cv",
  avgItemPrice: "pr",
  itemsPerOrder: "ip",
  margin: "mg",
  units: "un",
};

/** Serialises planner inputs into a query string for a shareable link. */
export function plannerInputsToQuery(inputs: PlannerInputs): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(PARAM_KEYS) as (keyof PlannerInputs)[]) {
    params.set(PARAM_KEYS[key], String(inputs[key]));
  }
  return params.toString();
}

/**
 * Reads planner inputs back out of a URL's search params, falling back to the
 * bundled defaults for anything missing or unparseable. `hasQuery` reports
 * whether the URL carried any planner state at all, so a fresh visit can be
 * told apart from a shared link and prefilled from the fleet instead.
 */
export function plannerInputsFromParams(
  params: Record<string, string | string[] | undefined>,
): { inputs: PlannerInputs; hasQuery: boolean } {
  const read = (key: keyof PlannerInputs): number => {
    const raw = params[PARAM_KEYS[key]];
    const value = Array.isArray(raw) ? raw[0] : raw;
    const parsed = value == null ? NaN : Number(value);
    return Number.isFinite(parsed) ? parsed : DEFAULT_PLANNER_INPUTS[key];
  };
  const hasQuery = (Object.keys(PARAM_KEYS) as (keyof PlannerInputs)[]).some(
    (key) => params[PARAM_KEYS[key]] != null,
  );
  return {
    inputs: {
      dailyFootTraffic: read("dailyFootTraffic"),
      conversionRate: read("conversionRate"),
      avgItemPrice: read("avgItemPrice"),
      itemsPerOrder: read("itemsPerOrder"),
      margin: read("margin"),
      units: read("units"),
    },
    hasQuery,
  };
}

export type FleetBenchmarks = {
  /** Mean price per item sold across the fleet, in dollars. */
  avgItemPrice: number;
  /** Mean number of items in one transaction across the fleet. */
  itemsPerOrder: number;
  /** How many transactions the benchmark was learned from. */
  sampleSize: number;
};

/**
 * Derives planner defaults from real fleet sales: the mean price paid per item
 * and the mean items per transaction. Returns null when there are no sales to
 * learn from, so the caller can fall back to bundled defaults rather than
 * showing a fabricated zero.
 */
export function fleetBenchmarks(
  sales: readonly Sale[],
): FleetBenchmarks | null {
  if (sales.length === 0) return null;

  let revenue = 0;
  let items = 0;
  for (const sale of sales) {
    revenue += sale.total;
    items += sale.quantity;
  }

  return {
    avgItemPrice: items > 0 ? toCents(revenue / items) : 0,
    itemsPerOrder: toTenth(items / sales.length),
    sampleSize: sales.length,
  };
}

/** Runtime shape of the fleet benchmarks, for validating the API response. */
export const fleetBenchmarksSchema = z.object({
  avgItemPrice: z.number(),
  itemsPerOrder: z.number(),
  sampleSize: z.number().int().nonnegative(),
});

/** The benchmarks endpoint response: null benchmarks when the fleet has no sales. */
export const plannerBenchmarksResponseSchema = z.object({
  benchmarks: fleetBenchmarksSchema.nullable(),
});
