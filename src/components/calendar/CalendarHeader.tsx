"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import type { CalendarView, Calendar } from "@/types/calendar";
// Calendar type retained for the onSave cast below
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

/** Small person silhouette indicating a shared (non-owned) calendar. */
function PersonIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <circle cx="5" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M1 9c0-2.2 1.8-4 4-4s4 1.8 4 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path
        d="M7 1.5l1.5 1.5L3 8.5H1.5V7L7 1.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Door-with-arrow icon representing "leave". */
function LeaveIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path
        d="M4 2H2a1 1 0 00-1 1v4a1 1 0 001 1h2M6.5 7l2-2-2-2M8.5 5H4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
  const {
    calendars,
    createCalendar,
    updateCalendar,
    deleteCalendar,
    isCreating,
    isUpdating,
    isDeleting,
    leaveCalendar,
  } = useCalendars();
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<Calendar | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [banner, setBanner] = useState<{
    message: string;
    variant: "success" | "warning";
  } | null>(null);

  // Close the calendar dropdown when clicking outside it
  const handleDropdownOutsideClick = useCallback((e: MouseEvent) => {
    if (!(e.target as Element).closest("[data-calendar-dropdown]")) {
      setDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    document.addEventListener("mousedown", handleDropdownOutsideClick);
    return () => document.removeEventListener("mousedown", handleDropdownOutsideClick);
  }, [dropdownOpen, handleDropdownOutsideClick]);

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

  async function handleLeave(calendarId: string) {
    setLeavingId(calendarId);
    setDropdownOpen(false);
    try {
      const result = await leaveCalendar(calendarId);
      if (!result.googleAclRemoved) {
        setBanner({
          message: "You left the calendar. Your Google Calendar access may still be active — remove it from your Google Calendar settings.",
          variant: "warning",
        });
      }
    } catch {
      setBanner({ message: "Could not leave the calendar. Please try again.", variant: "warning" });
    } finally {
      setLeavingId(null);
    }
  }

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

      {/* Controls row — navigation + calendar selector + links + view switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: prev/today/next + calendar name/selector + new-calendar button */}
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

          {/* Calendar name/selector inline after nav — no extra row, no CLS */}
          <div className="hidden sm:block h-4 w-px bg-border" />
          {calendars.length === 1 ? (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted group">
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: calendars[0].color }}
              />
              {calendars[0].name}
              {calendars[0].role !== "owner" && (
                <span title={`Shared by ${calendars[0].ownerEmail ?? "another user"}`}>
                  <PersonIcon />
                </span>
              )}
              {/* edit (owner) or leave (member) button — visible on hover */}
              {calendars[0].role === "owner" ? (
                <button
                  onClick={() => setEditingCalendar(calendars[0])}
                  aria-label="Edit calendar"
                  title="Edit calendar"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-foreground"
                >
                  <PencilIcon />
                </button>
              ) : (
                <button
                  onClick={() => handleLeave(calendars[0].id)}
                  disabled={leavingId === calendars[0].id}
                  aria-label="Leave calendar"
                  title="Leave calendar"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-red-500"
                >
                  <LeaveIcon />
                </button>
              )}
            </span>
          ) : calendars.length > 1 ? (
            <div data-calendar-dropdown className="hidden sm:block relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2 py-0.5 text-xs rounded border border-border bg-background text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                {selectedCalendarId && (
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: calendars.find((c) => c.id === selectedCalendarId)?.color,
                    }}
                  />
                )}
                {selectedCalendarId
                  ? calendars.find((c) => c.id === selectedCalendarId)?.name ?? "Calendar"
                  : "All calendars"}
                <svg width="8" height="5" viewBox="0 0 8 5" fill="none" aria-hidden="true">
                  <path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-1 min-w-[180px] rounded-lg border border-border bg-background shadow-md z-50 py-1">
                  <button
                    onClick={() => { onSelectCalendar(null); setDropdownOpen(false); }}
                    className="w-full px-3 py-1.5 text-xs text-left text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    All calendars
                  </button>
                  {calendars.map((c) => (
                    <div key={c.id} className="flex items-center group/item hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                      <button
                        onClick={() => { onSelectCalendar(c.id); setDropdownOpen(false); }}
                        className="flex-1 flex items-center gap-2 px-3 py-1.5 text-xs text-left min-w-0"
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="flex-1 truncate">{c.name}</span>
                        {c.role !== "owner" && (
                          <span
                            title={`Shared by ${c.ownerEmail ?? "another user"}`}
                            className="text-muted shrink-0"
                          >
                            <PersonIcon />
                          </span>
                        )}
                      </button>
                      {/* edit (owner) or leave (member) */}
                      {c.role === "owner" ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingCalendar(c); setDropdownOpen(false); }}
                          aria-label={`Edit ${c.name}`}
                          title="Edit calendar"
                          className="px-2 py-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity text-muted hover:text-foreground shrink-0"
                        >
                          <PencilIcon />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleLeave(c.id); }}
                          disabled={leavingId === c.id}
                          aria-label={`Leave ${c.name}`}
                          title="Leave calendar"
                          className="px-2 py-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity text-muted hover:text-red-500 shrink-0"
                        >
                          <LeaveIcon />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
          <button
            onClick={() => {
              setCalendarModalOpen(true);
            }}
            aria-label="New calendar"
            title="New calendar"
            className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-muted hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
              <path
                d="M4 1v6M1 4h6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Calendar
          </button>
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
          onSave={(fields) =>
            createCalendar(fields as Pick<Calendar, "name" | "color" | "syncMode">)
          }
          onClose={() => setCalendarModalOpen(false)}
          onBanner={(message, variant) => setBanner({ message, variant })}
          isSaving={isCreating}
        />
      )}

      {editingCalendar && (
        <CalendarModal
          calendar={editingCalendar}
          onSave={(fields) => updateCalendar(editingCalendar.id, fields)}
          onDelete={
            editingCalendar.role === "owner"
              ? () => deleteCalendar(editingCalendar.id)
              : undefined
          }
          onClose={() => setEditingCalendar(null)}
          onBanner={(message, variant) => setBanner({ message, variant })}
          isSaving={isUpdating}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
