// ---------------------------------------------------------------------------
// Finance: weekly payouts reconciled from real sales, with the fees shown
// rather than folded in. Gross revenue minus the transaction cut minus the
// platform fee is what actually lands in the operator's account, and an
// operator who cannot see the fees cannot tell a bad week from an expensive
// one. Reuses the same fee constants the location planner projects with, so the
// number an operator is quoted and the number they are paid come from one place.
// ---------------------------------------------------------------------------

import { z } from "zod";
import type { Sale } from "@/types/operator";
import {
  PLATFORM_FEE_PER_UNIT_MONTHLY,
  TXN_FEE_FLAT,
  TXN_FEE_RATE,
} from "@/lib/operator-planner";
import { toCents } from "@/lib/operator-utils";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;

export type PayoutWeek = {
  /** ISO timestamp of the week's start (7 days before its end). */
  weekStart: string;
  grossRevenue: number;
  transactionCount: number;
  transactionFees: number;
  platformFees: number;
  netPayout: number;
};

export type FinanceSummary = {
  weeks: readonly PayoutWeek[];
  totals: {
    grossRevenue: number;
    transactionCount: number;
    transactionFees: number;
    platformFees: number;
    netPayout: number;
  };
};

/**
 * Units per store. The platform fee is charged per unit, but a store's hardware
 * count isn't modelled anywhere yet, so this assumes one — stated explicitly
 * rather than hidden inside a bare `storeCount` multiply. When stores can carry
 * a real unit count, this is the single place that changes (and portfolio_api's
 * buildFinance mirrors the same assumption). Kept at 1 so the number is honest
 * about what it currently knows.
 */
const UNITS_PER_STORE = 1;

/**
 * The platform fee for one week: the monthly per-unit fee times the fleet's unit
 * count, prorated to seven days.
 */
function weeklyPlatformFee(storeCount: number): number {
  const units = Math.max(0, storeCount) * UNITS_PER_STORE;
  return toCents(
    PLATFORM_FEE_PER_UNIT_MONTHLY * units * (DAYS_PER_WEEK / DAYS_PER_MONTH),
  );
}

/**
 * Buckets sales into the last `weeks` seven-day windows ending at `now`, newest
 * first, and nets each week's payout after the transaction fee (a rate plus a
 * flat cut per sale) and the prorated platform fee. Sales outside the window are
 * ignored.
 */
export function weeklyPayouts(
  sales: readonly Sale[],
  storeCount: number,
  now: Date = new Date(),
  weeks: number = 8,
): readonly PayoutWeek[] {
  const nowMs = now.getTime();
  const platformFees = weeklyPlatformFee(storeCount);

  const gross = new Array<number>(weeks).fill(0);
  const counts = new Array<number>(weeks).fill(0);

  for (const sale of sales) {
    const ageDays = (nowMs - new Date(sale.timestamp).getTime()) / MS_PER_DAY;
    if (ageDays < 0) continue;
    const bucket = Math.floor(ageDays / DAYS_PER_WEEK);
    if (bucket >= weeks) continue;
    gross[bucket] += sale.total;
    counts[bucket] += 1;
  }

  return gross.map((grossRevenue, i) => {
    const revenue = toCents(grossRevenue);
    const transactionFees = toCents(
      revenue * TXN_FEE_RATE + counts[i] * TXN_FEE_FLAT,
    );
    return {
      weekStart: new Date(nowMs - (i + 1) * DAYS_PER_WEEK * MS_PER_DAY).toISOString(),
      grossRevenue: revenue,
      transactionCount: counts[i],
      transactionFees,
      platformFees,
      netPayout: toCents(revenue - transactionFees - platformFees),
    };
  });
}

/** Rolls the weekly payouts up into the headline totals. */
export function summarizeFinance(
  sales: readonly Sale[],
  storeCount: number,
  now: Date = new Date(),
  weeks: number = 8,
): FinanceSummary {
  const weekly = weeklyPayouts(sales, storeCount, now, weeks);
  const totals = weekly.reduce(
    (acc, week) => ({
      grossRevenue: toCents(acc.grossRevenue + week.grossRevenue),
      transactionCount: acc.transactionCount + week.transactionCount,
      transactionFees: toCents(acc.transactionFees + week.transactionFees),
      platformFees: toCents(acc.platformFees + week.platformFees),
      netPayout: toCents(acc.netPayout + week.netPayout),
    }),
    {
      grossRevenue: 0,
      transactionCount: 0,
      transactionFees: 0,
      platformFees: 0,
      netPayout: 0,
    },
  );
  return { weeks: weekly, totals };
}

/** Runtime shape of a payout week, for validating the API response. */
export const payoutWeekSchema = z.object({
  weekStart: z.string(),
  grossRevenue: z.number(),
  transactionCount: z.number().int().min(0),
  transactionFees: z.number(),
  platformFees: z.number(),
  netPayout: z.number(),
});

/** The finance endpoint response: weekly payouts, totals, and the fee model. */
export const financeResponseSchema = z.object({
  weeks: z.array(payoutWeekSchema),
  totals: z.object({
    grossRevenue: z.number(),
    transactionCount: z.number().int().min(0),
    transactionFees: z.number(),
    platformFees: z.number(),
    netPayout: z.number(),
  }),
  fees: z.object({
    transactionRate: z.number(),
    transactionFlat: z.number(),
    platformPerUnitMonthly: z.number(),
  }),
});

export type FinanceResponse = z.infer<typeof financeResponseSchema>;

/** The fee model, surfaced to the client so the breakdown card is honest. */
export const FEE_MODEL = {
  transactionRate: TXN_FEE_RATE,
  transactionFlat: TXN_FEE_FLAT,
  platformPerUnitMonthly: PLATFORM_FEE_PER_UNIT_MONTHLY,
} as const;
