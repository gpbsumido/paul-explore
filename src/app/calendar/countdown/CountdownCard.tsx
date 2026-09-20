"use client";

import { memo } from "react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import type { Countdown } from "@/types/calendar";

interface CountdownCardProps {
  countdown: Countdown;
  onClick: () => void;
}

/**
 * Returns the badge text for a countdown based on how far away the target
 * date is. Positive = future, zero = today, negative = past.
 */
function getDaysLabel(targetDate: string): {
  text: string;
  highlight: boolean;
} {
  const days = differenceInCalendarDays(
    new Date(`${targetDate}T00:00:00`),
    new Date(),
  );
  if (days === 0) return { text: "Today!", highlight: true };
  if (days > 0)
    return {
      text: `${days} day${days === 1 ? "" : "s"} away`,
      highlight: false,
    };
  const abs = Math.abs(days);
  return { text: `${abs} day${abs === 1 ? "" : "s"} ago`, highlight: false };
}

/**
 * Card for a single countdown. Click it to open the edit modal.
 *
 * The color accent is a small dot next to the title using the countdown's
 * color. The card itself uses the standard surface card style from the rest
 * of the calendar feature.
 *
 * Memoized because the list re-renders on every mutation and there can be
 * enough countdowns that skipping unchanged cards is worth it.
 */
function CountdownCard({ countdown, onClick }: CountdownCardProps) {
  const { text: daysText, highlight } = getDaysLabel(countdown.targetDate);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-surface p-4 hover:border-foreground/20 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: countdown.color }}
            />
            <span className="truncate">{countdown.title}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {format(parseISO(countdown.targetDate), "MMM d, yyyy")}
          </p>
          {countdown.description && (
            <p className="mt-1.5 text-xs text-muted line-clamp-2">
              {countdown.description}
            </p>
          )}
        </div>
        <span
          className={[
            "shrink-0 text-xs font-medium px-2 py-0.5 rounded-full",
            highlight ? "bg-foreground text-background" : "text-muted",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {daysText}
        </span>
      </div>
    </button>
  );
}

export default memo(CountdownCard);
