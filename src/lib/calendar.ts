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
import type { CalendarView, CalendarEvent, EventCard } from "@/types/calendar";

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
