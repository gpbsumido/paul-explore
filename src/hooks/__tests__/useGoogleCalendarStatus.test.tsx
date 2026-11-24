import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import { useGoogleCalendarStatus } from "../useGoogleCalendarStatus";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function statusAnswers(response: () => Response) {
  server.use(http.get("/api/google/auth/status", response));
  return renderHook(() => useGoogleCalendarStatus(), { wrapper });
}

/**
 * A failed status check used to come back as "not connected". The calendar
 * modal then told a connected user to go connect Google in Settings, and the
 * header hid the sync control, all because the backend had a bad minute.
 */
describe("useGoogleCalendarStatus", () => {
  it("reports a connected account", async () => {
    const { result } = statusAnswers(() => HttpResponse.json({ connected: true }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ connected: true, statusUnavailable: false });
  });

  it("treats a signed-out visitor as not connected", async () => {
    const { result } = statusAnswers(
      () => new HttpResponse(null, { status: 401 }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ connected: false, statusUnavailable: false });
  });

  it("says the status is unknown when the check fails, rather than not connected", async () => {
    const { result } = statusAnswers(() =>
      HttpResponse.json({ error: "Failed to fetch status" }, { status: 500 }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ connected: false, statusUnavailable: true });
  });

  it("says the status is unknown on a failed response even when the body claims connected", async () => {
    const { result } = statusAnswers(() =>
      HttpResponse.json({ connected: true }, { status: 503 }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ connected: false, statusUnavailable: true });
  });

  it("says the status is unknown when the answer is unreadable", async () => {
    const { result } = statusAnswers(() => HttpResponse.json({ connected: "yes" }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ connected: false, statusUnavailable: true });
  });
});
