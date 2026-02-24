"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  format,
  getDay,
  parseISO,
  differenceInCalendarDays,
} from "date-fns";
import { DAY_LABELS, eventsForDay } from "@/lib/calendar";
import type { CalendarEvent } from "@/types/calendar";
import EventChip from "@/components/calendar/EventChip";

/** Max chips shown per cell before the "+N more" overflow line. */
const VISIBLE_CHIPS = 3;

interface CalendarGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onChipClick: (event: CalendarEvent) => void;
}

/** True for Saturday (6) and Sunday (0). */
function isWeekend(day: Date) {
  const d = getDay(day);
  return d === 0 || d === 6;
}

/**
 * Events that span multiple calendar days (allDay or timed crossing midnight).
 * These render as continuous bars in the month grid, same as Google Calendar.
 */
function isSpanning(ev: CalendarEvent): boolean {
  return (
    ev.allDay ||
    differenceInCalendarDays(parseISO(ev.endDate), parseISO(ev.startDate)) >= 1
  );
}

export default function CalendarGrid({
  currentDate,
  events,
  onDayClick,
  onChipClick,
}: CalendarGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div>
      {/* Day-of-week labels — no background, open feel */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-2.5 text-center text-[10px] font-semibold uppercase tracking-widest text-muted/50"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const weekend = isWeekend(day);
          const isLastCol = (i + 1) % 7 === 0;

          // Only compute events for in-month days — adjacent days are intentionally
          // greyed out and don't need chips cluttering the layout.
          const dayEvents = inMonth ? eventsForDay(events, day) : [];
          const spanningEvs = dayEvents.filter(isSpanning);
          const timedEvs = dayEvents.filter((ev) => !isSpanning(ev));
          // spanning bars always float above single-day chips (same as GCal)
          const allDisplay = [...spanningEvs, ...timedEvs];

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={[
                "min-h-[88px] sm:min-h-[100px] p-1.5 sm:p-2 text-left border-b border-r border-border cursor-pointer transition-colors",
                isLastCol ? "border-r-0" : "",
                // red flag-tape stripe pinned to the top of today's cell
                today ? "border-t-2 border-t-red-500" : "",
                // background: today > weekend > plain hover
                today
                  ? "bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50/60 dark:hover:bg-red-950/30"
                  : weekend
                    ? "bg-neutral-50/60 dark:bg-neutral-900/30 hover:bg-neutral-100/60 dark:hover:bg-neutral-900/50"
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-900/50",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {/* Day number — larger today circle with a glow halo */}
              <span
                className={[
                  "inline-flex items-center justify-center h-7 w-7 text-sm rounded-full transition-colors",
                  today
                    ? "bg-red-500 text-white font-semibold shadow-[0_0_0_4px_rgba(239,68,68,0.12)]"
                    : inMonth
                      ? "text-foreground"
                      : "text-muted opacity-25",
                ].join(" ")}
              >
                {format(day, "d")}
              </span>

              {/* Event chips — spanning bars first, single-day chips below */}
              {inMonth && allDisplay.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {allDisplay.slice(0, VISIBLE_CHIPS).map((ev) => (
                    <EventChip
                      key={ev.id}
                      event={ev}
                      onClick={() => onChipClick(ev)}
                      // continuation bars for days after the event started
                      continuation={
                        isSpanning(ev) && !isSameDay(parseISO(ev.startDate), day)
                      }
                    />
                  ))}
                  {allDisplay.length > VISIBLE_CHIPS && (
                    <div className="text-[10px] text-muted px-1 leading-tight">
                      +{allDisplay.length - VISIBLE_CHIPS} more
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
