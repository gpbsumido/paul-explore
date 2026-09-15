import { describe, it, expect } from "vitest";
import { loadBudget, addExpense, updateExpense, deleteExpense } from "./budgetStore";
import { personSplits } from "./analytics";
import type { Person } from "./types";

const makeStorage = (): Storage => {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
};

const NOW = "2026-09-14T12:00:00.000Z";

const seed = (storage: Storage) =>
  addExpense({ categoryId: "food", amountCents: 1000 }, storage, { id: "e-1", now: NOW });

describe("updateExpense", () => {
  it("changes the amount, category, and tags of an existing item", () => {
    const storage = makeStorage();
    seed(storage);
    const after = updateExpense(
      "e-1",
      { amountCents: 2500, categoryId: "rent", tags: ["necessary"] },
      storage,
    );
    expect(after.expenses[0]).toMatchObject({
      id: "e-1",
      amountCents: 2500,
      categoryId: "rent",
      tags: ["necessary"],
    });
    expect(loadBudget(storage).expenses[0].amountCents).toBe(2500);
  });

  it("re-tags an item after the fact", () => {
    const storage = makeStorage();
    seed(storage);
    const after = updateExpense("e-1", { tags: ["unnecessary"] }, storage);
    expect(after.expenses[0].tags).toEqual(["unnecessary"]);
  });

  it("sets a per-person split on an item", () => {
    const storage = makeStorage();
    seed(storage);
    const after = updateExpense(
      "e-1",
      {
        splits: [
          { personId: "p-you", amountCents: 600 },
          { personId: "p-sam", amountCents: 400 },
        ],
      },
      storage,
    );
    expect(after.expenses[0].splits).toHaveLength(2);
  });

  it("leaves other items untouched and ignores an unknown id", () => {
    const storage = makeStorage();
    seed(storage);
    const before = loadBudget(storage);
    expect(updateExpense("nope", { amountCents: 9 }, storage)).toEqual(before);
  });
});

describe("deleteExpense", () => {
  it("removes an item", () => {
    const storage = makeStorage();
    seed(storage);
    const after = deleteExpense("e-1", storage);
    expect(after.expenses).toEqual([]);
    expect(loadBudget(storage).expenses).toEqual([]);
  });
});

describe("personSplits with per-item splits", () => {
  const people: Person[] = [
    { id: "p-you", name: "You" },
    { id: "p-sam", name: "Sam" },
  ];

  it("attributes a split item across people instead of to one owner", () => {
    const storage = makeStorage();
    seed(storage);
    updateExpense(
      "e-1",
      {
        splits: [
          { personId: "p-you", amountCents: 600 },
          { personId: "p-sam", amountCents: 400 },
        ],
      },
      storage,
    );
    const split = personSplits(loadBudget(storage).expenses, people);
    expect(split).toEqual([
      { personId: "p-you", name: "You", totalCents: 600 },
      { personId: "p-sam", name: "Sam", totalCents: 400 },
    ]);
  });
});
