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

/** The three granularities the historical view rolls up to. */
export type Granularity = "week" | "month" | "year";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** The start of the period `date` falls in, in UTC. Weeks start on Monday. */
export function periodStart(date: Date, g: Granularity): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  if (g === "year") return new Date(Date.UTC(y, 0, 1));
  if (g === "month") return new Date(Date.UTC(y, m, 1));
  const day = new Date(Date.UTC(y, m, date.getUTCDate()));
  const weekday = (day.getUTCDay() + 6) % 7; // Monday = 0
  day.setUTCDate(day.getUTCDate() - weekday);
  return day;
}

/** Move `start` forward (or back, if n is negative) by n whole periods. */
export function addPeriods(start: Date, g: Granularity, n: number): Date {
  const y = start.getUTCFullYear();
  const m = start.getUTCMonth();
  const d = start.getUTCDate();
  if (g === "year") return new Date(Date.UTC(y + n, 0, 1));
  if (g === "month") return new Date(Date.UTC(y, m + n, 1));
  return new Date(Date.UTC(y, m, d + n * 7));
}

/** A human label for the period beginning at `start`. */
function periodLabel(start: Date, g: Granularity): string {
  const y = start.getUTCFullYear();
  if (g === "year") return String(y);
  const month = MONTHS[start.getUTCMonth()];
  if (g === "month") return `${month} ${y}`;
  return `Wk of ${month} ${start.getUTCDate()}`;
}

/** One rolled-up period: when it starts, its label, and the cents in it. */
export type PeriodTotal = { start: string; label: string; totalCents: number };

/**
 * The last `count` periods ending with the one `now` falls in, oldest first —
 * the shape a small bar chart reads straight down. Each bucket sums the
 * expenses whose timestamp lands in its half-open window.
 */
export function historicalTotals(
  expenses: Expense[],
  now: Date,
  g: Granularity,
  count: number,
): PeriodTotal[] {
  const current = periodStart(now, g);
  return Array.from({ length: count }, (_, i) => {
    const start = addPeriods(current, g, i - (count - 1));
    const end = addPeriods(start, g, 1);
    const totalCents = sumCents(
      expenses.filter((e) => {
        const t = new Date(e.occurredAt).getTime();
        return t >= start.getTime() && t < end.getTime();
      }),
    );
    return { start: start.toISOString(), label: periodLabel(start, g), totalCents };
  });
}

/** The current period against the one before it, with a delta and percentage. */
export function periodComparison(
  expenses: Expense[],
  now: Date,
  g: Granularity,
): { currentCents: number; previousCents: number; deltaCents: number; deltaPct: number | null } {
  const [previous, current] = historicalTotals(expenses, now, g, 2);
  const deltaCents = current.totalCents - previous.totalCents;
  return {
    currentCents: current.totalCents,
    previousCents: previous.totalCents,
    deltaCents,
    deltaPct:
      previous.totalCents > 0
        ? Math.round((deltaCents / previous.totalCents) * 100)
        : null,
  };
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
