import { describe, it, expect } from "vitest";
import {
  loadBudget,
  addExpense,
  addPerson,
  setActivePerson,
  setCycleStartDay,
  joinBudget,
  setVisibility,
  requestToJoin,
  approveJoinRequest,
  denyJoinRequest,
  BUDGET_KEY,
} from "./budgetStore";
import { encodeInvite } from "./share";
import type { Budget } from "./types";

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

  it("falls back to the starter budget when the stored JSON is the wrong shape", () => {
    const storage = makeStorage();
    storage.setItem(
      BUDGET_KEY,
      JSON.stringify({ people: [], activePersonId: "p-1", cycleStartDay: 99, expenses: [] }),
    );
    const budget = loadBudget(storage);
    expect(budget.people).toHaveLength(1);
    expect(budget.cycleStartDay).toBe(1);
  });

  it("falls back to the starter budget when reading storage throws", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {},
    };
    expect(loadBudget(blocked).expenses).toEqual([]);
  });

  it("starts private with no pending join requests", () => {
    const budget = loadBudget(makeStorage());
    expect(budget.visibility).toBe("private");
    expect(budget.joinRequests).toEqual([]);
  });

  it("loads an older stored budget that predates the sharing fields", () => {
    const storage = makeStorage();
    storage.setItem(
      BUDGET_KEY,
      JSON.stringify({
        people: [{ id: "p-1", name: "You" }],
        activePersonId: "p-1",
        cycleStartDay: 1,
        expenses: [],
      }),
    );
    const budget = loadBudget(storage);
    expect(budget.visibility).toBe("private");
    expect(budget.joinRequests).toEqual([]);
  });
});

describe("when storage refuses writes", () => {
  it("still hands back the updated budget for this session", () => {
    const full = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    const after = addExpense({ categoryId: "food", amountCents: 500 }, full, {
      id: "e-1",
      now: NOW,
    });
    expect(after.expenses.map((e) => e.id)).toEqual(["e-1"]);
  });
});

