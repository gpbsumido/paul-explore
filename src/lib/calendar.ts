import {
  format,
  startOfWeek,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  isSameDay,
  getHours,
  getMinutes,
  parseISO,
  differenceInCalendarDays,
} from "date-fns";
import type {
  CalendarView,
  CalendarEvent,
  EventCard,
  EventSearchFilters,
  EventLayout,
} from "@/types/calendar";

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

/**
 * Events that cover a given day — includes multi-day events that started
 * before this day and haven't ended yet, not just ones starting on it.
 */
export function eventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((e) => {
    const s = differenceInCalendarDays(parseISO(e.startDate), day);
    const en = differenceInCalendarDays(parseISO(e.endDate), day);
    return s <= 0 && en >= 0;
  });
}

/**
 * Timed events that start at a specific hour on a given day.
 * Used by legacy code paths — new views prefer singleDayTimedEventsForDay.
 */
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

/**
 * All-day events that cover a given day — includes multi-day all-day events
 * that started before this day and are still running.
 */
export function allDayEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((e) => {
    if (!e.allDay) return false;
    const s = differenceInCalendarDays(parseISO(e.startDate), day);
    const en = differenceInCalendarDays(parseISO(e.endDate), day);
    return s <= 0 && en >= 0;
  });
}

/**
 * Events that should appear in the "all day" row for a given day:
 * allDay events + timed events that span multiple calendar days.
 * allDay events come first, same ordering Google Calendar uses.
 */
export function spanningEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  const covering = events.filter((e) => {
    const s = differenceInCalendarDays(parseISO(e.startDate), day);
    const en = differenceInCalendarDays(parseISO(e.endDate), day);
    if (s > 0 || en < 0) return false;
    if (e.allDay) return true;
    // multi-day timed events go up here, not in the scrollable time grid
    return differenceInCalendarDays(parseISO(e.endDate), parseISO(e.startDate)) >= 1;
  });
  return [...covering.filter((e) => e.allDay), ...covering.filter((e) => !e.allDay)];
}

/**
 * Timed events that both start and end on the same calendar day.
 * These are the ones that get absolute-positioned blocks in the time grid.
 */
export function singleDayTimedEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((ev) => {
    if (ev.allDay) return false;
    const start = parseISO(ev.startDate);
    const end = parseISO(ev.endDate);
    if (!isSameDay(start, day)) return false;
    return differenceInCalendarDays(end, start) === 0;
  });
}

/**
 * Assigns non-overlapping column positions to timed events so they appear
 * side by side instead of stacked on top of each other — same layout
 * strategy Google Calendar uses.
 *
 * Algorithm: sort by start time, greedily place each event into the first
 * column whose last occupant has already ended. Then for each event, compute
 * how many concurrent columns exist in its overlap group (that's the width
 * denominator the caller uses for percentage-based positioning).
 *
 * Expects single-day events — call singleDayTimedEventsForDay first.
 */
