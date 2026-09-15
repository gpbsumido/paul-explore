import { describe, it, expect } from "vitest";
import type { Expense } from "./types";
import { periodStart, historicalTotals, periodComparison } from "./analytics";

const at = (iso: string, amountCents: number, id = iso): Expense => ({
  id,
  categoryId: "food",
  amountCents,
  occurredAt: iso,
  personId: "p-1",
  tags: [],
});

describe("periodStart", () => {
  it("snaps to the first of the month in UTC", () => {
    expect(periodStart(new Date("2026-09-14T12:00:00Z"), "month").toISOString()).toBe(
      "2026-09-01T00:00:00.000Z",
    );
  });

  it("snaps to the first of the year in UTC", () => {
    expect(periodStart(new Date("2026-09-14T12:00:00Z"), "year").toISOString()).toBe(
      "2026-01-01T00:00:00.000Z",
    );
  });

  it("snaps to the Monday of the week in UTC", () => {
    // 2026-09-14 is a Monday; 2026-09-16 (Wed) snaps back to it.
    expect(periodStart(new Date("2026-09-16T12:00:00Z"), "week").toISOString()).toBe(
      "2026-09-14T00:00:00.000Z",
    );
  });
});

describe("historicalTotals", () => {
  it("returns the last N monthly buckets, oldest first, with totals and labels", () => {
    const expenses = [
      at("2026-09-10T00:00:00Z", 1000, "a"),
      at("2026-09-20T00:00:00Z", 500, "b"),
      at("2026-08-05T00:00:00Z", 2000, "c"),
      at("2026-06-01T00:00:00Z", 9999, "old"),
    ];
    const buckets = historicalTotals(expenses, new Date("2026-09-14T12:00:00Z"), "month", 3);
    expect(buckets.map((b) => b.label)).toEqual(["Jul 2026", "Aug 2026", "Sep 2026"]);
    expect(buckets.map((b) => b.totalCents)).toEqual([0, 2000, 1500]);
  });

  it("buckets by year", () => {
    const expenses = [at("2026-02-01T00:00:00Z", 700), at("2025-11-01T00:00:00Z", 300)];
    const buckets = historicalTotals(expenses, new Date("2026-09-14T12:00:00Z"), "year", 2);
    expect(buckets.map((b) => b.label)).toEqual(["2025", "2026"]);
    expect(buckets.map((b) => b.totalCents)).toEqual([300, 700]);
  });
});

describe("periodComparison", () => {
  it("compares the current month against the previous", () => {
    const expenses = [
      at("2026-09-10T00:00:00Z", 1500, "cur"),
      at("2026-08-10T00:00:00Z", 1000, "prev"),
    ];
    const cmp = periodComparison(expenses, new Date("2026-09-14T12:00:00Z"), "month");
    expect(cmp.currentCents).toBe(1500);
    expect(cmp.previousCents).toBe(1000);
    expect(cmp.deltaCents).toBe(500);
    expect(cmp.deltaPct).toBe(50);
  });

  it("has a null percentage when the previous period was empty", () => {
    const cmp = periodComparison(
      [at("2026-09-10T00:00:00Z", 1500)],
      new Date("2026-09-14T12:00:00Z"),
      "month",
    );
    expect(cmp.previousCents).toBe(0);
    expect(cmp.deltaPct).toBeNull();
  });
});
