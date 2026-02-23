"use client";

import Link from "next/link";
import type { CalendarView } from "@/types/calendar";
import { VIEWS, VIEW_LABELS, formatHeading } from "@/lib/calendar";
import { Button, IconButton } from "@/components/ui";

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onNavigate: (direction: -1 | 1) => void;
  onViewChange: (view: CalendarView) => void;
  onToday: () => void;
}

export default function CalendarHeader({
  currentDate,
  view,
  onNavigate,
  onViewChange,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      {/* Left: navigation + heading */}
      <div className="flex items-center gap-2">
        <IconButton aria-label="Previous" onClick={() => onNavigate(-1)}>
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
            <path
              d="M5 1L1 5l4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </IconButton>

        <Button variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>

        <IconButton aria-label="Next" onClick={() => onNavigate(1)}>
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
            <path
              d="M1 1l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </IconButton>

        <h2 className="ml-1 text-lg font-semibold text-foreground tabular-nums">
          {formatHeading(currentDate, view)}
        </h2>
      </div>

      {/* Right: events link + view switcher */}
      <div className="flex items-center gap-3">
        <Link
          href="/calendar/events"
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          Events
        </Link>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center rounded-lg border border-border p-0.5 gap-0.5">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={[
                "h-7 px-3 text-xs font-medium rounded-md transition-colors",
                v === view
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
              ].join(" ")}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
