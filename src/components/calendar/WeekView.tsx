"use client";

import {
  format,
  startOfWeek,
  addDays,
  eachDayOfInterval,
  isToday,
} from "date-fns";
import { HOURS, slotDate, formatHour } from "@/lib/calendar";

interface WeekViewProps {
  currentDate: Date;
  onSlotClick: (date: Date) => void;
}

export default function WeekView({ currentDate, onSlotClick }: WeekViewProps) {
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
        style={{ gridTemplateColumns: "3rem repeat(7, 1fr)" }}
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

      {/* Time rows */}
      {HOURS.map((hour) => (
        <div
          key={hour}
          className="grid border-b border-border"
          style={{ gridTemplateColumns: "3rem repeat(7, 1fr)" }}
        >
          <div className="border-r border-border px-1 py-1 text-right">
            <span className="text-xs text-muted">{formatHour(hour)}</span>
          </div>
          {weekDays.map((day) => (
            <button
              key={day.toISOString()}
              onClick={() => onSlotClick(slotDate(day, hour))}
              className="min-h-[40px] border-r border-border last:border-r-0 hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
