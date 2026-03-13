"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import type { CalendarView, Calendar } from "@/types/calendar";
import { VIEWS, VIEW_LABELS, formatHeading } from "@/lib/calendar";
import { Button, IconButton } from "@/components/ui";
import { useGoogleCalendarStatus } from "@/hooks/useGoogleCalendarStatus";
import { useCalendars } from "@/hooks/useCalendars";
import CalendarModal from "@/components/calendar/CalendarModal";

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onNavigate: (direction: -1 | 1) => void;
  onViewChange: (view: CalendarView) => void;
  onToday: () => void;
  onNewCountdown?: () => void;
  selectedCalendarId: string | null;
  onSelectCalendar: (id: string | null) => void;
}

export default function CalendarHeader({
  currentDate,
  view,
  onNavigate,
  onViewChange,
  onToday,
  onNewCountdown,
  selectedCalendarId,
  onSelectCalendar,
}: CalendarHeaderProps) {
  const { connected } = useGoogleCalendarStatus();
  const queryClient = useQueryClient();
  const { calendars, createCalendar, updateCalendar, deleteCalendar } =
    useCalendars();
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<Calendar | undefined>(
    undefined,
  );
  const [banner, setBanner] = useState<{
    message: string;
    variant: "success" | "warning";
  } | null>(null);

  // Auto-dismiss the banner after 5 seconds. The timeout is reset whenever
  // a new banner arrives so rapid create/edit actions don't get cut short.
  useEffect(() => {
    if (!banner) return;
    const id = setTimeout(() => setBanner(null), 5000);
    return () => clearTimeout(id);
  }, [banner]);

  function handleSync() {
    // invalidates all calendar event queries regardless of range so every
    // view gets fresh data after a manual sync trigger
    queryClient.invalidateQueries({ queryKey: ["calendar", "events"] });
  }

  const selectedCalendar = calendars.find((c) => c.id === selectedCalendarId);

  return (
    <div className="mb-6 space-y-2">
      {/* Big heading row — this is the visual anchor of the whole view */}
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight leading-none">
        {formatHeading(currentDate, view)}
      </h2>

      {/* Connect-google result banner — auto-dismissed after 5 s */}
      {banner && (
        <div
          className={[
            "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs",
            banner.variant === "success"
              ? "bg-green-500/10 text-green-700 dark:text-green-400"
              : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
          ].join(" ")}
        >
          <span>{banner.message}</span>
          <button
            onClick={() => setBanner(null)}
            aria-label="Dismiss"
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M1 1l8 8M9 1L1 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Calendar selector row — only shown once calendars have loaded */}
      {calendars.length > 0 && (
        <div className="flex items-center gap-2">
          {calendars.length === 1 ? (
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: calendars[0].color }}
              />
              {calendars[0].name}
            </span>
          ) : (
            <div className="relative">
              <select
                value={selectedCalendarId ?? ""}
                onChange={(e) => onSelectCalendar(e.target.value || null)}
                className="appearance-none pl-5 pr-6 py-0.5 text-xs rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 cursor-pointer"
              >
                <option value="">All calendars</option>
                {calendars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {selectedCalendar && (
                <span
                  className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: selectedCalendar.color }}
                />
              )}
            </div>
          )}
          {/* "+" button to open CalendarModal in create mode */}
          <button
            onClick={() => {
              setEditingCalendar(undefined);
              setCalendarModalOpen(true);
            }}
            aria-label="New calendar"
            className="flex items-center justify-center w-4 h-4 rounded-full text-muted hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path
                d="M4 1v6M1 4h6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      )}

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
          {/* Events, Countdowns, and About — hidden on small screens to keep the header tidy */}
          <Link
            href="/calendar/events"
            className="hidden sm:inline text-xs text-muted hover:text-foreground transition-colors"
          >
            Events
          </Link>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <span className="hidden sm:inline-flex items-center gap-1">
            <Link
              href="/calendar/countdown"
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              Countdowns
            </Link>
            {onNewCountdown && (
              <button
                onClick={onNewCountdown}
                aria-label="New countdown"
                className="flex items-center justify-center w-4 h-4 rounded-full text-muted hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path
                    d="M4 1v6M1 4h6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </span>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <Link
            href="/thoughts/calendar"
            className="hidden sm:inline text-xs text-muted hover:text-foreground transition-colors"
          >
            About
          </Link>
          <div className="hidden sm:block h-4 w-px bg-border" />

          {/* Google Calendar sync indicator, only visible when connected */}
          {connected && (
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"
                title="Synced with Google Calendar"
              />
              <button
                onClick={handleSync}
                aria-label="Refresh calendar from Google"
                title="Refresh from Google Calendar"
                className="flex items-center justify-center text-muted hover:text-foreground transition-colors"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M10.5 6a4.5 4.5 0 1 1-1.1-2.95M10.5 1.5v3h-3"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </span>
          )}
          {connected && <div className="hidden sm:block h-4 w-px bg-border" />}

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

      {calendarModalOpen && (
        <CalendarModal
          calendar={editingCalendar}
          onSave={async (fields) => {
            if (editingCalendar) {
              return updateCalendar(editingCalendar.id, fields);
            }
            return createCalendar(
              fields as Pick<Calendar, "name" | "color" | "syncMode">,
            );
          }}
          onDelete={
            editingCalendar
              ? async () => {
                  await deleteCalendar(editingCalendar.id);
                  if (selectedCalendarId === editingCalendar.id) {
                    onSelectCalendar(null);
                  }
                }
              : undefined
          }
          onClose={() => setCalendarModalOpen(false)}
          onBanner={(message, variant) => setBanner({ message, variant })}
        />
      )}
    </div>
  );
}
