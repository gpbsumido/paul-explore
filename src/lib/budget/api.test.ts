import { describe, it, expect, vi, afterEach } from "vitest";
import {
  addPerson,
  approveRequest,
  createExpense,
  deleteExpense,
  denyRequest,
  getBudget,
  listBudgets,
  requestToJoin,
  toBudget,
  updateBudget,
  updateExpense,
  type BudgetDto,
} from "./api";

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

  it("maps the owner email, leaving it undefined when the server has none", () => {
    expect(toBudget(dto, "p1").ownerEmail).toBe("me@example.com");
    expect(toBudget({ ...dto, ownerEmail: null }, "p1").ownerEmail).toBeUndefined();
  });

  it("gives every expense a tags array even when the server sent none", () => {
    // The DTO type says tags is always there; an older server response may not have it.
    const noTags = { ...dto.expenses[0], tags: undefined as unknown as string[] };
    const budget = toBudget({ ...dto, expenses: [noTags] }, "p1");
    expect(budget.expenses[0].tags).toEqual([]);
  });

  it("keeps the cycle start day and an expense's splits", () => {
    const splits = [
      { personId: "p1", amountCents: 700 },
      { personId: "p2", amountCents: 500 },
    ];
    const budget = toBudget(
      { ...dto, cycleStartDay: 15, expenses: [{ ...dto.expenses[0], splits }] },
      "p1",
    );
    expect(budget.cycleStartDay).toBe(15);
    expect(budget.expenses[0].splits).toEqual(splits);
  });

  it("maps a join request to its name and date, with no email", () => {
    expect(toBudget(dto, "p1").joinRequests).toEqual([
      { id: "r1", name: "Alex", email: "", createdAt: "2026-09-15T00:00:00.000Z" },
    ]);
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
    expect(JSON.parse(init?.body as string)).toEqual({
      categoryId: "food",
      amountCents: 500,
      occurredAt: "2026-09-15T00:00:00.000Z",
    });
  });
});

describe("the budget wrappers", () => {
  const cases = [
    {
      name: "listBudgets",
      run: () => listBudgets(),
      response: { budgets: [{ id: "b1", name: "My budget", role: "owner" }] },
      url: "/api/budget",
      method: undefined,
      body: undefined,
      result: [{ id: "b1", name: "My budget", role: "owner" }],
    },
    {
      name: "updateExpense",
      run: () => updateExpense("b1", "e1", { amountCents: 900 }),
      response: { budget: dto },
      url: "/api/budget/b1/expenses/e1",
      method: "PATCH",
      body: { amountCents: 900 },
      result: dto,
    },
    {
      name: "deleteExpense",
      run: () => deleteExpense("b1", "e1"),
      response: { budget: dto },
      url: "/api/budget/b1/expenses/e1",
      method: "DELETE",
      body: undefined,
      result: dto,
    },
    {
      name: "addPerson",
      run: () => addPerson("b1", "Sam"),
      response: { budget: dto },
      url: "/api/budget/b1/people",
      method: "POST",
      body: { name: "Sam" },
      result: dto,
    },
    {
      name: "updateBudget",
      run: () => updateBudget("b1", { cycleStartDay: 15, visibility: "public" }),
      response: { budget: dto },
      url: "/api/budget/b1",
      method: "PATCH",
      body: { cycleStartDay: 15, visibility: "public" },
      result: dto,
    },
    {
      name: "requestToJoin",
      run: () => requestToJoin("owner@example.com", "Sam"),
      response: { request: { id: "r9", status: "pending" } },
      url: "/api/budget/join-requests",
      method: "POST",
      body: { ownerEmail: "owner@example.com", name: "Sam" },
      result: { id: "r9", status: "pending" },
    },
    {
      name: "approveRequest",
      run: () => approveRequest("b1", "r1"),
      response: { budget: dto },
      url: "/api/budget/b1/join-requests/r1/approve",
      method: "POST",
      body: undefined,
      result: dto,
    },
    {
      name: "denyRequest",
      run: () => denyRequest("b1", "r1"),
      response: { budget: dto },
      url: "/api/budget/b1/join-requests/r1/deny",
      method: "POST",
      body: undefined,
      result: dto,
    },
  ];

  it.each(cases)(
    "$name calls the right route and unwraps the response",
    async ({ run, response, url, method, body, result }) => {
      const fetchMock = mockFetch(response);

      const returned = await run();

      const [calledUrl, init] = fetchMock.mock.calls[0];
      expect(calledUrl).toBe(url);
      expect(init?.method).toBe(method);
      expect(init?.body === undefined ? undefined : JSON.parse(init.body as string)).toEqual(body);
      expect(returned).toEqual(result);
    },
  );

  it("sends every call as JSON", async () => {
    const fetchMock = mockFetch({ budget: dto });
    await addPerson("b1", "Sam");
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      "Content-Type": "application/json",
    });
  });
});

describe("error handling", () => {
  it("falls back to the status code when the error body has no message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not json");
      },
    } as unknown as Response);
    await expect(getBudget("b1")).rejects.toThrow("Request failed (500)");
  });

  it("throws the server error message on a failed request", async () => {
    mockFetch({ error: "Owner only" }, false, 403);
    await expect(requestToJoin("owner@example.com", "Sam")).rejects.toThrow("Owner only");
  });
});
