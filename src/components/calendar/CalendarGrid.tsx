"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
} from "date-fns"; // I used to use moment.js but apparently they recommend you use other projects because of the large overhead. Trying this out for it's performance
import { DAY_LABELS, eventsForDay } from "@/lib/calendar";
import type { CalendarEvent } from "@/types/calendar";
import EventChip from "@/components/calendar/EventChip";

interface CalendarGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onChipClick: (event: CalendarEvent) => void;
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
    <div className="border border-border">
      {/* Day-of-week header row */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_LABELS.map((label) => (
          <div key={label} className="py-2 text-center text-xs text-muted">
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const dayEvents = eventsForDay(events, day);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className="min-h-[80px] p-2 text-left border-b border-r border-border cursor-pointer"
            >
              <span
                className={[
                  "text-sm",
                  today ? "font-bold text-primary-600" : "",
                  !inMonth ? "text-muted opacity-40" : "text-foreground",
                ].join(" ")}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1">
                {dayEvents.slice(0, 3).map((ev) => (
                  <EventChip key={ev.id} event={ev} onClick={() => onChipClick(ev)} />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted px-1">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
