import { describe, it, expect } from "vitest";
import { weeklyPayouts, summarizeFinance } from "@/lib/operator-finance";
import { buildSale } from "@/test/factories/operator";

const NOW = new Date("2026-08-04T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function saleDaysAgo(total: number, daysAgo: number) {
  return buildSale({
    total,
    quantity: 1,
    timestamp: new Date(NOW.getTime() - daysAgo * DAY).toISOString(),
  });
}

// ---------------------------------------------------------------------------
// weeklyPayouts
// ---------------------------------------------------------------------------

describe("weeklyPayouts", () => {
  it("covers the last N weeks, newest first, each starting 7 days before it ends", () => {
    const weeks = weeklyPayouts([], 1, NOW, 8);
    expect(weeks).toHaveLength(8);
    expect(weeks.map((w) => w.weekStart)).toEqual([
      "2026-07-28T12:00:00.000Z",
      "2026-07-21T12:00:00.000Z",
      "2026-07-14T12:00:00.000Z",
      "2026-07-07T12:00:00.000Z",
      "2026-06-30T12:00:00.000Z",
      "2026-06-23T12:00:00.000Z",
      "2026-06-16T12:00:00.000Z",
      "2026-06-09T12:00:00.000Z",
    ]);
  });

  it("defaults to eight weeks", () => {
    expect(weeklyPayouts([], 1, NOW)).toHaveLength(8);
  });

  it("puts each sale in the seven-day window it falls in", () => {
    const sales = [
      saleDaysAgo(1, 0),
      saleDaysAgo(2, 6.5),
      saleDaysAgo(4, 7.5),
      saleDaysAgo(8, 55.5),
    ];
    const weeks = weeklyPayouts(sales, 1, NOW, 8);
    expect(weeks.map((w) => w.grossRevenue)).toEqual([3, 4, 0, 0, 0, 0, 0, 8]);
    expect(weeks.map((w) => w.transactionCount)).toEqual([2, 1, 0, 0, 0, 0, 0, 1]);
  });

  it("drops a sale exactly at the edge of the window, and one dated in the future", () => {
    const sales = [saleDaysAgo(100, 56), saleDaysAgo(100, -1)];
    const weeks = weeklyPayouts(sales, 1, NOW, 8);
    expect(weeks).toHaveLength(8);
    expect(weeks.every((w) => w.grossRevenue === 0)).toBe(true);
  });

  it("nets a week's payout after transaction and platform fees", () => {
    const sales = [saleDaysAgo(100, 1), saleDaysAgo(50, 2)];
    const [week] = weeklyPayouts(sales, 1, NOW, 8);

    expect(week.grossRevenue).toBe(150);
    expect(week.transactionCount).toBe(2);
    // 4% of 150 + $0.10 x 2 = 6.00 + 0.20
    expect(week.transactionFees).toBe(6.2);
    // $60/unit/mo x 1 store x 7/30 = 14.00
    expect(week.platformFees).toBe(14);
    expect(week.netPayout).toBe(129.8); // 150 - 6.20 - 14
  });

  it("scales the platform fee with the number of stores", () => {
    const [oneStore] = weeklyPayouts([], 1, NOW, 8);
    const [threeStores] = weeklyPayouts([], 3, NOW, 8);
    expect(threeStores.platformFees).toBe(oneStore.platformFees * 3);
  });

  it("charges no platform fee for a negative store count", () => {
    const [week] = weeklyPayouts([], -2, NOW, 8);
    expect(week.platformFees).toBe(0);
  });

  it("ignores sales older than the window", () => {
    const sales = [saleDaysAgo(100, 3), saleDaysAgo(999, 400)];
    const total = weeklyPayouts(sales, 1, NOW, 8).reduce(
      (sum, w) => sum + w.grossRevenue,
      0,
    );
    expect(total).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// summarizeFinance
// ---------------------------------------------------------------------------

describe("summarizeFinance", () => {
  it("totals gross, fees and net across the weeks", () => {
    const sales = [saleDaysAgo(100, 1), saleDaysAgo(200, 10)];
    const summary = summarizeFinance(sales, 1, NOW, 8);

    expect(summary.weeks).toHaveLength(8);
    expect(summary.totals).toEqual({
      grossRevenue: 300,
      transactionCount: 2,
      // week 0: 4% of 100 + 0.10, week 1: 4% of 200 + 0.10
      transactionFees: 12.2,
      // 8 weeks at 14.00
      platformFees: 112,
      netPayout: 175.8,
    });
  });
});