export function layoutDayEvents(
  events: CalendarEvent[],
  rowHeight: number,
): EventLayout[] {
  if (!events.length) return [];

  // Sort by start time; longer events win ties so they claim column space first
  const sorted = [...events].sort((a, b) => {
    const startDiff =
      parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime();
    if (startDiff !== 0) return startDiff;
    return parseISO(b.endDate).getTime() - parseISO(a.endDate).getTime();
  });

  // colEnds[c] = end timestamp of the last event assigned to column c
  const colEnds: number[] = [];
  const eventCols = sorted.map((ev) => {
    const startMs = parseISO(ev.startDate).getTime();
    const endMs = parseISO(ev.endDate).getTime();
    const col = colEnds.findIndex((colEnd) => colEnd <= startMs);
    if (col === -1) {
      colEnds.push(endMs);
      return colEnds.length - 1;
    }
    colEnds[col] = endMs;
    return col;
  });

  return sorted.map((ev, i) => {
    const startMs = parseISO(ev.startDate).getTime();
    const endMs = parseISO(ev.endDate).getTime();

    // Walk every other event that overlaps this one to find the widest column
    // group — that's how many columns we need to divide the space into.
    let maxCol = eventCols[i];
    for (let j = 0; j < sorted.length; j++) {
      const jStart = parseISO(sorted[j].startDate).getTime();
      const jEnd = parseISO(sorted[j].endDate).getTime();
      if (jStart < endMs && jEnd > startMs) {
        maxCol = Math.max(maxCol, eventCols[j]);
      }
    }

    const start = parseISO(ev.startDate);
    const end = parseISO(ev.endDate);
    const startFrac = getHours(start) + getMinutes(start) / 60;
    const endFrac = getHours(end) + getMinutes(end) / 60;
    const topPx = startFrac * rowHeight;
    const heightPx = Math.max((endFrac - startFrac) * rowHeight, 20);

    return {
      ev,
      topPx,
      heightPx,
      column: eventCols[i],
      totalColumns: maxCol + 1,
    };
  });
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

// fetch events within date range (ISO strings)
export async function fetchEvents(
  start: string,
  end: string,
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({ start, end });
  const res = await fetch(`/api/calendar/events?${params}`);
  if (!res.ok) throw new Error("Failed to fetch events");
  const data = await res.json();
  return data.events as CalendarEvent[];
}

// fetch a single event — returns null on 404, throws on other errors
export async function fetchEvent(id: string): Promise<CalendarEvent | null> {
  const res = await fetch(`/api/calendar/events/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch event");
  const data = await res.json();
  return data.event as CalendarEvent;
}

// search/list events with optional filters; omit all to get everything
export async function searchEvents(
  filters: EventSearchFilters = {},
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams();
  if (filters.start) params.set("start", filters.start);
  if (filters.end) params.set("end", filters.end);
  if (filters.cardName) params.set("cardName", filters.cardName);
  const qs = params.toString();
  const res = await fetch(`/api/calendar/events${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to search events");
  const data = await res.json();
  return data.events as CalendarEvent[];
}

// create new event, id from backend
export async function createEvent(
  event: Omit<CalendarEvent, "id">,
): Promise<CalendarEvent> {
  const res = await fetch("/api/calendar/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error("Failed to create event");
  const data = await res.json();
  return data.event as CalendarEvent;
}

// update exisitng event
export async function updateEvent(
  id: string,
  fields: Partial<Omit<CalendarEvent, "id">>,
): Promise<CalendarEvent> {
  const res = await fetch(`/api/calendar/events/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error("Failed to update event");
  const data = await res.json();
  return data.event as CalendarEvent;
}

// delete event
export async function deleteEvent(id: string): Promise<void> {
  const res = await fetch(`/api/calendar/events/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete event");
}

// fetch event cards
export async function fetchEventCards(eventId: string): Promise<EventCard[]> {
  const res = await fetch(`/api/calendar/events/${eventId}/cards`);
  if (!res.ok) throw new Error("Failed to fetch event cards");
  const data = await res.json();
  return data.cards as EventCard[];
}

// attach card to event
export async function addCardToEvent(
  eventId: string,
  card: {
    cardId: string;
    cardName: string;
    cardSetId?: string;
    cardSetName?: string;
    cardImageUrl?: string;
    quantity?: number;
    notes?: string;
  },
): Promise<EventCard> {
  const res = await fetch(`/api/calendar/events/${eventId}/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
  });
  if (!res.ok) throw new Error("Failed to add card to event");
  const data = await res.json();
  return data.card as EventCard;
}

// update card info
export async function updateEventCard(
  eventId: string,
  entryId: string,
  fields: { quantity?: number; notes?: string },
): Promise<EventCard> {
  const res = await fetch(`/api/calendar/events/${eventId}/cards/${entryId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error("Failed to update card");
  const data = await res.json();
  return data.card as EventCard;
}

// remove card from event
export async function removeCardFromEvent(
  eventId: string,
  entryId: string,
): Promise<void> {
  const res = await fetch(`/api/calendar/events/${eventId}/cards/${entryId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove card from event");
}
