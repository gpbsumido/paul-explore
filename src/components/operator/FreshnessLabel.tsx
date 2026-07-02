"use client";

import { formatDistanceToNow } from "date-fns";
import {
  getFreshnessLevel,
  type FreshnessLevel,
} from "@/lib/operator-freshness";

interface FreshnessLabelProps {
  lastPing: string;
}

const LEVEL_CONFIG: Record<FreshnessLevel, { text: string; dot: string }> = {
  fresh: { text: "text-success-500", dot: "bg-success-500" },
  aging: { text: "text-warning-500 font-medium", dot: "bg-warning-500" },
  stale: { text: "text-error-500 font-medium", dot: "bg-error-500" },
};

/**
 * Shows "last seen X ago" from an ISO timestamp with color-coded freshness.
 * Green for under 2 minutes, amber for 2-10 minutes, red for over 10 minutes.
 * A pulsing dot appears when data is fresh (under 2 minutes old).
 */
export default function FreshnessLabel({ lastPing }: FreshnessLabelProps) {
  const date = new Date(lastPing);
  const level = getFreshnessLevel(lastPing);
  const { text, dot } = LEVEL_CONFIG[level];
  const isFresh = level === "fresh";

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${text}`}
      title={date.toLocaleString()}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${dot} ${isFresh ? "animate-pulse" : ""}`}
        aria-hidden
      />
      {formatDistanceToNow(date, { addSuffix: true })}
    </span>
  );
}
