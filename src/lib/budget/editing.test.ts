import { describe, it, expect } from "vitest";
import { BUDGET_KEY, loadBudget, addExpense, updateExpense, deleteExpense } from "./budgetStore";
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
    expect(after.expenses[0].splits).toEqual([
      { personId: "p-you", amountCents: 600 },
      { personId: "p-sam", amountCents: 400 },
    ]);
    expect(loadBudget(storage).expenses[0].splits).toEqual(after.expenses[0].splits);
  });

  it("ignores an unknown id", () => {
    const storage = makeStorage();
    seed(storage);
    const before = loadBudget(storage);
    expect(updateExpense("nope", { amountCents: 9 }, storage)).toEqual(before);
    expect(loadBudget(storage)).toEqual(before);
  });

  it("does not write to storage for an unknown id", () => {
    const storage = makeStorage();
    updateExpense("nope", { amountCents: 9 }, storage);
    expect(storage.getItem(BUDGET_KEY)).toBeNull();
  });

  it("changes only the targeted item and keeps the fields it was not given", () => {
    const storage = makeStorage();
    seed(storage);
    addExpense({ categoryId: "rent", amountCents: 9000, note: "september" }, storage, {
      id: "e-2",
      now: NOW,
    });

    const after = updateExpense("e-2", { amountCents: 9500 }, storage);

    const first = after.expenses.find((e) => e.id === "e-1");
    const second = after.expenses.find((e) => e.id === "e-2");
    expect(first).toMatchObject({ amountCents: 1000, categoryId: "food" });
    expect(second).toMatchObject({
      amountCents: 9500,
      categoryId: "rent",
      note: "september",
      occurredAt: NOW,
    });
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

describe("deleteExpense with several items", () => {
  it("removes only the matching item", () => {
    const storage = makeStorage();
    seed(storage);
    addExpense({ categoryId: "rent", amountCents: 9000 }, storage, { id: "e-2", now: NOW });

    const after = deleteExpense("e-1", storage);

    expect(after.expenses.map((e) => e.id)).toEqual(["e-2"]);
  });

  it("leaves everything alone for an unknown id", () => {
    const storage = makeStorage();
    seed(storage);

    const after = deleteExpense("nope", storage);

    expect(after.expenses.map((e) => e.id)).toEqual(["e-1"]);
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