describe("sharing", () => {
  it("makes a budget public and records the owner email others request with", () => {
    const storage = makeStorage();
    const after = setVisibility("public", storage, { ownerEmail: "me@example.com" });
    expect(after.visibility).toBe("public");
    expect(after.ownerEmail).toBe("me@example.com");
    expect(loadBudget(storage).visibility).toBe("public");
  });

  it("keeps the owner email when the budget goes private again without one", () => {
    const storage = makeStorage();
    setVisibility("public", storage, { ownerEmail: "me@example.com" });
    const after = setVisibility("private", storage);
    expect(after.visibility).toBe("private");
    expect(after.ownerEmail).toBe("me@example.com");
  });

  it("trims the name and email on a request to join", () => {
    const after = requestToJoin(
      { name: "  Sam ", email: " sam@example.com " },
      makeStorage(),
      { id: "r-1", now: NOW },
    );
    expect(after.joinRequests[0]).toMatchObject({ name: "Sam", email: "sam@example.com" });
  });

  it("approving an unknown request changes nothing", () => {
    const storage = makeStorage();
    requestToJoin({ name: "Sam", email: "sam@example.com" }, storage, { id: "r-1", now: NOW });
    const before = loadBudget(storage);
    expect(approveJoinRequest("r-missing", storage, { id: "p-x" })).toEqual(before);
  });

  it("denying one request leaves the others waiting", () => {
    const storage = makeStorage();
    requestToJoin({ name: "Sam", email: "sam@example.com" }, storage, { id: "r-1", now: NOW });
    requestToJoin({ name: "Alex", email: "alex@example.com" }, storage, { id: "r-2", now: NOW });
    const after = denyJoinRequest("r-1", storage);
    expect(after.joinRequests.map((r) => r.id)).toEqual(["r-2"]);
  });

  it("records a request to join", () => {
    const storage = makeStorage();
    const after = requestToJoin(
      { name: "Sam", email: "sam@example.com" },
      storage,
      { id: "r-1", now: NOW },
    );
    expect(after.joinRequests).toEqual([
      { id: "r-1", name: "Sam", email: "sam@example.com", createdAt: NOW },
    ]);
  });

  it("approving a request turns the requester into a person and clears it", () => {
    const storage = makeStorage();
    requestToJoin({ name: "Sam", email: "sam@example.com" }, storage, { id: "r-1", now: NOW });
    const after = approveJoinRequest("r-1", storage, { id: "p-sam" });
    expect(after.joinRequests).toEqual([]);
    expect(after.people.map((p) => p.name)).toContain("Sam");
  });

  it("denying a request just removes it", () => {
    const storage = makeStorage();
    requestToJoin({ name: "Sam", email: "sam@example.com" }, storage, { id: "r-1", now: NOW });
    const after = denyJoinRequest("r-1", storage);
    expect(after.joinRequests).toEqual([]);
    expect(after.people.map((p) => p.name)).not.toContain("Sam");
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

  it("carries an optional note and vendor", () => {
    const storage = makeStorage();
    const after = addExpense(
      { categoryId: "food", amountCents: 500, note: "team lunch", vendor: "Cafe" },
      storage,
      { id: "e-1", now: NOW },
    );
    expect(after.expenses[0]).toMatchObject({ note: "team lunch", vendor: "Cafe" });
  });

  it("puts the newest item first", () => {
    const storage = makeStorage();
    addExpense({ categoryId: "food", amountCents: 100 }, storage, { id: "e-1", now: NOW });
    const after = addExpense({ categoryId: "rent", amountCents: 200 }, storage, {
      id: "e-2",
      now: NOW,
    });
    expect(after.expenses.map((e) => e.id)).toEqual(["e-2", "e-1"]);
  });

  it("leaves note and vendor off the stored item when they are blank", () => {
    const after = addExpense(
      { categoryId: "food", amountCents: 500, note: "", vendor: "" },
      makeStorage(),
      { id: "e-1", now: NOW },
    );
    expect(after.expenses[0]).not.toHaveProperty("note");
    expect(after.expenses[0]).not.toHaveProperty("vendor");
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

  it("trims the name of a new person", () => {
    const after = addPerson("  Sam  ", makeStorage(), { id: "p-sam" });
    expect(after.people[1]).toEqual({ id: "p-sam", name: "Sam" });
  });

  it("ignores a switch to someone who is not on the budget", () => {
    const storage = makeStorage();
    const before = loadBudget(storage);
    expect(setActivePerson("p-ghost", storage).activePersonId).toBe(before.activePersonId);
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

  it.each([
    { given: 0, stored: 1 },
    { given: -5, stored: 1 },
    { given: 31, stored: 28 },
    { given: 14.6, stored: 15 },
  ])("stores $given as $stored", ({ given, stored }) => {
    expect(setCycleStartDay(given, makeStorage()).cycleStartDay).toBe(stored);
  });
});

describe("joinBudget", () => {
  const shared: Budget = {
    people: [{ id: "p-owner", name: "Paul" }],
    activePersonId: "p-owner",
    cycleStartDay: 1,
    visibility: "private",
    joinRequests: [],
    expenses: [
      {
        id: "e-1",
        categoryId: "rent",
        amountCents: 9000,
        occurredAt: NOW,
        personId: "p-owner",
        tags: [],
      },
    ],
  };

  it("imports the shared budget and joins as the active person", () => {
    const storage = makeStorage();
    const after = joinBudget(encodeInvite(shared), "Sam", storage, {
      id: "p-sam",
    });
    expect(after.expenses).toHaveLength(1);
    expect(after.people.map((p) => p.name)).toEqual(["Paul", "Sam"]);
    expect(after.activePersonId).toBe("p-sam");
    expect(loadBudget(storage).activePersonId).toBe("p-sam");
  });

  it("joins without adding a duplicate when the name is already on the budget", () => {
    const after = joinBudget(encodeInvite(shared), "Paul", makeStorage(), { id: "p-new" });
    expect(after.people.map((p) => p.id)).toEqual(["p-owner"]);
    expect(after.activePersonId).toBe("p-owner");
  });

  it("imports the budget without adding anyone for a blank name", () => {
    const after = joinBudget(encodeInvite(shared), "   ", makeStorage(), { id: "p-new" });
    expect(after.people).toHaveLength(1);
    expect(after.expenses).toHaveLength(1);
  });

  it("leaves the current budget untouched for a junk token", () => {
    const storage = makeStorage();
    const before = loadBudget(storage);
    const after = joinBudget("garbage", "Sam", storage);
    expect(after).toEqual(before);
  });
});
