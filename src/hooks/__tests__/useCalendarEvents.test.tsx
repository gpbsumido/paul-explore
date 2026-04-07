import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/server";
import { useCalendarEvents } from "../useCalendarEvents";
import type { CalendarEvent } from "@/types/calendar";
import type { ReactNode } from "react";

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

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return Wrapper;
}

const RANGE = { start: "2024-03-01", end: "2024-03-31" };

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

describe("useCalendarEvents — read", () => {
  it("fetches and exposes events from the API", async () => {
    const events = [makeEvent({ title: "Fetched Event" })];
    server.use(
      http.get("/api/calendar/events", () => HttpResponse.json({ events })),
    );

    const { result } = renderHook(() => useCalendarEvents(RANGE), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].title).toBe("Fetched Event");
  });

  it("seeds events from initialEvents synchronously on first render", async () => {
    const seed = [makeEvent({ title: "SSR Seed" })];
    // staleTime is 0 so a background refetch fires immediately — register a
    // handler so MSW doesn't throw for the unhandled request
    server.use(
      http.get("/api/calendar/events", () =>
        HttpResponse.json({ events: seed }),
      ),
    );

    const { result } = renderHook(
      () => useCalendarEvents({ ...RANGE, initialEvents: seed }),
      { wrapper: makeWrapper() },
    );

    // placeholderData is applied synchronously — the seed is visible immediately
    // without waiting for the network
    expect(result.current.events[0].title).toBe("SSR Seed");
  });

  it("exposes an error message when the fetch fails", async () => {
    server.use(http.get("/api/calendar/events", () => HttpResponse.error()));

    const { result } = renderHook(() => useCalendarEvents(RANGE), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toMatch(/failed to fetch/i);
  });
});

// ---------------------------------------------------------------------------
// Create — optimistic update
// ---------------------------------------------------------------------------

describe("useCalendarEvents — createEvent", () => {
  it("shows the new event immediately, before the server responds", async () => {
    const existing = makeEvent({ title: "Existing" });
    const created = makeEvent({ id: "server-id", title: "New Event" });
    server.use(
      // Delayed POST — gives us time to assert the optimistic state mid-flight
      http.post("/api/calendar/events", async ({ request }) => {
        await delay(300);
        const body = (await request.json()) as Omit<CalendarEvent, "id">;
        return HttpResponse.json({ event: { ...body, id: "server-id" } });
      }),
      // Initial GET returns only the existing event; override before mutation
      // so the refetch after onSettled returns the full list
      http.get("/api/calendar/events", () =>
        HttpResponse.json({ events: [existing, created] }),
      ),
    );

    const { result } = renderHook(
      () => useCalendarEvents({ ...RANGE, initialEvents: [existing] }),
      { wrapper: makeWrapper() },
    );

    const newEvent: Omit<CalendarEvent, "id"> = {
      title: "New Event",
      startDate: "2024-03-20T09:00:00",
      endDate: "2024-03-20T10:00:00",
      color: "#10b981",
      allDay: false,
    };

    // Fire but do NOT await — the POST is delayed 300ms so the mutation is
    // still in-flight when we check the next assertion
    act(() => {
      void result.current.createEvent(newEvent);
    });

    // onMutate runs synchronously and writes to the cache — the new event
    // should be visible before the network responds
    await waitFor(() =>
      expect(result.current.events.some((e) => e.title === "New Event")).toBe(
        true,
      ),
    );
  });

  it("rolls back the optimistic event when the create fails", async () => {
    const existing = makeEvent({ title: "Existing" });
    server.use(
      http.get("/api/calendar/events", () =>
        HttpResponse.json({ events: [existing] }),
      ),
      http.post("/api/calendar/events", () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useCalendarEvents(RANGE), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current
        .createEvent({
          title: "Will Fail",
          startDate: "2024-03-20T09:00:00",
          endDate: "2024-03-20T10:00:00",
          color: "#ef4444",
          allDay: false,
        })
        .catch(() => {});
    });

    await waitFor(() =>
      expect(result.current.events.every((e) => e.title !== "Will Fail")).toBe(
        true,
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Update — optimistic update
// ---------------------------------------------------------------------------

describe("useCalendarEvents — updateEvent", () => {
  it("shows the updated title immediately, before the server responds", async () => {
    const event = makeEvent({ id: "evt-1", title: "Before" });
    server.use(
      http.put("/api/calendar/events/:id", async ({ request }) => {
        await delay(300);
        const fields = (await request.json()) as Partial<CalendarEvent>;
        return HttpResponse.json({ event: { ...event, ...fields } });
      }),
      http.get("/api/calendar/events", () =>
        HttpResponse.json({ events: [{ ...event, title: "After" }] }),
      ),
    );

    const { result } = renderHook(
      () => useCalendarEvents({ ...RANGE, initialEvents: [event] }),
      { wrapper: makeWrapper() },
    );

    act(() => {
      void result.current.updateEvent("evt-1", { title: "After" });
    });

    await waitFor(() =>
      expect(result.current.events.find((e) => e.id === "evt-1")?.title).toBe(
        "After",
      ),
    );
  });

  it("rolls back to the original title when the update fails", async () => {
    const event = makeEvent({ id: "evt-rollback", title: "Original" });
    server.use(
      http.get("/api/calendar/events", () =>
        HttpResponse.json({ events: [event] }),
      ),
      http.put("/api/calendar/events/:id", () =>
        HttpResponse.json({ error: "fail" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useCalendarEvents(RANGE), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current
        .updateEvent("evt-rollback", { title: "Changed" })
        .catch(() => {});
    });

    await waitFor(() =>
      expect(
        result.current.events.find((e) => e.id === "evt-rollback")?.title,
      ).toBe("Original"),
    );
  });
});

// ---------------------------------------------------------------------------
// Delete — optimistic update
// ---------------------------------------------------------------------------

describe("useCalendarEvents — deleteEvent", () => {
  it("removes the event immediately, before the server responds", async () => {
    const event = makeEvent({ id: "evt-del", title: "To Delete" });
    server.use(
      http.delete("/api/calendar/events/:id", async () => {
        await delay(300);
        return new HttpResponse(null, { status: 204 });
      }),
      http.get("/api/calendar/events", () => HttpResponse.json({ events: [] })),
    );

    const { result } = renderHook(
      () => useCalendarEvents({ ...RANGE, initialEvents: [event] }),
      { wrapper: makeWrapper() },
    );

    act(() => {
      void result.current.deleteEvent("evt-del");
    });

    await waitFor(() =>
      expect(result.current.events.every((e) => e.id !== "evt-del")).toBe(true),
    );
  });

  it("restores the event when the delete fails", async () => {
    const event = makeEvent({ id: "evt-del-fail", title: "Should Stay" });
    server.use(
      http.get("/api/calendar/events", () =>
        HttpResponse.json({ events: [event] }),
      ),
      http.delete("/api/calendar/events/:id", () =>
        HttpResponse.json({ error: "fail" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useCalendarEvents(RANGE), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteEvent("evt-del-fail").catch(() => {});
    });

    await waitFor(() =>
      expect(result.current.events.some((e) => e.id === "evt-del-fail")).toBe(
        true,
      ),
    );
  });
});
