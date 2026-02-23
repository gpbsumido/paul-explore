"use client";

import { format, isToday } from "date-fns";
import { HOURS, slotDate, formatHour } from "@/lib/calendar";

interface DayViewProps {
  currentDate: Date;
  onSlotClick: (date: Date) => void;
}

export default function DayView({ currentDate, onSlotClick }: DayViewProps) {
  const today = isToday(currentDate);

  return (
    <div className="border border-border">
      <div
        className={[
          "px-4 py-2 border-b border-border text-sm font-medium",
          today ? "text-primary-600" : "text-foreground",
        ].join(" ")}
      >
        {format(currentDate, "EEEE, MMMM d, yyyy")}
      </div>

      {HOURS.map((hour) => (
        <button
          key={hour}
          onClick={() => onSlotClick(slotDate(currentDate, hour))}
          className="w-full flex items-start gap-4 px-4 py-1 border-b border-border text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors"
        >
          <span className="text-xs text-muted w-12 shrink-0 pt-0.5">
            {formatHour(hour)}
          </span>
          <span className="flex-1 min-h-[32px]" />
        </button>
      ))}
    </div>
  );
}
