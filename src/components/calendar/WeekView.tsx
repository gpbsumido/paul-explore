"use client";

import { format, startOfWeek, addDays, eachDayOfInterval, isToday } from "date-fns";
import { HOURS, slotDate, formatHour, eventsForHour, allDayEventsForDay } from "@/lib/calendar";

const WEEK_GRID_COLS = "3rem repeat(7, 1fr)";
import type { CalendarEvent } from "@/types/calendar";
import EventChip from "@/components/calendar/EventChip";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSlotClick: (date: Date) => void;
  onChipClick: (event: CalendarEvent) => void;
}

export default function WeekView({ currentDate, events, onSlotClick, onChipClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate);
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  return (
    <div className="border border-border overflow-x-auto">
      {/* Column headers */}
      <div
        className="grid border-b border-border"
        style={{ gridTemplateColumns: WEEK_GRID_COLS }}
      >
        <div className="border-r border-border" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={[
              "py-2 text-center text-xs border-r border-border last:border-r-0",
              isToday(day) ? "text-primary-600" : "text-muted",
            ].join(" ")}
          >
            <div>{format(day, "EEE")}</div>
            <div
              className={[
                "text-sm",
                isToday(day) ? "font-bold" : "font-medium text-foreground",
              ].join(" ")}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* All-day row */}
      <div
        className="grid border-b border-border"
        style={{ gridTemplateColumns: WEEK_GRID_COLS }}
      >
        <div className="border-r border-border px-1 py-1 text-right">
          <span className="text-[10px] text-muted">All day</span>
        </div>
        {weekDays.map((day) => {
          const allDayEvts = allDayEventsForDay(events, day);
          return (
            <div
              key={day.toISOString()}
              className="border-r border-border last:border-r-0 p-0.5 min-h-[24px]"
            >
              {allDayEvts.map((ev) => (
                <EventChip key={ev.id} event={ev} onClick={() => onChipClick(ev)} />
              ))}
            </div>
          );
        })}
      </div>

      {/* Time rows */}
      {HOURS.map((hour) => (
        <div
          key={hour}
          className="grid border-b border-border"
          style={{ gridTemplateColumns: WEEK_GRID_COLS }}
        >
          <div className="border-r border-border px-1 py-1 text-right">
            <span className="text-xs text-muted">{formatHour(hour)}</span>
          </div>
          {weekDays.map((day) => {
            const hourEvents = eventsForHour(events, day, hour);
            return (
              <div
                key={day.toISOString()}
                onClick={() => onSlotClick(slotDate(day, hour))}
                className="min-h-[40px] border-r border-border last:border-r-0 p-0.5 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors"
              >
                {hourEvents.map((ev) => (
                  <EventChip key={ev.id} event={ev} onClick={() => onChipClick(ev)} />
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
