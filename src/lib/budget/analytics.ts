import type { Expense, Person } from "./types";

/**
 * Pure read models over a list of expenses. Nothing here reaches for the clock:
 * the caller passes `now`, so every number is reproducible in a test and the
 * same function serves both the live page and a fixed-date unit test.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const sumCents = (expenses: Expense[]): number =>
  expenses.reduce((total, e) => total + e.amountCents, 0);

/** Total cents spent within the last N days of `now`. */
export function lastNDaysTotal(
  expenses: Expense[],
  now: Date,
  n: number,
): number {
  const cutoff = now.getTime() - n * DAY_MS;
  return sumCents(
    expenses.filter((e) => new Date(e.occurredAt).getTime() >= cutoff),
  );
}

/**
 * The day the current billing cycle started: the most recent occurrence of
 * `cycleStartDay` at or before `now`, dropping back to last month when `now` is
 * earlier in the month than the start day. Computed in UTC so it matches the
 * stored ISO timestamps regardless of the runtime timezone.
 */
export function cycleStart(now: Date, cycleStartDay: number): Date {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const monthOffset = now.getUTCDate() >= cycleStartDay ? 0 : -1;
  return new Date(Date.UTC(year, month + monthOffset, cycleStartDay));
}

/** The expenses in the current billing cycle, plus the cycle's start and total. */
export function currentCycle(
  expenses: Expense[],
  now: Date,
  cycleStartDay: number,
): { start: Date; expenses: Expense[]; totalCents: number } {
  const start = cycleStart(now, cycleStartDay);
  const inCycle = expenses.filter(
    (e) => new Date(e.occurredAt).getTime() >= start.getTime(),
  );
  return { start, expenses: inCycle, totalCents: sumCents(inCycle) };
}

/** Total cents per category, largest first. */
export function categorySplits(
  expenses: Expense[],
): { categoryId: string; totalCents: number }[] {
  const totals = new Map<string, number>();
  for (const e of expenses) {
    totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + e.amountCents);
  }
  return [...totals.entries()]
    .map(([categoryId, totalCents]) => ({ categoryId, totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

/** Total cents per person, largest first, named from the people list. */
export function personSplits(
  expenses: Expense[],
  people: Person[],
): { personId: string; name: string; totalCents: number }[] {
  const nameOf = new Map(people.map((p) => [p.id, p.name]));
  const totals = new Map<string, number>();
  for (const e of expenses) {
    totals.set(e.personId, (totals.get(e.personId) ?? 0) + e.amountCents);
  }
  return [...totals.entries()]
    .map(([personId, totalCents]) => ({
      personId,
      name: nameOf.get(personId) ?? "Unknown",
      totalCents,
    }))
    .sort((a, b) => b.totalCents - a.totalCents);
}
