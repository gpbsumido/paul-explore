import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CalendarModal from "@/components/calendar/CalendarModal";

function renderNewCalendarModal() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <CalendarModal onSave={vi.fn()} onClose={vi.fn()} />
    </QueryClientProvider>,
  );
}

/** The two-way option's wrapper carries the reason it's disabled as a title. */
const twoWayReason = () =>
  screen.getByRole("radio", { name: "Two-way" }).parentElement?.getAttribute("title");

beforeEach(() => {
  server.use(
    http.get("/api/calendar/calendars", () => HttpResponse.json({ calendars: [] })),
  );
});

describe("CalendarModal two-way sync", () => {
  it("asks for a Google connection when there isn't one", async () => {
    server.use(
      http.get("/api/google/auth/status", () => HttpResponse.json({ connected: false })),
    );
    renderNewCalendarModal();

    await waitFor(() => expect(twoWayReason()).toMatch(/connect google calendar/i));
    expect(screen.getByRole("radio", { name: "Two-way" })).toBeDisabled();
  });

  it("doesn't blame the connection when the status check failed", async () => {
    server.use(
      http.get("/api/google/auth/status", () =>
        HttpResponse.json({ error: "Failed to fetch status" }, { status: 500 }),
      ),
    );
    renderNewCalendarModal();

    await waitFor(() => expect(twoWayReason()).toMatch(/couldn.t check/i));
    expect(screen.getByRole("radio", { name: "Two-way" })).toBeDisabled();
  });
});
