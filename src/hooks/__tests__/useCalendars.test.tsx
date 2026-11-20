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

describe("useCalendarMembers", () => {
  it("says the members failed to load rather than looking empty", async () => {
    server.use(http.get("/api/calendar/calendars/cal-1/members", failing));
    const { result } = renderHook(() => useCalendarMembers("cal-1"), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
