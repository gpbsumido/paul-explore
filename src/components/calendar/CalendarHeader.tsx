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
    <div className="mb-6 space-y-2">
      {/* Big heading row — this is the visual anchor of the whole view */}
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight leading-none">
        {formatHeading(currentDate, view)}
      </h2>

      {/* Controls row — navigation + links + view switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: prev/today/next */}
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
        </div>

        {/* Right: links + view switcher */}
        <div className="flex items-center gap-3">
          {/* Events and About — hidden on small screens to keep the header tidy */}
          <Link
            href="/calendar/events"
            className="hidden sm:inline text-xs text-muted hover:text-foreground transition-colors"
          >
            Events
          </Link>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <Link
            href="/thoughts/calendar"
            className="hidden sm:inline text-xs text-muted hover:text-foreground transition-colors"
          >
            About
          </Link>
          <div className="hidden sm:block h-4 w-px bg-border" />

          {/* View switcher — Year hidden on mobile (too small to be useful) */}
          <div className="flex items-center rounded-lg border border-border p-0.5 gap-0.5">
            {VIEWS.map((v) => (
              <button
                key={v}
                onClick={() => onViewChange(v)}
                className={[
                  "h-7 px-2.5 sm:px-3 text-xs font-medium rounded-md transition-colors",
                  v === "year" ? "hidden sm:block" : "",
                  v === view
                    ? "bg-foreground text-background"
                    : "text-muted hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
