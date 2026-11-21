import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { useCalendars } from "../useCalendars";
import type { ReactNode } from "react";

/**
 * What the API answers a calendar create or update with: the row straight from
 * the database, which has no role column. Only the owner can make either call.
 */
const writtenCalendar = {
  id: "cal-1",
  name: "Personal",
  color: "#3b82f6",
  syncMode: "none",
};

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

/**
 * A create that succeeded used to throw: the response failed a schema that
 * required a role the API never sent, so the person saw "Couldn't save" for a
 * calendar that existed, and a retry made a second one.
 */
describe("useCalendars — writes", () => {
  it("treats a created calendar with no role as the caller's own", async () => {
    server.use(
      http.get("/api/calendar/calendars", () => HttpResponse.json({ calendars: [] })),
      http.post("/api/calendar/calendars", () =>
        HttpResponse.json({ calendar: writtenCalendar }, { status: 201 }),
      ),
    );
    const { result } = renderHook(() => useCalendars(), { wrapper: makeWrapper() });

    let created: Awaited<ReturnType<typeof result.current.createCalendar>> | undefined;
    await act(async () => {
      created = await result.current.createCalendar({
        name: "Personal",
        color: "#3b82f6",
        syncMode: "none",
      });
    });

    expect(created).toMatchObject({ id: "cal-1", role: "owner" });
  });

  it("treats an updated calendar with no role as the caller's own", async () => {
    server.use(
      http.get("/api/calendar/calendars", () => HttpResponse.json({ calendars: [] })),
      http.put("/api/calendar/calendars/cal-1", () =>
        HttpResponse.json({ calendar: { ...writtenCalendar, name: "Renamed" } }),
      ),
    );
    const { result } = renderHook(() => useCalendars(), { wrapper: makeWrapper() });

    let updated: Awaited<ReturnType<typeof result.current.updateCalendar>> | undefined;
    await act(async () => {
      updated = await result.current.updateCalendar("cal-1", { name: "Renamed" });
    });

    expect(updated).toMatchObject({ name: "Renamed", role: "owner" });
  });

  it("keeps the role when the API does send one", async () => {
    server.use(
      http.get("/api/calendar/calendars", () => HttpResponse.json({ calendars: [] })),
      http.put("/api/calendar/calendars/cal-1", () =>
        HttpResponse.json({ calendar: { ...writtenCalendar, role: "owner" } }),
      ),
    );
    const { result } = renderHook(() => useCalendars(), { wrapper: makeWrapper() });

    let updated: Awaited<ReturnType<typeof result.current.updateCalendar>> | undefined;
    await act(async () => {
      updated = await result.current.updateCalendar("cal-1", { name: "Personal" });
    });

    expect(updated?.role).toBe("owner");
  });
});
