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
import { DAY_LABELS } from "@/lib/calendar";

interface CalendarGridProps {
  currentDate: Date;
  onDayClick: (date: Date) => void;
}

export default function CalendarGrid({
  currentDate,
  onDayClick,
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

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className="min-h-[80px] p-2 text-left border-b border-r border-border"
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
