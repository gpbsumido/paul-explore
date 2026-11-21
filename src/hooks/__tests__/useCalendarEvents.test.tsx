import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { useCalendarEvents } from "../useCalendarEvents";
import type { CalendarEvent } from "@/types/calendar";
import type { ReactNode } from "react";
import { CONNECTION_ERROR_MESSAGE } from "@/lib/userFacingError";

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
    expect(result.current.loading).toBe(false);
  });

  it("asks for the window it was given, and for one calendar only when told to", async () => {
    const urls: URL[] = [];
    server.use(
      http.get("/api/calendar/events", ({ request }) => {
        urls.push(new URL(request.url));
        return HttpResponse.json({ events: [] });
      }),
    );
    const wrapper = makeWrapper();

    const all = renderHook(() => useCalendarEvents(RANGE), { wrapper });
    await waitFor(() => expect(all.result.current.loading).toBe(false));
    const one = renderHook(
      () => useCalendarEvents({ ...RANGE, calendarId: "cal-7" }),
      { wrapper },
    );
    await waitFor(() => expect(one.result.current.loading).toBe(false));

    expect(urls[0].searchParams.get("start")).toBe("2024-03-01");
    expect(urls[0].searchParams.get("end")).toBe("2024-03-31");
    expect(urls[0].searchParams.has("calendarId")).toBe(false);
    expect(urls[1].searchParams.get("calendarId")).toBe("cal-7");
  });

  it("shows the failure's own message when the API answers with an error status", async () => {
    server.use(
      http.get("/api/calendar/events", () =>
        HttpResponse.json({ events: [] }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useCalendarEvents(RANGE), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toBe("Failed to fetch events");
  });

  it("reports a response that does not match the event schema as an error, not as no events", async () => {
    server.use(
      http.get("/api/calendar/events", () =>
        HttpResponse.json({ events: [{ id: 1 }] }),
      ),
    );

    const { result } = renderHook(() => useCalendarEvents(RANGE), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.events).toEqual([]);
  });

  it("says it couldn't reach the server when the fetch fails", async () => {
    server.use(http.get("/api/calendar/events", () => HttpResponse.error()));

    const { result } = renderHook(() => useCalendarEvents(RANGE), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toBe(CONNECTION_ERROR_MESSAGE);
  });
});

// ---------------------------------------------------------------------------
// Writes: optimistic update, rollback, and what the server says afterwards
// ---------------------------------------------------------------------------

/**
 * Every GET after the first one hangs, so whatever the cache shows after a
 * write is the hook's own doing and not a refetch quietly putting the server's
 * answer back. Without this a rollback and a refetch look identical.
 */
function serveOnceThenHang(events: CalendarEvent[]) {
  let calls = 0;
  server.use(
    http.get("/api/calendar/events", async () => {
      calls += 1;
      if (calls > 1) await new Promise(() => {});
      return HttpResponse.json({ events });
    }),
  );
}

/**
 * Lets React Query's batched notifications reach the hook. It tells React about
 * cache changes on a timer, so a rollback that has already happened can still
 * be missing from the hook's last render when the write's promise settles. A
 * rollback check made before this reads the stale render, which looks right
 * whether or not anything was rolled back.
 */
const letQueryNotificationsLand = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });

/** A promise a test can settle by hand, to hold a request in flight. */
function gate() {
  let open: () => void = () => {};
  const opened = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { opened, open };
}

const NEW_EVENT: Omit<CalendarEvent, "id"> = {
  title: "New Event",
  startDate: "2024-03-20T09:00:00",
  endDate: "2024-03-20T10:00:00",
  color: "#10b981",
  allDay: false,
};

