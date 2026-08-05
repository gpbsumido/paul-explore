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
  it("buckets sales into the last N weeks, newest first", () => {
    const weeks = weeklyPayouts([], 1, NOW, 8);
    expect(weeks).toHaveLength(8);
    // Newest bucket starts more recently than the next.
    expect(new Date(weeks[0].weekStart).getTime()).toBeGreaterThan(
      new Date(weeks[1].weekStart).getTime(),
    );
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

    expect(summary.weeks.length).toBe(8);
    expect(summary.totals.grossRevenue).toBe(300);
    expect(summary.totals.netPayout).toBe(
      summary.weeks.reduce((sum, w) => sum + w.netPayout, 0),
    );
  });
});
