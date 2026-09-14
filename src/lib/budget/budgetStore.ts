import { budgetSchema, type Budget, type Expense } from "./types";
import { STARTER_BUDGET } from "./categories.data";
import { decodeInvite } from "./share";

/**
 * The persistence layer for the budget. Like the ticket board, there is no
 * server behind it: the whole budget lives under one key in the visitor's own
 * browser. Storage is injected rather than reached for, so the reducers are
 * testable against an in-memory stand-in and safe to call from a component that
 * guards for the browser. Each function writes and returns the fresh budget, so
 * the caller never has to reload separately.
 */

export const BUDGET_KEY = "paul-explore:budget:v1";

/** Just the bits of Storage this module needs. */
export type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** Read the stored budget, tolerating an absent or corrupt value. */
export function loadBudget(storage: StorageLike): Budget {
  try {
    const raw = storage.getItem(BUDGET_KEY);
    if (!raw) return STARTER_BUDGET;
    const parsed = budgetSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : STARTER_BUDGET;
  } catch {
    return STARTER_BUDGET;
  }
}

function write(storage: StorageLike, budget: Budget): Budget {
  try {
    storage.setItem(BUDGET_KEY, JSON.stringify(budget));
  } catch {
    // A full or blocked store just means the change doesn't persist; the budget
    // the caller got back is still correct for this session.
  }
  return budget;
}

/** Fields supplied when logging a spend. */
export type NewExpense = {
  categoryId: string;
  amountCents: number;
  occurredAt?: string;
  tags?: string[];
  note?: string;
};

/** Deterministic overrides, so a test can pin the id and clock. */
export type AddMeta = { id?: string; now?: string };

/** Log an expense against the active person and return the fresh budget. */
export function addExpense(
  input: NewExpense,
  storage: StorageLike,
  meta: AddMeta = {},
): Budget {
  const budget = loadBudget(storage);
  const now = meta.now ?? new Date().toISOString();
  const expense: Expense = {
    id: meta.id ?? `e-${Date.now()}-${budget.expenses.length}`,
    categoryId: input.categoryId,
    amountCents: input.amountCents,
    occurredAt: input.occurredAt ?? now,
    personId: budget.activePersonId,
    tags: input.tags ?? [],
    ...(input.note ? { note: input.note } : {}),
  };
  return write(storage, {
    ...budget,
    expenses: [expense, ...budget.expenses],
  });
}

/** Add someone to share the budget, without changing who is active. */
export function addPerson(
  name: string,
  storage: StorageLike,
  meta: { id?: string } = {},
): Budget {
  const budget = loadBudget(storage);
  const person = { id: meta.id ?? `p-${Date.now()}`, name: name.trim() };
  return write(storage, {
    ...budget,
    people: [...budget.people, person],
  });
}

/** Switch who new expenses are attributed to. */
export function setActivePerson(personId: string, storage: StorageLike): Budget {
  const budget = loadBudget(storage);
  if (!budget.people.some((p) => p.id === personId)) return budget;
  return write(storage, { ...budget, activePersonId: personId });
}

/** Set the day of the month the billing cycle resets on (1 to 28). */
export function setCycleStartDay(day: number, storage: StorageLike): Budget {
  const budget = loadBudget(storage);
  const clamped = Math.min(28, Math.max(1, Math.round(day)));
  return write(storage, { ...budget, cycleStartDay: clamped });
}

/**
 * Accept an invite: replace the local budget with the shared one the token
 * carries, adding the joiner as a new person and making them active so their
 * spend is attributed to them. A junk token leaves the current budget untouched.
 */
export function joinBudget(
  token: string,
  name: string,
  storage: StorageLike,
  meta: { id?: string } = {},
): Budget {
  const shared = decodeInvite(token);
  if (!shared) return loadBudget(storage);
  const trimmed = name.trim();
  if (!trimmed || shared.people.some((p) => p.name === trimmed)) {
    return write(storage, shared);
  }
  const person = { id: meta.id ?? `p-${Date.now()}`, name: trimmed };
  return write(storage, {
    ...shared,
    people: [...shared.people, person],
    activePersonId: person.id,
  });
}
