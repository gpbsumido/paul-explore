import type { Budget, Expense, Split } from "./types";

/**
 * Client wrappers over the budget BFF (`/api/budget/*`), which proxies to
 * portfolio_api's `/api/budgets`. The server is the source of truth for a
 * signed-in user; these functions return the whole budget after every write so
 * the caller just replaces its copy rather than reconciling.
 *
 * The server DTO carries an id, a role, and members that the browser-only
 * Budget shape doesn't. `toBudget` adapts a DTO to the shape the presentational
 * components already render; the active person is a local UI concern the server
 * has no opinion on, so it is supplied by the caller.
 */

export type BudgetMember = { id: string; userSub: string; email: string | null; role: string };

export type BudgetDto = {
  id: string;
  name: string;
  cycleStartDay: number;
  visibility: "private" | "public";
  ownerEmail: string | null;
  role: "owner" | "member";
  people: { id: string; name: string; userSub: string | null }[];
  members: BudgetMember[];
  expenses: (Expense & { vendor?: string })[];
  joinRequests: { id: string; name: string; status: string; createdAt: string }[];
};

export type BudgetSummary = { id: string; name: string; role: "owner" | "member" };

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/budget${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

/** Adapt a server DTO to the Budget shape the components render. */
export function toBudget(dto: BudgetDto, activePersonId: string): Budget {
  return {
    people: dto.people.map((p) => ({ id: p.id, name: p.name })),
    activePersonId,
    cycleStartDay: dto.cycleStartDay,
    visibility: dto.visibility,
    ownerEmail: dto.ownerEmail ?? undefined,
    expenses: dto.expenses.map((e) => ({
      id: e.id,
      categoryId: e.categoryId,
      amountCents: e.amountCents,
      occurredAt: e.occurredAt,
      personId: e.personId,
      tags: e.tags ?? [],
      note: e.note,
      vendor: e.vendor,
      splits: e.splits,
    })),
    joinRequests: dto.joinRequests.map((r) => ({
      id: r.id,
      name: r.name,
      email: "",
      createdAt: r.createdAt,
    })),
  };
}

export const listBudgets = () =>
  call<{ budgets: BudgetSummary[] }>("").then((r) => r.budgets);

export const getBudget = (id: string) =>
  call<{ budget: BudgetDto }>(`/${id}`).then((r) => r.budget);

export type NewServerExpense = {
  categoryId: string;
  amountCents: number;
  occurredAt: string;
  personId?: string | null;
  tags?: string[];
  note?: string | null;
  vendor?: string | null;
  splits?: Split[] | null;
};

export const createExpense = (id: string, input: NewServerExpense) =>
  call<{ budget: BudgetDto }>(`/${id}/expenses`, {
    method: "POST",
    body: JSON.stringify(input),
  }).then((r) => r.budget);

export const updateExpense = (id: string, expenseId: string, patch: Partial<NewServerExpense>) =>
  call<{ budget: BudgetDto }>(`/${id}/expenses/${expenseId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }).then((r) => r.budget);

export const deleteExpense = (id: string, expenseId: string) =>
  call<{ budget: BudgetDto }>(`/${id}/expenses/${expenseId}`, { method: "DELETE" }).then(
    (r) => r.budget,
  );

export const addPerson = (id: string, name: string) =>
  call<{ budget: BudgetDto }>(`/${id}/people`, {
    method: "POST",
    body: JSON.stringify({ name }),
  }).then((r) => r.budget);

export const updateBudget = (
  id: string,
  patch: { name?: string; cycleStartDay?: number; visibility?: "private" | "public" },
) =>
  call<{ budget: BudgetDto }>(`/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }).then((r) => r.budget);

export const requestToJoin = (ownerEmail: string, name: string) =>
  call<{ request: { id: string; status: string } }>(`/join-requests`, {
    method: "POST",
    body: JSON.stringify({ ownerEmail, name }),
  }).then((r) => r.request);

export const approveRequest = (id: string, requestId: string) =>
  call<{ budget: BudgetDto }>(`/${id}/join-requests/${requestId}/approve`, {
    method: "POST",
  }).then((r) => r.budget);

export const denyRequest = (id: string, requestId: string) =>
  call<{ budget: BudgetDto }>(`/${id}/join-requests/${requestId}/deny`, {
    method: "POST",
  }).then((r) => r.budget);
