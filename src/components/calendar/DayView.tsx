"use client";

import { format, isToday } from "date-fns";
import { HOURS, slotDate, formatHour, eventsForHour, allDayEventsForDay } from "@/lib/calendar";
import type { CalendarEvent } from "@/types/calendar";
import EventChip from "@/components/calendar/EventChip";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSlotClick: (date: Date) => void;
  onChipClick: (event: CalendarEvent) => void;
}

export default function DayView({ currentDate, events, onSlotClick, onChipClick }: DayViewProps) {
  const today = isToday(currentDate);
  const allDayEvents = allDayEventsForDay(events, currentDate);

  return (
    <div className="border border-border">
      {/* Day heading */}
      <div
        className={[
          "px-4 py-2 border-b border-border text-sm font-medium",
          today ? "text-primary-600" : "text-foreground",
        ].join(" ")}
      >
        {format(currentDate, "EEEE, MMMM d, yyyy")}
      </div>

      {/* All-day row */}
      {allDayEvents.length > 0 && (
        <div className="flex items-start gap-4 px-4 py-1 border-b border-border">
          <span className="text-xs text-muted w-12 shrink-0 pt-0.5">All day</span>
          <div className="flex-1">
            {allDayEvents.map((ev) => (
              <EventChip key={ev.id} event={ev} onClick={() => onChipClick(ev)} />
            ))}
          </div>
        </div>
      )}

      {/* Hour slots */}
      {HOURS.map((hour) => {
        const hourEvents = eventsForHour(events, currentDate, hour);

        return (
          <div
            key={hour}
            onClick={() => onSlotClick(slotDate(currentDate, hour))}
            className="flex items-start gap-4 px-4 py-1 border-b border-border cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors"
          >
            <span className="text-xs text-muted w-12 shrink-0 pt-0.5">{formatHour(hour)}</span>
            <div className="flex-1 min-h-[32px]">
              {hourEvents.map((ev) => (
                <EventChip key={ev.id} event={ev} onClick={() => onChipClick(ev)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
