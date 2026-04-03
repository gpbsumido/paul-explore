import { describe, it, expect } from "vitest";
import {
  eventsForDay,
  allDayEventsForDay,
  spanningEventsForDay,
  singleDayTimedEventsForDay,
  layoutDayEvents,
  formatHeading,
  formatHour,
} from "../calendar";
import type { CalendarEvent } from "@/types/calendar";

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: crypto.randomUUID(),
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

  it("lists all-day events before multi-day timed events", () => {
    const timed = makeEvent({
      startDate: "2024-03-15T09:00:00",
      endDate: "2024-03-16T09:00:00",
    });
    const allDay = makeAllDay("2024-03-15", "2024-03-15");
    const result = spanningEventsForDay([timed, allDay], MARCH_15);
    expect(result.indexOf(allDay)).toBeLessThan(result.indexOf(timed));
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
    expect(layouts[0].totalColumns).toBe(1);
    expect(layouts[1].totalColumns).toBe(1);
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
    expect(layout.heightPx).toBeGreaterThanOrEqual(20);
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
    expect(formatHeading(date, "week")).toMatch(/Week of Mar 10, 2024/);
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
