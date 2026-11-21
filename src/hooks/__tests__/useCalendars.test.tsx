import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import { useCalendarMembers, useCalendars } from "../useCalendars";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const failing = () => HttpResponse.json({ error: "boom" }, { status: 500 });

/**
 * Both hooks used to hand back `data ?? []` and nothing else, so a failed load
 * rendered exactly like an account with no calendars, or a calendar nobody
 * else can see.
 */
describe("useCalendars", () => {
  it("says the calendars failed to load rather than looking empty", async () => {
    server.use(http.get("/api/calendar/calendars", failing));
    const { result } = renderHook(() => useCalendars(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.calendars).toEqual([]);
  });
});

describe("useCalendars — a good read", () => {
  it("hands back the calendars the API sent, with their roles", async () => {
    server.use(
      http.get("/api/calendar/calendars", () =>
        HttpResponse.json({
          calendars: [
            { id: "cal-1", name: "Personal", color: "#3b82f6", syncMode: "none", role: "owner" },
            { id: "cal-2", name: "Shared", color: "#ef4444", syncMode: "none", role: "viewer" },
          ],
        }),
      ),
    );
    const { result } = renderHook(() => useCalendars(), { wrapper });

    await waitFor(() => expect(result.current.calendars).toHaveLength(2));
    expect(result.current.calendars.map((calendar) => calendar.role)).toEqual([
      "owner",
      "viewer",
    ]);
    expect(result.current.isError).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("is loading, with no calendars and no error, until the answer lands", () => {
    server.use(http.get("/api/calendar/calendars", () => new Promise(() => {})));
    const { result } = renderHook(() => useCalendars(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.calendars).toEqual([]);
  });

  it("calls a response that does not match the schema a failure, not an empty list", async () => {
    server.use(
      http.get("/api/calendar/calendars", () =>
        HttpResponse.json({ calendars: [{ id: 7 }] }),
      ),
    );
    const { result } = renderHook(() => useCalendars(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.calendars).toEqual([]);
  });
});

describe("useCalendarMembers", () => {
  it("returns the members the API sent", async () => {
    server.use(
      http.get("/api/calendar/calendars/cal-1/members", () =>
        HttpResponse.json({
          members: [
            { id: null, userSub: "auth0|owner", email: "me@example.com", role: "owner" },
            { id: "m-1", userSub: "auth0|abc", email: "friend@example.com", role: "viewer" },
          ],
        }),
      ),
    );
    const { result } = renderHook(() => useCalendarMembers("cal-1"), { wrapper });

    await waitFor(() => expect(result.current.members).toHaveLength(2));
    expect(result.current.members[0].email).toBe("me@example.com");
  });

  it("does not ask the API anything without a calendar to ask about", async () => {
    let asked = false;
    server.use(
      http.get("/api/calendar/calendars/:id/members", () => {
        asked = true;
        return HttpResponse.json({ members: [] });
      }),
    );
    const { result } = renderHook(() => useCalendarMembers(null), { wrapper });
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(asked).toBe(false);
    expect(result.current.members).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("says the members failed to load rather than looking empty", async () => {
    server.use(http.get("/api/calendar/calendars/cal-1/members", failing));
    const { result } = renderHook(() => useCalendarMembers("cal-1"), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
