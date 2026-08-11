"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRestockHistory } from "@/hooks/useRestockHistory";
import type { RestockSession, RestockLine } from "@/types/operator";

interface RestockHistoryTabProps {
  storeId: string;
}

/**
 * Orders sessions the way someone scanning the tab wants them: anything still
 * open first, because that is the one with an action attached, then finished
 * ones newest first.
 */
export function completedFirstNewestFirst(
  sessions: readonly RestockSession[],
): RestockSession[] {
  return [...sessions].sort((a, b) => {
    if (!a.completedAt && b.completedAt) return -1;
    if (a.completedAt && !b.completedAt) return 1;
    return (
      new Date(b.completedAt ?? b.startedAt).getTime() -
      new Date(a.completedAt ?? a.startedAt).getTime()
    );
  });
}

export type SessionOutcome = {
  counted: number;
  added: number;
  removed: number;
  reasons: string[];
};

/**
 * Rolls a session's lines up into the numbers worth showing on its row.
 *
 * The removal reasons are the point. Shrink & Loss reports unexplained
 * variance in aggregate, and this is where the "why" for each removal actually
 * lives, so the row carries them rather than making someone open the session.
 */
export function sessionOutcome(lines: readonly RestockLine[]): SessionOutcome {
  const reasons = lines
    .filter((l) => l.removed > 0 && l.removalReason)
    .map((l) => l.removalReason as string);

  return {
    counted: lines.filter((l) => l.countedQty !== null).length,
    added: lines.reduce((sum, l) => sum + l.added, 0),
    removed: lines.reduce((sum, l) => sum + l.removed, 0),
    reasons: [...new Set(reasons)],
  };
}

/** Renders a date the way the rest of the operator surfaces do. */
function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * A store's restock history.
 *
 * The endpoint behind this always returned the full history; until now only an
 * in-progress session was ever read from it, so a completed count — the
 * removals and reasons that the shrink report is built on — could not be
 * reviewed after the fact.
 */
export default function RestockHistoryTab({ storeId }: RestockHistoryTabProps) {
  const { sessions, loading, error } = useRestockHistory(storeId);
  const [expanded, setExpanded] = useState<string | null>(null);

  const ordered = useMemo(
    () => completedFirstNewestFirst(sessions),
    [sessions],
  );

  if (error) {
    return <p className="py-4 text-sm text-error-500">{error}</p>;
  }

  if (loading && sessions.length === 0) {
    return (
      <div className="space-y-2" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg border border-border bg-surface"
          />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted">
          No restock counts recorded for this store yet.
        </p>
        <p className="mt-1 text-sm text-muted">
          Counts show up here once a restocker confirms physical stock — that is
          also what gives Shrink &amp; Loss something to explain.
        </p>
        <Link
          href={`/operator/stores/${storeId}?tab=inventory`}
          className="mt-4 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Start a restock
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {ordered.map((session, i) => {
        const isOpen = expanded === session.id;
        return (
          <div
            key={session.id}
            className={i % 2 === 0 ? "bg-surface" : undefined}
          >
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : session.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-hover"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  {formatDay(session.completedAt ?? session.startedAt)}
                  {!session.completedAt && (
                    <span className="ml-2 rounded bg-warning-500/15 px-1.5 py-0.5 text-xs font-medium text-warning-600">
                      In progress
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-muted">
                  {session.actor ? `Counted by ${session.actor}` : "Unattributed"}
                  {session.notes ? ` · ${session.notes}` : ""}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted">
                {isOpen ? "Hide" : "Details"}
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-border px-4 py-3">
                {session.completedAt ? (
                  <p className="text-sm text-muted">
                    Completed {formatDay(session.completedAt)}. Start a new
                    count from Inventory when this store needs one.
                  </p>
                ) : (
                  <p className="text-sm text-muted">
                    This count was never finished. Resuming it from Inventory
                    picks up where it stopped.
                  </p>
                )}
                <Link
                  href={`/operator/stores/${storeId}?tab=inventory`}
                  className="mt-3 inline-block text-sm font-medium text-primary-600 hover:underline"
                >
                  {session.completedAt ? "Start a new count" : "Resume count"} →
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
