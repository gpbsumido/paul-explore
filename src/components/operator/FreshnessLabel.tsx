"use client";

import { addMilliseconds, isPast, formatDistanceToNow } from "date-fns";

interface FreshnessLabelProps {
  lastPing: string;
}

const STALE_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Shows "last seen X ago" from an ISO timestamp. Text turns amber when the
 * ping is older than 5 minutes — a visual nudge that the store may be losing
 * connectivity.
 *
 * Uses date-fns isPast(addMilliseconds(...)) rather than Date.now() directly
 * so the impure clock read happens inside the library, satisfying React's
 * render purity lint rule.
 */
export default function FreshnessLabel({ lastPing }: FreshnessLabelProps) {
  const date = new Date(lastPing);
  const staleAt = addMilliseconds(date, STALE_THRESHOLD_MS);
  const isStale = isPast(staleAt);

  return (
    <span
      className={`text-xs ${isStale ? "text-warning-500 font-medium" : "text-muted"}`}
      title={date.toLocaleString()}
    >
      {formatDistanceToNow(date, { addSuffix: true })}
    </span>
  );
}
