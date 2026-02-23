"use client";

import {
  format,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import { DAY_LABELS } from "@/lib/calendar";

interface MiniMonthProps {
  month: Date;
  onClick: () => void;
}

function MiniMonth({ month, onClick }: MiniMonthProps) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });

  return (
    <button
      onClick={onClick}
      className="border border-border p-2 text-left w-full hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors"
    >
      <div className="text-xs font-medium text-foreground mb-1">
        {format(month, "MMMM")}
      </div>

      <div className="grid grid-cols-7">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[9px] text-muted pb-0.5">
            {d[0]}
          </div>
        ))}
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={[
              "text-center text-[10px] leading-4",
              isToday(day) ? "font-bold text-primary-600" : "",
              !isSameMonth(day, month)
                ? "text-muted opacity-30"
                : "text-foreground",
            ].join(" ")}
          >
            {format(day, "d")}
          </div>
        ))}
      </div>
    </button>
  );
}

interface YearViewProps {
  currentDate: Date;
  onMonthClick: (date: Date) => void;
}

export default function YearView({ currentDate, onMonthClick }: YearViewProps) {
  const months = eachMonthOfInterval({
    start: startOfYear(currentDate),
    end: endOfYear(currentDate),
  });

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
      {months.map((month) => (
        <MiniMonth
          key={month.toISOString()}
          month={month}
          onClick={() => onMonthClick(month)}
        />
      ))}
    </div>
  );
}
