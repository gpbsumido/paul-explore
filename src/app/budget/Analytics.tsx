"use client";

import { categoryById } from "@/lib/budget/categories.data";
import { formatCents } from "@/lib/budget/format";
import {
  lastNDaysTotal,
  currentCycle,
  categorySplits,
  personSplits,
} from "@/lib/budget/analytics";
import type { Budget } from "@/lib/budget/types";

const card = "rounded-2xl border border-border bg-surface p-4";
const heading = "text-xs font-semibold uppercase tracking-wide text-muted";

/**
 * The read-only side of the budget: how much in the last 30 days, the current
 * billing cycle as a list, and where it went by category and by person. Takes
 * `now` so a test can pin the clock; defaults to the real clock on the page.
 */
export default function Analytics({
  budget,
  now = new Date(),
  onEditExpense,
}: {
  budget: Budget;
  now?: Date;
  onEditExpense?: (id: string) => void;
}) {
  const { expenses, people, cycleStartDay } = budget;
  const total30 = lastNDaysTotal(expenses, now, 30);
  const cycle = currentCycle(expenses, now, cycleStartDay);
  const byCategory = categorySplits(expenses);
  const byPerson = personSplits(expenses, people);
  const nameOf = new Map(people.map((p) => [p.id, p.name]));

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className={card}>
        <p className={heading}>Last 30 days</p>
        <p data-testid="total-30" className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
          {formatCents(total30)}
        </p>
      </div>

      <div className={card}>
        <p className={heading}>This cycle</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
          {formatCents(cycle.totalCents)}
        </p>
        <p className="mt-1 text-xs text-muted">
          since {cycle.start.toLocaleDateString()}
        </p>
      </div>

      <div className={`${card} sm:col-span-2`}>
        <p className={heading}>This cycle</p>
        {cycle.expenses.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing logged yet this cycle.</p>
        ) : (
          <ul aria-label="This cycle" className="mt-2 divide-y divide-border">
            {cycle.expenses.map((e) => {
              const category = categoryById(e.categoryId);
              return (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-2 text-sm text-foreground">
                      <span aria-hidden>{category.emoji}</span>
                      {e.vendor ? e.vendor : category.label}
                      {e.tags.length > 0 && (
                        <span className="text-xs text-muted">{e.tags.join(", ")}</span>
                      )}
                    </span>
                    <span className="truncate text-xs text-muted">
                      {[e.note, e.vendor ? category.label : null, nameOf.get(e.personId)]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums text-sm font-medium text-foreground">
                      {formatCents(e.amountCents)}
                    </span>
                    {onEditExpense && (
                      <button
                        type="button"
                        onClick={() => onEditExpense(e.id)}
                        aria-label={`Edit ${category.label} ${formatCents(e.amountCents)}`}
                        className="rounded px-1.5 py-0.5 text-xs text-muted transition hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-[var(--color-feature-budget)]"
                      >
                        Edit
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={card}>
        <p className={heading}>By category</p>
        {byCategory.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No spend yet.</p>
        ) : (
          <ul aria-label="By category" className="mt-2 space-y-1">
            {byCategory.map((row) => (
              <li key={row.categoryId} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{categoryById(row.categoryId).label}</span>
                <span className="tabular-nums font-medium text-foreground">
                  {formatCents(row.totalCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={card}>
        <p className={heading}>By person</p>
        {byPerson.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No spend yet.</p>
        ) : (
          <ul aria-label="By person" className="mt-2 space-y-1">
            {byPerson.map((row) => (
              <li key={row.personId} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{row.name}</span>
                <span className="tabular-nums font-medium text-foreground">
                  {formatCents(row.totalCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
