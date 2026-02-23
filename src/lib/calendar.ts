import {
  format,
  startOfWeek,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  isSameDay,
  getHours,
  parseISO,
} from "date-fns";
import type { CalendarView, CalendarEvent } from "@/types/calendar";

export const DAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const VIEWS: CalendarView[] = ["day", "week", "month", "year"];

export const VIEW_LABELS: Record<CalendarView, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  year: "Year",
};

// reset date to time zeroes
export function slotDate(base: Date, hour: number): Date {
  return setMilliseconds(setSeconds(setMinutes(setHours(base, hour), 0), 0), 0);
}

export function formatHour(hour: number): string {
  return format(new Date(2000, 0, 1, hour), "h aaa");
}

export const EVENT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
] as const;

// get all events that start from day
export function eventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((e) => isSameDay(parseISO(e.startDate), day));
}

/// get dates in given hour (not all day ones)
export function eventsForHour(
  events: CalendarEvent[],
  day: Date,
  hour: number,
): CalendarEvent[] {
  return events.filter(
    (e) =>
      !e.allDay &&
      isSameDay(parseISO(e.startDate), day) &&
      getHours(parseISO(e.startDate)) === hour,
  );
}

// get all day events on a day
export function allDayEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter(
    (e) => e.allDay && isSameDay(parseISO(e.startDate), day),
  );
}

// format value as local datetime
export function toInputValue(iso: string): string {
  return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");
}

export function formatHeading(date: Date, view: CalendarView): string {
  switch (view) {
    case "day":
      return format(date, "EEEE, MMMM d, yyyy");
    case "week":
      return format(startOfWeek(date), "'Week of' MMM d, yyyy");
    case "month":
      return format(date, "MMMM yyyy");
    case "year":
      return format(date, "yyyy");
  }
}
