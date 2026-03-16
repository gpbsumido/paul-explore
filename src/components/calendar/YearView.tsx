"use client";

import { memo } from "react";
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
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import { DAY_LABELS, eventsForDay } from "@/lib/calendar";
import type { CalendarEvent, Countdown } from "@/types/calendar";

interface MiniMonthProps {
  month: Date;
  events: CalendarEvent[];
  countdowns: Countdown[];
  /** Whether this month is the currently viewed month — gets flag-tape treatment. */
  isCurrent: boolean;
  onClick: () => void;
}

// MiniMonth renders a full mini-grid per month. There are 12 of them on screen
// and they're cheap individually, but 12x the work still adds up on each keystroke
// or modal toggle in the parent.
const MiniMonth = memo(function MiniMonth({ month, events, countdowns, isCurrent, onClick }: MiniMonthProps) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });

  return (
    <button
      onClick={onClick}
      className={[
        "rounded-xl border bg-surface p-3 text-left w-full transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-md",
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
          const dayCds = inMonth
            ? countdowns.filter((c) => isSameDay(parseISO(c.targetDate), day))
            : [];
          const allDots = [
            ...dayEvents.map((ev) => ev.color),
            ...dayCds.map((c) => c.color),
          ];

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

              {/* Colored dots — events and countdowns share the 3-dot budget */}
              {allDots.length > 0 && (
                <div className="flex gap-px mt-0.5">
                  {allDots.slice(0, 3).map((color, i) => (
                    <div
                      key={i}
                      className="h-[3px] w-[3px] rounded-full"
                      style={{ backgroundColor: color }}
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
});

interface YearViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  countdowns?: Countdown[];
  onMonthClick: (date: Date) => void;
}

function YearView({
  currentDate,
  events,
  countdowns = [],
  onMonthClick,
}: YearViewProps) {
  const months = eachMonthOfInterval({
    start: startOfYear(currentDate),
    end: endOfYear(currentDate),
  });

  return (
    <div className="rounded-xl border border-border overflow-hidden p-3 sm:p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {months.map((month) => (
          <MiniMonth
            key={month.toISOString()}
            month={month}
            events={events}
            countdowns={countdowns}
            isCurrent={isSameMonth(month, currentDate)}
            onClick={() => onMonthClick(month)}
          />
        ))}
      </div>
    </div>
  );
}

// YearView itself is worth memoizing so the 12 MiniMonth renders don't fire
// on CalendarContent state changes that don't touch events or currentDate.
export default memo(YearView);
