import { describe, it, expect } from "vitest";
import type { Expense, Person } from "./types";
import {
  lastNDaysTotal,
  currentCycle,
  categorySplits,
  personSplits,
} from "./analytics";

const NOW = new Date("2026-09-14T12:00:00.000Z");

const expense = (over: Partial<Expense>): Expense => ({
  id: "e",
  categoryId: "food",
  amountCents: 1000,
  occurredAt: NOW.toISOString(),
  personId: "p-1",
  tags: [],
  ...over,
});

const daysAgo = (n: number): string =>
  new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

describe("lastNDaysTotal", () => {
  it("sums only items within N days of now", () => {
    const expenses = [
      expense({ id: "a", amountCents: 1000, occurredAt: daysAgo(1) }),
      expense({ id: "b", amountCents: 2000, occurredAt: daysAgo(10) }),
      expense({ id: "c", amountCents: 9999, occurredAt: daysAgo(40) }),
    ];
    expect(lastNDaysTotal(expenses, NOW, 30)).toBe(3000);
  });

  it("counts an item exactly N days old but not one a second older", () => {
    const expenses = [
      expense({ id: "edge", amountCents: 700, occurredAt: daysAgo(30) }),
      expense({
        id: "just-past",
        amountCents: 5000,
        occurredAt: new Date(
          NOW.getTime() - 30 * 24 * 60 * 60 * 1000 - 1000,
        ).toISOString(),
      }),
    ];
    expect(lastNDaysTotal(expenses, NOW, 30)).toBe(700);
  });

  it("is zero when nothing falls in the window", () => {
    expect(lastNDaysTotal([expense({ occurredAt: daysAgo(90) })], NOW, 30)).toBe(
      0,
    );
  });
});

describe("currentCycle", () => {
  it("includes items on or after the cycle start day of the current month", () => {
    const expenses = [
      expense({ id: "in", occurredAt: "2026-09-05T00:00:00.000Z" }),
      expense({ id: "out", occurredAt: "2026-08-20T00:00:00.000Z" }),
    ];
    const cycle = currentCycle(expenses, NOW, 1);
    expect(cycle.expenses.map((e) => e.id)).toEqual(["in"]);
    expect(cycle.totalCents).toBe(1000);
  });

  it("uses last month's start day when now is before this month's", () => {
    const now = new Date("2026-09-10T00:00:00.000Z");
    const expenses = [
      expense({ id: "in", occurredAt: "2026-08-20T00:00:00.000Z" }),
      expense({ id: "out", occurredAt: "2026-08-10T00:00:00.000Z" }),
    ];
    const cycle = currentCycle(expenses, now, 15);
    expect(cycle.expenses.map((e) => e.id)).toEqual(["in"]);
  });
});

describe("currentCycle start day", () => {
  it("starts the cycle today when now is exactly the start day", () => {
    const now = new Date("2026-09-15T08:00:00.000Z");
    const expenses = [
      expense({ id: "today", occurredAt: "2026-09-15T00:00:00.000Z" }),
      expense({ id: "yesterday", occurredAt: "2026-09-14T23:59:59.000Z" }),
    ];

    const cycle = currentCycle(expenses, now, 15);

    expect(cycle.start.toISOString()).toBe("2026-09-15T00:00:00.000Z");
    expect(cycle.expenses.map((e) => e.id)).toEqual(["today"]);
  });

  it("reaches back into December when now is early January", () => {
    const now = new Date("2027-01-05T12:00:00.000Z");
    const expenses = [
      expense({ id: "in", occurredAt: "2026-12-20T00:00:00.000Z" }),
      expense({ id: "out", occurredAt: "2026-12-10T00:00:00.000Z" }),
    ];

    const cycle = currentCycle(expenses, now, 15);

    expect(cycle.start.toISOString()).toBe("2026-12-15T00:00:00.000Z");
    expect(cycle.expenses.map((e) => e.id)).toEqual(["in"]);
    expect(cycle.totalCents).toBe(1000);
  });
});

describe("categorySplits", () => {
  it("is empty with no expenses", () => {
    expect(categorySplits([])).toEqual([]);
  });

  it("sums cents per category, largest first", () => {
    const expenses = [
      expense({ categoryId: "food", amountCents: 1000 }),
      expense({ categoryId: "food", amountCents: 500 }),
      expense({ categoryId: "rent", amountCents: 9000 }),
    ];
    expect(categorySplits(expenses)).toEqual([
      { categoryId: "rent", totalCents: 9000 },
      { categoryId: "food", totalCents: 1500 },
    ]);
  });
});

describe("personSplits", () => {
  const people: Person[] = [
    { id: "p-1", name: "Paul" },
    { id: "p-2", name: "Sam" },
  ];

  it("sums cents per person and names them", () => {
    const expenses = [
      expense({ personId: "p-1", amountCents: 1000 }),
      expense({ personId: "p-2", amountCents: 2500 }),
      expense({ personId: "p-1", amountCents: 500 }),
    ];
    expect(personSplits(expenses, people)).toEqual([
      { personId: "p-2", name: "Sam", totalCents: 2500 },
      { personId: "p-1", name: "Paul", totalCents: 1500 },
    ]);
  });

  it("names an unknown person Unknown rather than dropping their spend", () => {
    expect(
      personSplits([expense({ personId: "p-gone", amountCents: 800 })], people),
    ).toEqual([{ personId: "p-gone", name: "Unknown", totalCents: 800 }]);
  });

  it("attributes a split item by its shares, not to the owner", () => {
    const expenses = [
      expense({
        personId: "p-1",
        amountCents: 1000,
        splits: [
          { personId: "p-1", amountCents: 250 },
          { personId: "p-2", amountCents: 750 },
        ],
      }),
    ];
    expect(personSplits(expenses, people)).toEqual([
      { personId: "p-2", name: "Sam", totalCents: 750 },
      { personId: "p-1", name: "Paul", totalCents: 250 },
    ]);
  });

  it("falls back to the owner when the splits list is empty", () => {
    const expenses = [expense({ personId: "p-2", amountCents: 600, splits: [] })];
    expect(personSplits(expenses, people)).toEqual([
      { personId: "p-2", name: "Sam", totalCents: 600 },
    ]);
  });
});
