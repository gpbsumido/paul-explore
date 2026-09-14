import { describe, it, expect } from "vitest";
import {
  loadBudget,
  addExpense,
  addPerson,
  setActivePerson,
  setCycleStartDay,
  BUDGET_KEY,
} from "./budgetStore";

/** A tiny in-memory Storage stand-in, so the store never touches a real DOM. */
const makeStorage = (): Storage => {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
};

const NOW = "2026-09-14T12:00:00.000Z";

describe("loadBudget", () => {
  it("returns a starter budget with one person when storage is empty", () => {
    const budget = loadBudget(makeStorage());
    expect(budget.people).toHaveLength(1);
    expect(budget.activePersonId).toBe(budget.people[0].id);
    expect(budget.expenses).toEqual([]);
  });

  it("tolerates corrupt storage by falling back to the starter budget", () => {
    const storage = makeStorage();
    storage.setItem(BUDGET_KEY, "{not json");
    expect(loadBudget(storage).expenses).toEqual([]);
  });
});

describe("addExpense", () => {
  it("stores an item attributed to the active person", () => {
    const storage = makeStorage();
    const before = loadBudget(storage);
    const after = addExpense(
      { categoryId: "food", amountCents: 1234 },
      storage,
      { id: "e-1", now: NOW },
    );
    expect(after.expenses).toHaveLength(1);
    expect(after.expenses[0]).toMatchObject({
      id: "e-1",
      categoryId: "food",
      amountCents: 1234,
      personId: before.activePersonId,
      occurredAt: NOW,
      tags: [],
    });
  });

  it("defaults occurredAt to the supplied now when none is given", () => {
    const storage = makeStorage();
    const after = addExpense(
      { categoryId: "food", amountCents: 500 },
      storage,
      { id: "e-1", now: NOW },
    );
    expect(after.expenses[0].occurredAt).toBe(NOW);
  });

  it("keeps an explicit occurredAt when provided", () => {
    const storage = makeStorage();
    const when = "2026-01-02T03:04:05.000Z";
    const after = addExpense(
      { categoryId: "food", amountCents: 500, occurredAt: when },
      storage,
      { id: "e-1", now: NOW },
    );
    expect(after.expenses[0].occurredAt).toBe(when);
  });

  it("carries tags supplied at add time", () => {
    const storage = makeStorage();
    const after = addExpense(
      { categoryId: "food", amountCents: 500, tags: ["necessary"] },
      storage,
      { id: "e-1", now: NOW },
    );
    expect(after.expenses[0].tags).toEqual(["necessary"]);
  });

  it("persists across a reload", () => {
    const storage = makeStorage();
    addExpense({ categoryId: "food", amountCents: 700 }, storage, {
      id: "e-1",
      now: NOW,
    });
    expect(loadBudget(storage).expenses).toHaveLength(1);
  });
});

describe("people", () => {
  it("adds a person without changing who is active", () => {
    const storage = makeStorage();
    const start = loadBudget(storage);
    const after = addPerson("Sam", storage, { id: "p-sam" });
    expect(after.people).toHaveLength(2);
    expect(after.activePersonId).toBe(start.activePersonId);
  });

  it("switches the active person so new items are attributed to them", () => {
    const storage = makeStorage();
    addPerson("Sam", storage, { id: "p-sam" });
    setActivePerson("p-sam", storage);
    const after = addExpense(
      { categoryId: "food", amountCents: 100 },
      storage,
      { id: "e-1", now: NOW },
    );
    expect(after.expenses[0].personId).toBe("p-sam");
  });
});

describe("setCycleStartDay", () => {
  it("persists the billing-cycle start day", () => {
    const storage = makeStorage();
    const after = setCycleStartDay(15, storage);
    expect(after.cycleStartDay).toBe(15);
    expect(loadBudget(storage).cycleStartDay).toBe(15);
  });
});
