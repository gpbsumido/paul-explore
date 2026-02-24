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
import { DAY_LABELS, eventsForDay } from "@/lib/calendar";
import type { CalendarEvent } from "@/types/calendar";

interface MiniMonthProps {
  month: Date;
  events: CalendarEvent[];
  /** Whether this month is the currently viewed month — gets flag-tape treatment. */
  isCurrent: boolean;
  onClick: () => void;
}

function MiniMonth({ month, events, isCurrent, onClick }: MiniMonthProps) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });

  return (
    <button
      onClick={onClick}
      className={[
        "rounded-xl border bg-surface p-3 text-left w-full transition-all hover:border-foreground/20 hover:shadow-md",
        // flag tape on the current month — same red stripe as the month grid today cell
        isCurrent
          ? "border-t-2 border-t-red-500 border-x-border border-b-border"
          : "border-border",
      ].join(" ")}
    >
      <div
        className={[
          "text-xs font-semibold mb-2",
          isCurrent ? "text-red-500" : "text-foreground",
        ].join(" ")}
      >
        {format(month, "MMMM")}
      </div>

      <div className="grid grid-cols-7">
        {/* Single-letter day-of-week labels */}
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-[8px] font-semibold uppercase text-muted/40 pb-1"
          >
            {d[0]}
          </div>
        ))}

        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const today = isToday(day);
          // only show event dots for days that belong to this month
          const dayEvents = inMonth ? eventsForDay(events, day) : [];

          return (
            <div key={day.toISOString()} className="flex flex-col items-center mb-0.5">
              {/* Day number — today gets a small filled circle */}
              <span
                className={[
                  "inline-flex items-center justify-center h-[14px] w-[14px] text-[9px] leading-none rounded-full",
                  today
                    ? "bg-red-500 text-white font-semibold"
                    : inMonth
                    ? "text-foreground"
                    : "text-muted opacity-20",
                ].join(" ")}
              >
                {format(day, "d")}
              </span>

              {/* Colored event dots — up to 3 per day */}
              {dayEvents.length > 0 && (
                <div className="flex gap-px mt-0.5">
                  {dayEvents.slice(0, 3).map((ev, i) => (
                    <div
                      key={i}
                      className="h-[3px] w-[3px] rounded-full"
                      style={{ backgroundColor: ev.color }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </button>
  );
}

interface YearViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onMonthClick: (date: Date) => void;
}

export default function YearView({
  currentDate,
  events,
  onMonthClick,
}: YearViewProps) {
  const months = eachMonthOfInterval({
    start: startOfYear(currentDate),
    end: endOfYear(currentDate),
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {months.map((month) => (
        <MiniMonth
          key={month.toISOString()}
          month={month}
          events={events}
          isCurrent={isSameMonth(month, currentDate)}
          onClick={() => onMonthClick(month)}
        />
      ))}
    </div>
  );
}