describe("useCalendarEvents — createEvent", () => {
  it("shows the new event while the request is still in flight, and says it is creating", async () => {
    const existing = makeEvent({ title: "Existing" });
    const release = gate();
    server.use(
      http.get("/api/calendar/events", () => HttpResponse.json({ events: [existing] })),
      http.post("/api/calendar/events", async ({ request }) => {
        await release.opened;
        const body = (await request.json()) as Omit<CalendarEvent, "id">;
        return HttpResponse.json({ event: { ...body, id: "server-id" } });
      }),
    );
    const { result } = renderHook(() => useCalendarEvents(RANGE), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let pending: Promise<CalendarEvent> | undefined;
    act(() => {
      pending = result.current.createEvent(NEW_EVENT);
    });

    // The server's list never contains it, so only the optimistic write can
    // have put it on screen.
    await waitFor(() =>
      expect(result.current.events.map((e) => e.title)).toEqual([
        "Existing",
        "New Event",
      ]),
    );
    expect(result.current.isCreating).toBe(true);

    release.open();
    await act(async () => {
      await pending;
    });
    await waitFor(() => expect(result.current.isCreating).toBe(false));
  });

  it("resolves with the event the server made, id included", async () => {
    server.use(
      http.get("/api/calendar/events", () => HttpResponse.json({ events: [] })),
      http.post("/api/calendar/events", async ({ request }) => {
        const body = (await request.json()) as Omit<CalendarEvent, "id">;
        return HttpResponse.json({ event: { ...body, id: "server-id" } });
      }),
    );
    const { result } = renderHook(() => useCalendarEvents(RANGE), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let created: CalendarEvent | undefined;
    await act(async () => {
      created = await result.current.createEvent(NEW_EVENT);
    });

    expect(created).toMatchObject({ id: "server-id", title: "New Event" });
  });

  it("takes the optimistic event back out when the create fails", async () => {
    const existing = makeEvent({ title: "Existing" });
    serveOnceThenHang([existing]);
    server.use(
      http.post("/api/calendar/events", () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useCalendarEvents(RANGE), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.createEvent(NEW_EVENT)).rejects.toThrow();
    });

    await letQueryNotificationsLand();
    expect(result.current.events.map((e) => e.title)).toEqual(["Existing"]);
  });
});

describe("useCalendarEvents — a write before the first fetch lands", () => {
  it("keeps the seeded events on screen when one is created straight away", async () => {
    const existing = makeEvent({ title: "Existing" });
    const release = gate();
    server.use(
      http.get("/api/calendar/events", () => HttpResponse.json({ events: [existing] })),
      http.post("/api/calendar/events", async () => {
        await release.opened;
        return HttpResponse.json({ event: { ...NEW_EVENT, id: "server-id" } });
      }),
    );
    const { result } = renderHook(
      () => useCalendarEvents({ ...RANGE, initialEvents: [existing] }),
      { wrapper: makeWrapper() },
    );

    let pending: Promise<CalendarEvent> | undefined;
    act(() => {
      pending = result.current.createEvent(NEW_EVENT);
    });

    await waitFor(() =>
      expect(result.current.events.map((e) => e.title)).toEqual([
        "Existing",
        "New Event",
      ]),
    );
    release.open();
    await act(async () => {
      await pending;
    });
  });
});

describe("useCalendarEvents — updateEvent", () => {
  it("shows the updated title while the request is still in flight", async () => {
    const event = makeEvent({ id: "evt-1", title: "Before" });
    const release = gate();
    server.use(
      // The server's list keeps saying "Before", so "After" can only come
      // from the optimistic write.
      http.get("/api/calendar/events", () => HttpResponse.json({ events: [event] })),
      http.put("/api/calendar/events/:id", async ({ request }) => {
        await release.opened;
        const fields = (await request.json()) as Partial<CalendarEvent>;
        return HttpResponse.json({ event: { ...event, ...fields } });
      }),
    );
    const { result } = renderHook(() => useCalendarEvents(RANGE), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let pending: Promise<CalendarEvent> | undefined;
    act(() => {
      pending = result.current.updateEvent("evt-1", { title: "After" });
    });

    await waitFor(() =>
      expect(result.current.events.find((e) => e.id === "evt-1")?.title).toBe("After"),
    );
    expect(result.current.isUpdating).toBe(true);

    release.open();
    await act(async () => {
      await pending;
    });
  });

  it("only changes the event it was asked about", async () => {
    const target = makeEvent({ id: "evt-a", title: "Target" });
    const other = makeEvent({ id: "evt-b", title: "Other" });
    const release = gate();
    server.use(
      http.get("/api/calendar/events", () => HttpResponse.json({ events: [target, other] })),
      http.put("/api/calendar/events/:id", async () => {
        await release.opened;
        return HttpResponse.json({ event: { ...target, title: "Renamed" } });
      }),
    );
    const { result } = renderHook(() => useCalendarEvents(RANGE), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let pending: Promise<CalendarEvent> | undefined;
    act(() => {
      pending = result.current.updateEvent("evt-a", { title: "Renamed" });
    });

    await waitFor(() =>
      expect(result.current.events.map((e) => e.title)).toEqual(["Renamed", "Other"]),
    );
    release.open();
    await act(async () => {
      await pending;
    });
  });

  it("puts the original back when the update fails", async () => {
    const event = makeEvent({ id: "evt-rollback", title: "Original" });
    serveOnceThenHang([event]);
    server.use(
      http.put("/api/calendar/events/:id", () =>
        HttpResponse.json({ error: "fail" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useCalendarEvents(RANGE), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(
        result.current.updateEvent("evt-rollback", { title: "Changed" }),
      ).rejects.toThrow();
    });

    await letQueryNotificationsLand();
    expect(result.current.events.find((e) => e.id === "evt-rollback")?.title).toBe(
      "Original",
    );
  });
});

describe("useCalendarEvents — deleteEvent", () => {
  it("removes only that event while the request is still in flight", async () => {
    const doomed = makeEvent({ id: "evt-del", title: "To Delete" });
    const kept = makeEvent({ id: "evt-keep", title: "Keep" });
    const release = gate();
    server.use(
      http.get("/api/calendar/events", () => HttpResponse.json({ events: [doomed, kept] })),
      http.delete("/api/calendar/events/:id", async () => {
        await release.opened;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = renderHook(() => useCalendarEvents(RANGE), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.deleteEvent("evt-del");
    });

    await waitFor(() =>
      expect(result.current.events.map((e) => e.id)).toEqual(["evt-keep"]),
    );
    expect(result.current.isDeleting).toBe(true);

    release.open();
    await act(async () => {
      await pending;
    });
  });

  it("brings the event back when the delete fails", async () => {
    const event = makeEvent({ id: "evt-del-fail", title: "Should Stay" });
    serveOnceThenHang([event]);
    server.use(
      http.delete("/api/calendar/events/:id", () =>
        HttpResponse.json({ error: "fail" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useCalendarEvents(RANGE), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.deleteEvent("evt-del-fail")).rejects.toThrow();
    });

    await letQueryNotificationsLand();
    expect(result.current.events.map((e) => e.id)).toEqual(["evt-del-fail"]);
  });
});

describe("useCalendarEvents — after a write settles", () => {
  it.each([
    ["create", "post", "/api/calendar/events", (c: ReturnType<typeof useCalendarEvents>) => c.createEvent(NEW_EVENT)],
    ["update", "put", "/api/calendar/events/:id", (c: ReturnType<typeof useCalendarEvents>) => c.updateEvent("evt-1", { title: "x" })],
    ["delete", "delete", "/api/calendar/events/:id", (c: ReturnType<typeof useCalendarEvents>) => c.deleteEvent("evt-1")],
  ] as const)(
    "reads the window again after a failed %s so the cache agrees with the server",
    async (_name, method, path, write) => {
      let gets = 0;
      server.use(
        http.get("/api/calendar/events", () => {
          gets += 1;
          return HttpResponse.json({ events: [] });
        }),
        http[method](path, () => HttpResponse.json({ error: "no" }, { status: 500 })),
      );
      const { result } = renderHook(() => useCalendarEvents(RANGE), {
        wrapper: makeWrapper(),
      });
      await waitFor(() => expect(gets).toBe(1));

      await act(async () => {
        await expect(write(result.current)).rejects.toThrow();
      });

      await waitFor(() => expect(gets).toBe(2));
    },
  );
});
