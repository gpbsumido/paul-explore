import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  eventsForDay,
  allDayEventsForDay,
  spanningEventsForDay,
  singleDayTimedEventsForDay,
  layoutDayEvents,
  formatHeading,
  formatHour,
  slotDate,
  toInputValue,
  createEvent,
  updateEvent,
  deleteEvent,
  addCardToEvent,
  updateEventCard,
  removeCardFromEvent,
  fetchCountdowns,
  createCountdown,
  updateCountdown,
  deleteCountdown,
} from "../calendar";
import type { CalendarEvent } from "@/types/calendar";

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "event-1",
    title: "Test Event",
    startDate: "2024-03-15T10:00:00",
    endDate: "2024-03-15T11:00:00",
    color: "#3b82f6",
    allDay: false,
    ...overrides,
  };
}

function makeAllDay(
  startDate: string,
  endDate: string,
  overrides: Partial<CalendarEvent> = {},
): CalendarEvent {
  return makeEvent({ startDate, endDate, allDay: true, ...overrides });
}

const MARCH_15 = new Date("2024-03-15T00:00:00");
const MARCH_16 = new Date("2024-03-16T00:00:00");

// ---------------------------------------------------------------------------
// eventsForDay
// ---------------------------------------------------------------------------

describe("eventsForDay", () => {
  it("includes an event that starts and ends on the given day", () => {
    const event = makeEvent({
      startDate: "2024-03-15T09:00:00",
      endDate: "2024-03-15T10:00:00",
    });
    expect(eventsForDay([event], MARCH_15)).toContain(event);
  });

  it("includes a multi-day event that started before and ends after the given day", () => {
    const event = makeEvent({
      startDate: "2024-03-14T09:00:00",
      endDate: "2024-03-16T10:00:00",
    });
    expect(eventsForDay([event], MARCH_15)).toContain(event);
  });

  it("includes a multi-day event that starts on the given day", () => {
    const event = makeEvent({
      startDate: "2024-03-15T09:00:00",
      endDate: "2024-03-17T10:00:00",
    });
    expect(eventsForDay([event], MARCH_15)).toContain(event);
  });

  it("includes a multi-day event that ends on the given day", () => {
    const event = makeEvent({
      startDate: "2024-03-13T09:00:00",
      endDate: "2024-03-15T10:00:00",
    });
    expect(eventsForDay([event], MARCH_15)).toContain(event);
  });

  it("excludes an event that is entirely before the given day", () => {
    const event = makeEvent({
      startDate: "2024-03-14T09:00:00",
      endDate: "2024-03-14T10:00:00",
    });
    expect(eventsForDay([event], MARCH_15)).not.toContain(event);
  });

  it("excludes an event that is entirely after the given day", () => {
    const event = makeEvent({
      startDate: "2024-03-16T09:00:00",
      endDate: "2024-03-16T10:00:00",
    });
    expect(eventsForDay([event], MARCH_15)).not.toContain(event);
  });

  it("returns an empty array when there are no events", () => {
    expect(eventsForDay([], MARCH_15)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// allDayEventsForDay
// ---------------------------------------------------------------------------

describe("allDayEventsForDay", () => {
  it("includes an all-day event on the same day", () => {
    const event = makeAllDay("2024-03-15", "2024-03-15");
    expect(allDayEventsForDay([event], MARCH_15)).toContain(event);
  });

  it("includes a multi-day all-day event spanning the given day", () => {
    const event = makeAllDay("2024-03-14", "2024-03-16");
    expect(allDayEventsForDay([event], MARCH_15)).toContain(event);
  });

  it("excludes timed events even if they fall on the given day", () => {
    const event = makeEvent({
      startDate: "2024-03-15T10:00:00",
      endDate: "2024-03-15T11:00:00",
      allDay: false,
    });
    expect(allDayEventsForDay([event], MARCH_15)).not.toContain(event);
  });

  it("excludes all-day events that don't overlap the given day", () => {
    const event = makeAllDay("2024-03-16", "2024-03-17");
    expect(allDayEventsForDay([event], MARCH_15)).not.toContain(event);
  });
});

// ---------------------------------------------------------------------------
// spanningEventsForDay
// ---------------------------------------------------------------------------

describe("spanningEventsForDay", () => {
  it("includes all-day events", () => {
    const event = makeAllDay("2024-03-15", "2024-03-15");
    expect(spanningEventsForDay([event], MARCH_15)).toContain(event);
  });

  it("includes multi-day timed events", () => {
    const event = makeEvent({
      startDate: "2024-03-15T09:00:00",
      endDate: "2024-03-16T09:00:00",
    });
    expect(spanningEventsForDay([event], MARCH_15)).toContain(event);
  });

  it("excludes same-day timed events (they go in the time grid)", () => {
    const event = makeEvent({
      startDate: "2024-03-15T09:00:00",
      endDate: "2024-03-15T10:00:00",
    });
    expect(spanningEventsForDay([event], MARCH_15)).not.toContain(event);
  });

  it("leaves out events that haven't started yet", () => {
    const allDayTomorrow = makeAllDay("2024-03-16", "2024-03-16");
    const multiDayStartingTomorrow = makeEvent({
      startDate: "2024-03-16T09:00:00",
      endDate: "2024-03-17T09:00:00",
    });
    expect(
      spanningEventsForDay([allDayTomorrow, multiDayStartingTomorrow], MARCH_15),
    ).toEqual([]);
  });

  it("leaves out events that ended before the day", () => {
    const allDayYesterday = makeAllDay("2024-03-13", "2024-03-14");
    expect(spanningEventsForDay([allDayYesterday], MARCH_15)).toEqual([]);
  });

  it("treats a timed event that runs past midnight as spanning", () => {
    const overnight = makeEvent({
      startDate: "2024-03-15T22:00:00",
      endDate: "2024-03-16T01:00:00",
    });
    expect(spanningEventsForDay([overnight], MARCH_15)).toEqual([overnight]);
    expect(spanningEventsForDay([overnight], MARCH_16)).toEqual([overnight]);
  });

  it("lists all-day events before multi-day timed events", () => {
    const timed = makeEvent({
      startDate: "2024-03-15T09:00:00",
      endDate: "2024-03-16T09:00:00",
    });
    const allDay = makeAllDay("2024-03-15", "2024-03-15");
    expect(spanningEventsForDay([timed, allDay], MARCH_15)).toEqual([allDay, timed]);
  });
});

// ---------------------------------------------------------------------------
// singleDayTimedEventsForDay
// ---------------------------------------------------------------------------

describe("singleDayTimedEventsForDay", () => {
  it("includes a timed event that starts and ends on the given day", () => {
    const event = makeEvent({
      startDate: "2024-03-15T14:00:00",
      endDate: "2024-03-15T15:00:00",
    });
    expect(singleDayTimedEventsForDay([event], MARCH_15)).toContain(event);
  });

  it("excludes all-day events", () => {
    const event = makeAllDay("2024-03-15", "2024-03-15");
    expect(singleDayTimedEventsForDay([event], MARCH_15)).not.toContain(event);
  });

  it("excludes multi-day timed events (they go in the spanning row)", () => {
    const event = makeEvent({
      startDate: "2024-03-15T09:00:00",
      endDate: "2024-03-16T09:00:00",
    });
    expect(singleDayTimedEventsForDay([event], MARCH_15)).not.toContain(event);
  });

  it("excludes events starting on a different day", () => {
    const event = makeEvent({
      startDate: "2024-03-16T09:00:00",
      endDate: "2024-03-16T10:00:00",
    });
    expect(singleDayTimedEventsForDay([event], MARCH_15)).not.toContain(event);
  });
});

// ---------------------------------------------------------------------------
// layoutDayEvents
// ---------------------------------------------------------------------------

describe("layoutDayEvents", () => {
  const ROW_HEIGHT = 60;

  it("returns an empty array when given no events", () => {
    expect(layoutDayEvents([], ROW_HEIGHT)).toEqual([]);
  });

  it("assigns a single event to column 0 of 1", () => {
    const event = makeEvent({
      startDate: "2024-03-15T10:00:00",
      endDate: "2024-03-15T11:00:00",
    });
    const [layout] = layoutDayEvents([event], ROW_HEIGHT);
    expect(layout.column).toBe(0);
    expect(layout.totalColumns).toBe(1);
  });

  it("places non-overlapping events in the same column", () => {
    const morning = makeEvent({
      startDate: "2024-03-15T09:00:00",
      endDate: "2024-03-15T10:00:00",
    });
    const afternoon = makeEvent({
      startDate: "2024-03-15T14:00:00",
      endDate: "2024-03-15T15:00:00",
    });
    const layouts = layoutDayEvents([morning, afternoon], ROW_HEIGHT);
    expect(layouts.map((l) => [l.column, l.totalColumns])).toEqual([
      [0, 1],
      [0, 1],
    ]);
  });

  it("lets an event start in the same minute another one ends, sharing its column", () => {
    const first = makeEvent({
      startDate: "2024-03-15T09:00:00",
      endDate: "2024-03-15T10:00:00",
    });
    const second = makeEvent({
      startDate: "2024-03-15T10:00:00",
      endDate: "2024-03-15T11:00:00",
    });
    const layouts = layoutDayEvents([first, second], ROW_HEIGHT);
    expect(layouts.map((l) => [l.column, l.totalColumns])).toEqual([
      [0, 1],
      [0, 1],
    ]);
  });

  it("gives a lone event after a busy stretch the full width", () => {
    const events = [
      makeEvent({ startDate: "2024-03-15T09:00:00", endDate: "2024-03-15T11:00:00" }),
      makeEvent({ startDate: "2024-03-15T09:00:00", endDate: "2024-03-15T11:00:00" }),
      makeEvent({ startDate: "2024-03-15T12:00:00", endDate: "2024-03-15T13:00:00" }),
    ];
    const layouts = layoutDayEvents(events, ROW_HEIGHT);
    expect(layouts.map((l) => l.totalColumns)).toEqual([2, 2, 1]);
  });

  it("reuses a freed column when a later event starts after an earlier one ends", () => {
    const a = makeEvent({ id: "a", startDate: "2024-03-15T09:00:00", endDate: "2024-03-15T11:00:00" });
    const b = makeEvent({ id: "b", startDate: "2024-03-15T10:00:00", endDate: "2024-03-15T12:00:00" });
    const c = makeEvent({ id: "c", startDate: "2024-03-15T11:30:00", endDate: "2024-03-15T13:00:00" });
    const layouts = layoutDayEvents([a, b, c], ROW_HEIGHT);
    expect(layouts.map((l) => [l.ev.id, l.column, l.totalColumns])).toEqual([
      ["a", 0, 2],
      ["b", 1, 2],
      ["c", 0, 2],
    ]);
  });

  it("puts the longer of two events that start together in the first column", () => {
    const short = makeEvent({ id: "short", startDate: "2024-03-15T09:00:00", endDate: "2024-03-15T09:30:00" });
    const long = makeEvent({ id: "long", startDate: "2024-03-15T09:00:00", endDate: "2024-03-15T11:00:00" });
    const layouts = layoutDayEvents([short, long], ROW_HEIGHT);
    expect(layouts.map((l) => [l.ev.id, l.column])).toEqual([
      ["long", 0],
      ["short", 1],
    ]);
  });

  it("lays out events by start time however they were passed in", () => {
    const early = makeEvent({ id: "early", startDate: "2024-03-15T10:00:00", endDate: "2024-03-15T12:00:00" });
    const late = makeEvent({ id: "late", startDate: "2024-03-15T11:00:00", endDate: "2024-03-15T13:00:00" });
    const layouts = layoutDayEvents([late, early], ROW_HEIGHT);
    expect(layouts.map((l) => [l.ev.id, l.column])).toEqual([
      ["early", 0],
      ["late", 1],
    ]);
  });

  it("places two overlapping events in separate columns", () => {
    const a = makeEvent({
      startDate: "2024-03-15T10:00:00",
      endDate: "2024-03-15T12:00:00",
    });
    const b = makeEvent({
      startDate: "2024-03-15T11:00:00",
      endDate: "2024-03-15T13:00:00",
    });
    const layouts = layoutDayEvents([a, b], ROW_HEIGHT);
    const columns = layouts.map((l) => l.column);
    expect(columns).toContain(0);
    expect(columns).toContain(1);
  });

  it("reports totalColumns = 2 for a pair of overlapping events", () => {
    const a = makeEvent({
      startDate: "2024-03-15T10:00:00",
      endDate: "2024-03-15T12:00:00",
    });
    const b = makeEvent({
      startDate: "2024-03-15T11:00:00",
      endDate: "2024-03-15T13:00:00",
    });
    const layouts = layoutDayEvents([a, b], ROW_HEIGHT);
    expect(layouts.every((l) => l.totalColumns === 2)).toBe(true);
  });

  it("places three simultaneous events in three separate columns", () => {
    const events = [
      makeEvent({
        startDate: "2024-03-15T10:00:00",
        endDate: "2024-03-15T12:00:00",
      }),
      makeEvent({
        startDate: "2024-03-15T10:00:00",
        endDate: "2024-03-15T12:00:00",
      }),
      makeEvent({
        startDate: "2024-03-15T10:00:00",
        endDate: "2024-03-15T12:00:00",
      }),
    ];
    const layouts = layoutDayEvents(events, ROW_HEIGHT);
    const columns = layouts.map((l) => l.column).sort();
    expect(columns).toEqual([0, 1, 2]);
    expect(layouts.every((l) => l.totalColumns === 3)).toBe(true);
  });

  it("computes topPx based on start hour and row height", () => {
    const event = makeEvent({
      startDate: "2024-03-15T02:00:00",
      endDate: "2024-03-15T03:00:00",
    });
    const [layout] = layoutDayEvents([event], ROW_HEIGHT);
    expect(layout.topPx).toBe(2 * ROW_HEIGHT);
  });

  it("computes heightPx based on event duration", () => {
    const event = makeEvent({
      startDate: "2024-03-15T09:00:00",
      endDate: "2024-03-15T11:00:00",
    });
    const [layout] = layoutDayEvents([event], ROW_HEIGHT);
    expect(layout.heightPx).toBe(2 * ROW_HEIGHT);
  });

  it("enforces a minimum height of 20px for very short events", () => {
    const event = makeEvent({
      startDate: "2024-03-15T09:00:00",
      endDate: "2024-03-15T09:05:00",
    });
    const [layout] = layoutDayEvents([event], ROW_HEIGHT);
    expect(layout.heightPx).toBe(20);
  });

  it("counts minutes when placing and sizing an event", () => {
    const event = makeEvent({
      startDate: "2024-03-15T09:30:00",
      endDate: "2024-03-15T10:45:00",
    });
    const [layout] = layoutDayEvents([event], ROW_HEIGHT);
    expect(layout.topPx).toBe(9.5 * ROW_HEIGHT);
    expect(layout.heightPx).toBe(1.25 * ROW_HEIGHT);
  });
});

// ---------------------------------------------------------------------------
// formatHeading
// ---------------------------------------------------------------------------

describe("formatHeading", () => {
  const date = new Date("2024-03-15T00:00:00");

  it("formats day view as full weekday + date", () => {
    expect(formatHeading(date, "day")).toBe("Friday, March 15, 2024");
  });

  it("formats month view as month + year", () => {
    expect(formatHeading(date, "month")).toBe("March 2024");
  });

  it("formats year view as just the year", () => {
    expect(formatHeading(date, "year")).toBe("2024");
  });

  it("formats week view starting from Sunday of that week", () => {
    // March 15 2024 is a Friday — week starts March 10 (Sunday)
    expect(formatHeading(date, "week")).toBe("Week of Mar 10, 2024");
  });

  it("keeps a Sunday as the start of its own week", () => {
    expect(formatHeading(new Date("2024-03-10T00:00:00"), "week")).toBe(
      "Week of Mar 10, 2024",
    );
  });
});

// ---------------------------------------------------------------------------
// formatHour
// ---------------------------------------------------------------------------

describe("formatHour", () => {
  it("formats midnight as 12 am", () => {
    expect(formatHour(0)).toBe("12 am");
  });

  it("formats noon as 12 pm", () => {
    expect(formatHour(12)).toBe("12 pm");
  });

  it("formats 9 as 9 am", () => {
    expect(formatHour(9)).toBe("9 am");
  });

  it("formats 13 as 1 pm", () => {
    expect(formatHour(13)).toBe("1 pm");
  });
});

// ---------------------------------------------------------------------------
// eventsForDay vs MARCH_16 boundary check
// ---------------------------------------------------------------------------

describe("eventsForDay day boundary", () => {
  it("does not include an event that ends the day before", () => {
    const event = makeEvent({
      startDate: "2024-03-14T09:00:00",
      endDate: "2024-03-14T23:59:00",
    });
    expect(eventsForDay([event], MARCH_16)).not.toContain(event);
  });

  it("includes an event that starts the day before and ends on the given day", () => {
    const event = makeEvent({
      startDate: "2024-03-15T22:00:00",
      endDate: "2024-03-16T01:00:00",
    });
    expect(eventsForDay([event], MARCH_16)).toContain(event);
  });
});

// ---------------------------------------------------------------------------
// slotDate / toInputValue
// ---------------------------------------------------------------------------

describe("slotDate", () => {
  it("lands on the top of the given hour on the same day", () => {
    const slot = slotDate(new Date(2024, 2, 15, 13, 45, 30, 500), 9);
    expect(slot).toEqual(new Date(2024, 2, 15, 9, 0, 0, 0));
  });
});

describe("toInputValue", () => {
  it("drops seconds so a datetime-local input accepts it", () => {
    expect(toInputValue("2024-03-15T10:30:45")).toBe("2024-03-15T10:30");
  });
});

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

/**
 * Answers one route and records what the client actually sent, so a test can
 * check the method, the path it hit and the body it posted.
 */
function answer(
  method: "get" | "post" | "put" | "delete",
  path: string,
  response: () => Response,
) {
  const sent: { url: string; body: unknown; contentType: string | null }[] = [];
  server.use(
    http[method](path, async ({ request }) => {
      const text = await request.text();
      sent.push({
        url: request.url,
        body: text ? JSON.parse(text) : undefined,
        contentType: request.headers.get("content-type"),
      });
      return response();
    }),
  );
  return sent;
}

const savedEvent = {
  id: "event-9",
  title: "Dentist",
  startDate: "2024-03-15T10:00:00",
  endDate: "2024-03-15T11:00:00",
  color: "#3b82f6",
  allDay: false,
};

const savedCard = {
  id: "entry-1",
  eventId: "event-9",
  cardId: "base1-4",
  cardName: "Charizard",
  quantity: 2,
  createdAt: "2024-03-15T00:00:00Z",
};

const savedCountdown = {
  id: "cd-1",
  title: "Trip",
  targetDate: "2024-06-01",
  color: "#ef4444",
  createdAt: "2024-03-15T00:00:00Z",
};

describe("event helpers", () => {
  it("createEvent posts the event as JSON and returns the saved one", async () => {
    const { id: _id, ...draft } = savedEvent;
    const sent = answer("post", "/api/calendar/events", () =>
      HttpResponse.json({ event: savedEvent }),
    );

    await expect(createEvent(draft)).resolves.toEqual(savedEvent);
    expect(sent).toHaveLength(1);
    expect(sent[0].body).toEqual(draft);
    expect(sent[0].contentType).toBe("application/json");
  });

  it("createEvent throws when the server refuses", async () => {
    answer("post", "/api/calendar/events", () => HttpResponse.json({}, { status: 500 }));
    const { id: _id, ...draft } = savedEvent;

    await expect(createEvent(draft)).rejects.toThrow("Failed to create event");
  });

  it("createEvent passes on the reason the server gives", async () => {
    answer("post", "/api/calendar/events", () =>
      HttpResponse.json({ error: "You can only view this calendar" }, { status: 403 }),
    );
    const { id: _id, ...draft } = savedEvent;

    await expect(createEvent(draft)).rejects.toThrow("You can only view this calendar");
  });

  it("createEvent rejects an answer that isn't an event", async () => {
    answer("post", "/api/calendar/events", () => HttpResponse.json({ event: { id: 7 } }));
    const { id: _id, ...draft } = savedEvent;

    await expect(createEvent(draft)).rejects.toThrow();
  });

  it("updateEvent puts only the changed fields at the event's own path", async () => {
    const sent = answer("put", "/api/calendar/events/event-9", () =>
      HttpResponse.json({ event: { ...savedEvent, title: "Dentist (moved)" } }),
    );

    const updated = await updateEvent("event-9", { title: "Dentist (moved)" });

    expect(updated.title).toBe("Dentist (moved)");
    expect(sent[0].body).toEqual({ title: "Dentist (moved)" });
  });

  it("updateEvent throws when the server refuses", async () => {
    answer("put", "/api/calendar/events/event-9", () => HttpResponse.json({}, { status: 404 }));

    await expect(updateEvent("event-9", { title: "x" })).rejects.toThrow(
      "Failed to update event",
    );
  });

  it("deleteEvent sends a DELETE to the event's path", async () => {
    const sent = answer("delete", "/api/calendar/events/event-9", () =>
      new HttpResponse(null, { status: 204 }),
    );

    await expect(deleteEvent("event-9")).resolves.toBeUndefined();
    expect(sent).toHaveLength(1);
  });

  it("deleteEvent throws when the server refuses", async () => {
    answer("delete", "/api/calendar/events/event-9", () => HttpResponse.json({}, { status: 403 }));

    await expect(deleteEvent("event-9")).rejects.toThrow("Failed to delete event");
  });
});

describe("event card helpers", () => {
  it("addCardToEvent posts the card under the event and returns the saved entry", async () => {
    const sent = answer("post", "/api/calendar/events/event-9/cards", () =>
      HttpResponse.json({ card: savedCard }),
    );

    const card = await addCardToEvent("event-9", {
      cardId: "base1-4",
      cardName: "Charizard",
      quantity: 2,
    });

    expect(card).toEqual(savedCard);
    expect(sent[0].body).toEqual({ cardId: "base1-4", cardName: "Charizard", quantity: 2 });
  });

  it("addCardToEvent throws when the server refuses", async () => {
    answer("post", "/api/calendar/events/event-9/cards", () => HttpResponse.json({}, { status: 500 }));

    await expect(
      addCardToEvent("event-9", { cardId: "base1-4", cardName: "Charizard" }),
    ).rejects.toThrow("Failed to add card to event");
  });

  it("updateEventCard puts the new quantity and notes at the entry's path", async () => {
    const sent = answer("put", "/api/calendar/events/event-9/cards/entry-1", () =>
      HttpResponse.json({ card: { ...savedCard, quantity: 3 } }),
    );

    const card = await updateEventCard("event-9", "entry-1", { quantity: 3, notes: "foil" });

    expect(card.quantity).toBe(3);
    expect(sent[0].body).toEqual({ quantity: 3, notes: "foil" });
  });

  it("updateEventCard throws when the server refuses", async () => {
    answer("put", "/api/calendar/events/event-9/cards/entry-1", () =>
      HttpResponse.json({}, { status: 500 }),
    );

    await expect(updateEventCard("event-9", "entry-1", { quantity: 3 })).rejects.toThrow(
      "Failed to update card",
    );
  });

  it("removeCardFromEvent sends a DELETE to the entry's path", async () => {
    const sent = answer("delete", "/api/calendar/events/event-9/cards/entry-1", () =>
      new HttpResponse(null, { status: 204 }),
    );

    await expect(removeCardFromEvent("event-9", "entry-1")).resolves.toBeUndefined();
    expect(sent).toHaveLength(1);
  });

  it("removeCardFromEvent throws when the server refuses", async () => {
    answer("delete", "/api/calendar/events/event-9/cards/entry-1", () =>
      HttpResponse.json({}, { status: 500 }),
    );

    await expect(removeCardFromEvent("event-9", "entry-1")).rejects.toThrow(
      "Failed to remove card from event",
    );
  });
});

describe("countdown helpers", () => {
  it("fetchCountdowns reads the first page without a cursor", async () => {
    const sent = answer("get", "/api/calendar/countdowns", () =>
      HttpResponse.json({ countdowns: [savedCountdown], nextCursor: "abc" }),
    );

    const page = await fetchCountdowns();

    expect(page).toEqual({ countdowns: [savedCountdown], nextCursor: "abc" });
    expect(new URL(sent[0].url).search).toBe("");
  });

  it("fetchCountdowns passes the cursor along, encoded", async () => {
    const sent = answer("get", "/api/calendar/countdowns", () =>
      HttpResponse.json({ countdowns: [], nextCursor: null }),
    );

    await fetchCountdowns("a b&c=d");

    expect(new URL(sent[0].url).searchParams.get("cursor")).toBe("a b&c=d");
  });

  it("fetchCountdowns throws when the server refuses", async () => {
    answer("get", "/api/calendar/countdowns", () => HttpResponse.json({}, { status: 500 }));

    await expect(fetchCountdowns()).rejects.toThrow("Failed to fetch countdowns");
  });

  it("fetchCountdowns rejects an answer that isn't a page of countdowns", async () => {
    answer("get", "/api/calendar/countdowns", () =>
      HttpResponse.json({ countdowns: [{ id: 1 }], nextCursor: null }),
    );

    await expect(fetchCountdowns()).rejects.toThrow();
  });

  it("createCountdown posts the fields and returns the saved countdown", async () => {
    const { id: _id, createdAt: _createdAt, ...draft } = savedCountdown;
    const sent = answer("post", "/api/calendar/countdowns", () =>
      HttpResponse.json({ countdown: savedCountdown }),
    );

    await expect(createCountdown(draft)).resolves.toEqual(savedCountdown);
    expect(sent[0].body).toEqual(draft);
  });

  it("createCountdown throws when the server refuses", async () => {
    answer("post", "/api/calendar/countdowns", () => HttpResponse.json({}, { status: 500 }));
    const { id: _id, createdAt: _createdAt, ...draft } = savedCountdown;

    await expect(createCountdown(draft)).rejects.toThrow("Failed to create countdown");
  });

  it("updateCountdown puts only the changed fields at the countdown's path", async () => {
    const sent = answer("put", "/api/calendar/countdowns/cd-1", () =>
      HttpResponse.json({ countdown: { ...savedCountdown, title: "Holiday" } }),
    );

    const updated = await updateCountdown("cd-1", { title: "Holiday" });

    expect(updated.title).toBe("Holiday");
    expect(sent[0].body).toEqual({ title: "Holiday" });
  });

  it("updateCountdown throws when the server refuses", async () => {
    answer("put", "/api/calendar/countdowns/cd-1", () => HttpResponse.json({}, { status: 404 }));

    await expect(updateCountdown("cd-1", { title: "x" })).rejects.toThrow(
      "Failed to update countdown",
    );
  });

  it("deleteCountdown sends a DELETE to the countdown's path", async () => {
    const sent = answer("delete", "/api/calendar/countdowns/cd-1", () =>
      new HttpResponse(null, { status: 204 }),
    );

    await expect(deleteCountdown("cd-1")).resolves.toBeUndefined();
    expect(sent).toHaveLength(1);
  });

  it("deleteCountdown throws when the server refuses", async () => {
    answer("delete", "/api/calendar/countdowns/cd-1", () => HttpResponse.json({}, { status: 500 }));

    await expect(deleteCountdown("cd-1")).rejects.toThrow("Failed to delete countdown");
  });
});

/**
 * Each helper has its own `throw`, so reverting any one of them to a fixed
 * string has to fail a test, not just the two that were checked by hand.
 */
describe("every calendar helper passes on the server's reason", () => {
  const { id: _eventId, ...eventDraft } = savedEvent;
  const { id: _countdownId, createdAt: _createdAt, ...countdownDraft } = savedCountdown;

  it.each([
    ["createEvent", () => createEvent(eventDraft)],
    ["updateEvent", () => updateEvent("event-9", { title: "x" })],
    ["deleteEvent", () => deleteEvent("event-9")],
    ["addCardToEvent", () => addCardToEvent("event-9", { cardId: "base1-4", cardName: "Charizard" })],
    ["updateEventCard", () => updateEventCard("event-9", "entry-1", { quantity: 2 })],
    ["removeCardFromEvent", () => removeCardFromEvent("event-9", "entry-1")],
    ["fetchCountdowns", () => fetchCountdowns()],
    ["createCountdown", () => createCountdown(countdownDraft)],
    ["updateCountdown", () => updateCountdown("cd-1", { title: "x" })],
    ["deleteCountdown", () => deleteCountdown("cd-1")],
  ])("%s", async (_name, call) => {
    server.use(
      http.all("/api/calendar/*", () =>
        HttpResponse.json({ error: "You can only view this calendar" }, { status: 403 }),
      ),
    );

    await expect(call()).rejects.toThrow("You can only view this calendar");
  });
});
