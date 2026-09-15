import { describe, it, expect, vi, afterEach } from "vitest";
import { toBudget, getBudget, createExpense, requestToJoin, type BudgetDto } from "./api";

const dto: BudgetDto = {
  id: "b1",
  name: "My budget",
  cycleStartDay: 1,
  visibility: "public",
  ownerEmail: "me@example.com",
  role: "owner",
  people: [
    { id: "p1", name: "You", userSub: "auth0|me" },
    { id: "p2", name: "Sam", userSub: null },
  ],
  members: [{ id: "m1", userSub: "auth0|me", email: "me@example.com", role: "editor" }],
  expenses: [
    {
      id: "e1",
      categoryId: "food",
      amountCents: 1200,
      occurredAt: "2026-09-15T00:00:00.000Z",
      personId: "p1",
      tags: ["necessary"],
      note: "lunch",
      vendor: "Cafe",
    },
  ],
  joinRequests: [{ id: "r1", name: "Alex", status: "pending", createdAt: "2026-09-15T00:00:00.000Z" }],
};

const mockFetch = (body: unknown, ok = true, status = 200) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok,
    status,
    json: async () => body,
  } as Response);

afterEach(() => vi.restoreAllMocks());

describe("toBudget", () => {
  it("adapts a server DTO to the Budget the components render", () => {
    const budget = toBudget(dto, "p2");
    expect(budget.activePersonId).toBe("p2");
    expect(budget.people).toEqual([
      { id: "p1", name: "You" },
      { id: "p2", name: "Sam" },
    ]);
    expect(budget.expenses[0]).toMatchObject({ vendor: "Cafe", note: "lunch", tags: ["necessary"] });
    expect(budget.visibility).toBe("public");
    expect(budget.joinRequests[0].name).toBe("Alex");
  });
});

describe("getBudget", () => {
  it("unwraps the budget envelope", async () => {
    const fetchMock = mockFetch({ budget: dto });
    const result = await getBudget("b1");
    expect(result.id).toBe("b1");
    expect(fetchMock).toHaveBeenCalledWith("/api/budget/b1", expect.any(Object));
  });
});

describe("createExpense", () => {
  it("POSTs the expense and returns the fresh budget", async () => {
    const fetchMock = mockFetch({ budget: dto });
    await createExpense("b1", {
      categoryId: "food",
      amountCents: 500,
      occurredAt: "2026-09-15T00:00:00.000Z",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/budget/b1/expenses");
    expect(init?.method).toBe("POST");
  });
});

describe("error handling", () => {
  it("throws the server error message on a failed request", async () => {
    mockFetch({ error: "Owner only" }, false, 403);
    await expect(requestToJoin("owner@example.com", "Sam")).rejects.toThrow("Owner only");
  });
});
