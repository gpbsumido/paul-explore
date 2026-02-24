"use client";

import { format, isToday, getHours, getMinutes } from "date-fns";
import {
  HOURS,
  slotDate,
  formatHour,
  spanningEventsForDay,
  singleDayTimedEventsForDay,
  layoutDayEvents,
} from "@/lib/calendar";
import type { CalendarEvent } from "@/types/calendar";
import EventChip from "@/components/calendar/EventChip";

/** Fixed px height per hour row — drives all the time-position math. */
const ROW_HEIGHT = 44;

/**
 * Width of the time-label gutter. Matches the left offset used for the
 * current-time indicator so the dot lands exactly at the content edge.
 */
const GUTTER_WIDTH = "4.5rem";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSlotClick: (date: Date) => void;
  onChipClick: (event: CalendarEvent) => void;
}

export default function DayView({
  currentDate,
  events,
  onSlotClick,
  onChipClick,
}: DayViewProps) {
  const today = isToday(currentDate);

  // allDay events + multi-day timed events covering this day go in the banner row
  const allDaySectionEvents = spanningEventsForDay(events, currentDate);
  // single-day timed events get positioned absolutely in the scroll grid
  const dayTimedEvents = singleDayTimedEventsForDay(events, currentDate);

  const now = new Date();
  const currentTimeTop = today
    ? (getHours(now) + getMinutes(now) / 60) * ROW_HEIGHT
    : null;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Newspaper-dateline heading — day name small + date big + year muted */}
      <div
        className={[
          "px-4 pt-5 pb-4 border-b border-border",
          today ? "bg-red-50/30 dark:bg-red-950/10" : "",
        ].join(" ")}
      >
        <div
          className={[
            "text-[10px] font-bold uppercase tracking-[0.18em] mb-1",
            today ? "text-red-500" : "text-muted/60",
          ].join(" ")}
        >
          {format(currentDate, "EEEE")}
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className={[
              "text-2xl sm:text-3xl font-bold tabular-nums leading-none",
              today ? "text-red-500" : "text-foreground",
            ].join(" ")}
          >
            {format(currentDate, "MMMM d")}
          </span>
          <span className="text-base font-normal text-muted/50 leading-none">
            {format(currentDate, "yyyy")}
          </span>
        </div>
      </div>

      {/* All-day banner — allDay events + multi-day timed events */}
      {allDaySectionEvents.length > 0 && (
        <div className="flex items-start border-b border-border">
          <div
            className="shrink-0 px-2 py-1.5 text-right"
            style={{ width: GUTTER_WIDTH }}
          >
            <span className="text-[9px] font-semibold uppercase tracking-wide text-muted/50">
              All day
            </span>
          </div>
          <div className="flex-1 p-1.5 space-y-0.5">
            {allDaySectionEvents.map((ev) => (
              <EventChip key={ev.id} event={ev} onClick={() => onChipClick(ev)} />
            ))}
          </div>
        </div>
      )}

      {/*
       * Time grid — flex layout so we can absolutely position event blocks
       * that span their full duration rather than being crammed into one slot.
       */}
      <div className="relative flex">
        {/* Time labels */}
        <div className="shrink-0 border-r border-border" style={{ width: GUTTER_WIDTH }}>
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="flex items-start justify-end pr-2 pt-1.5 border-b border-border last:border-b-0"
              style={{ height: ROW_HEIGHT }}
            >
              <span className="text-[10px] text-muted/30">{formatHour(hour)}</span>
            </div>
          ))}
        </div>

        {/* Day column — background slots + absolute event blocks on top */}
        <div className="flex-1 relative">
          {/* Clickable hour slots in the background */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              onClick={() => onSlotClick(slotDate(currentDate, hour))}
              style={{ height: ROW_HEIGHT }}
              className={[
                "border-b border-border last:border-b-0 cursor-pointer transition-colors",
                today
                  ? "hover:bg-red-500/5"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-900/60",
              ].join(" ")}
            />
          ))}

          {/* Event blocks — side by side when they overlap, same as Google Calendar */}
          {layoutDayEvents(dayTimedEvents, ROW_HEIGHT).map(
            ({ ev, topPx, heightPx, column, totalColumns }) => (
              <div
                key={ev.id}
                className="absolute z-10 min-w-[40px]"
                style={{
                  top: topPx,
                  height: heightPx,
                  left: `calc(${(column / totalColumns) * 100}% + 2px)`,
                  right: `calc(${((totalColumns - column - 1) / totalColumns) * 100}% + 2px)`,
                }}
              >
                <EventChip event={ev} onClick={() => onChipClick(ev)} block />
              </div>
            ),
          )}
        </div>

        {/* Current time indicator — pulsing dot + line across the day column */}
        {currentTimeTop !== null && (
          <div
            className="absolute z-20 pointer-events-none flex items-center"
            style={{ top: currentTimeTop, left: GUTTER_WIDTH, right: 0 }}
          >
            <div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-1.5 shrink-0 animate-pulse" />
            <div className="flex-1 h-px bg-red-500" />
          </div>
        )}
      </div>
    </div>
  );
}
