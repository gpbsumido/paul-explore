"use client";

import { memo, useMemo } from "react";
import {
  format,
  startOfWeek,
  addDays,
  eachDayOfInterval,
  isToday,
  isSameDay,
  getHours,
  getMinutes,
  parseISO,
  differenceInCalendarDays,
} from "date-fns";
import {
  HOURS,
  slotDate,
  formatHour,
  singleDayTimedEventsForDay,
  layoutDayEvents,
} from "@/lib/calendar";
import type { CalendarEvent, Countdown } from "@/types/calendar";
import EventChip from "@/components/calendar/EventChip";
import CountdownChip from "@/components/calendar/CountdownChip";

export const WEEK_ROW_HEIGHT = 48;
const GUTTER_WIDTH = "3rem";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  countdowns?: Countdown[];
  onSlotClick: (date: Date) => void;
  onChipClick: (event: CalendarEvent) => void;
  onCountdownClick?: (countdown: Countdown) => void;
}

function allDayEventsForWeek(
  events: CalendarEvent[],
  weekStart: Date,
): CalendarEvent[] {
  return events.filter((ev) => {
    const start = parseISO(ev.startDate);
    const end = parseISO(ev.endDate);
    const startOffset = differenceInCalendarDays(start, weekStart);
    const endOffset = differenceInCalendarDays(end, weekStart);
    if (endOffset < 0 || startOffset > 6) return false;
    if (ev.allDay) return true;
    return differenceInCalendarDays(end, start) >= 1;
  });
}

function getEventColSpan(
  ev: CalendarEvent,
  weekStart: Date,
): { startIdx: number; endIdx: number } {
  const startIdx = Math.max(
    0,
    differenceInCalendarDays(parseISO(ev.startDate), weekStart),
  );
  const endIdx = Math.min(
    6,
    differenceInCalendarDays(parseISO(ev.endDate), weekStart),
  );
  return { startIdx, endIdx };
}

function WeekView({
  currentDate,
  events,
  countdowns = [],
  onSlotClick,
  onChipClick,
  onCountdownClick,
}: WeekViewProps) {
  const weekStart = useMemo(() => startOfWeek(currentDate), [currentDate]);
  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }),
    [weekStart],
  );

  const now = new Date();
  const todayInWeek = weekDays.some((d) => isToday(d));
  const currentTimeTop = todayInWeek
    ? (getHours(now) + getMinutes(now) / 60) * WEEK_ROW_HEIGHT
    : null;

  const allDaySpanned = useMemo(
    () => allDayEventsForWeek(events, weekStart),
    [events, weekStart],
  );

  const timedLayouts = useMemo(
    () =>
      weekDays.map((day) =>
        layoutDayEvents(singleDayTimedEventsForDay(events, day), WEEK_ROW_HEIGHT),
      ),
    [events, weekDays],
  );

  return (
    // overflow-x-auto lets narrow screens scroll the 7-column layout horizontally.
    // The time grid renders at full natural height — the parent InfiniteCalendarScroll handles vertical scroll.
    <div className="rounded-xl border border-border overflow-x-auto">
      <div className="min-w-[560px]">
        {/* Column headers */}
        <div className="flex border-b border-border">
          <div className="w-12 shrink-0 border-r border-border" />
          {weekDays.map((day) => {
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={[
                  "flex-1 py-2 text-center text-xs border-r border-border last:border-r-0",
                  today ? "bg-red-500/[0.04] dark:bg-red-500/[0.08]" : "",
                ].join(" ")}
              >
                <div
                  className={[
                    "text-[10px] font-semibold uppercase tracking-wide",
                    today ? "text-red-500" : "text-muted",
                  ].join(" ")}
                >
                  {format(day, "EEE")}
                </div>
                <div className="mt-0.5 flex justify-center">
                  <span
                    className={[
                      "inline-flex items-center justify-center h-7 w-7 text-sm rounded-full transition-colors",
                      today
                        ? "bg-red-500 text-white font-semibold shadow-[0_0_0_4px_rgba(239,68,68,0.12)]"
                        : "font-medium text-foreground",
                    ].join(" ")}
                  >
                    {format(day, "d")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* All-day row */}
        <div className="flex border-b border-border">
          <div className="w-12 shrink-0 border-r border-border px-1 py-1 text-right">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-muted/50">
              All day
            </span>
          </div>
          <div className="flex-1 relative min-h-[28px]">
            <div className="absolute inset-0 flex pointer-events-none">
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={[
                    "flex-1 border-r border-border last:border-r-0 h-full",
                    isToday(day) ? "bg-red-500/5" : "",
                  ].join(" ")}
                />
              ))}
            </div>
            <div
              className="relative grid gap-y-0.5 py-0.5"
              style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
            >
              {allDaySpanned.map((ev) => {
                const { startIdx, endIdx } = getEventColSpan(ev, weekStart);
                return (
                  <div
                    key={ev.id}
                    style={{
                      gridColumn: `${startIdx + 1} / span ${endIdx - startIdx + 1}`,
                    }}
                    className="px-0.5"
                  >
                    <EventChip event={ev} onClick={() => onChipClick(ev)} />
                  </div>
                );
              })}
              {weekDays.map((day, dayIdx) => {
                const dayCds = countdowns.filter((c) =>
                  isSameDay(parseISO(c.targetDate), day),
                );
                return dayCds.map((c) => (
                  <div
                    key={c.id}
                    style={{ gridColumn: `${dayIdx + 1} / span 1` }}
                    className="px-0.5"
                  >
                    <CountdownChip
                      countdown={c}
                      onClick={() => onCountdownClick?.(c)}
                    />
                  </div>
                ));
              })}
            </div>
          </div>
        </div>

        {/* Time grid — full natural height */}
        <div className="relative flex">
          {/* Time labels */}
          <div className="w-12 shrink-0 border-r border-border">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="flex items-start justify-end pr-1 pt-1 border-b border-border last:border-b-0"
                style={{ height: WEEK_ROW_HEIGHT }}
              >
                <span className="text-[10px] text-muted/30">
                  {formatHour(hour)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex flex-1">
            {weekDays.map((day, dayIdx) => {
              const today = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className="flex-1 relative border-r border-border last:border-r-0"
                >
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      onClick={() => onSlotClick(slotDate(day, hour))}
                      style={{ height: WEEK_ROW_HEIGHT }}
                      className={[
                        "border-b border-border last:border-b-0 cursor-pointer transition-colors",
                        today
                          ? "bg-red-500/[0.03] hover:bg-red-500/[0.07]"
                          : "hover:bg-surface-raised/50",
                      ].join(" ")}
                    />
                  ))}

                  {timedLayouts[dayIdx].map(
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
                        <EventChip
                          event={ev}
                          onClick={() => onChipClick(ev)}
                          block
                        />
                      </div>
                    ),
                  )}
                </div>
              );
            })}
          </div>

          {/* Current time indicator */}
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
    </div>
  );
}

export default memo(WeekView);
