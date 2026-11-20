import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CalendarModal from "@/components/calendar/CalendarModal";
import type { Calendar } from "@/types/calendar";

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

const linked: Calendar = {
  id: "cal-1",
  name: "Shifts",
  color: "#3b82f6",
  syncMode: "two_way",
  googleCalId: "g-1",
  googleCalName: "Shifts (Google)",
  role: "owner",
};

function renderEditModal() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <CalendarModal calendar={linked} onSave={vi.fn()} onClose={vi.fn()} />
    </QueryClientProvider>,
  );
}

const failing = () => HttpResponse.json({ error: "boom" }, { status: 500 });

describe("CalendarModal failures", () => {
  beforeEach(() => {
    server.use(
      http.get("/api/google/auth/status", () => HttpResponse.json({ connected: true })),
    );
  });

  it("says when disconnecting Google failed", async () => {
    server.use(http.delete("/api/calendar/calendars/cal-1/google", failing));
    const user = userEvent.setup();
    renderEditModal();

    await user.click(screen.getByRole("button", { name: "Disconnect" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t disconnect/i);
  });

  it("says when the member list couldn't load, rather than showing nobody", async () => {
    server.use(http.get("/api/calendar/calendars/cal-1/members", failing));
    const user = userEvent.setup();
    renderEditModal();

    await user.click(screen.getByRole("tab", { name: /sharing/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load/i);
  });

  it("says when removing a member failed", async () => {
    server.use(
      http.get("/api/calendar/calendars/cal-1/members", () =>
        HttpResponse.json({
          members: [
            { id: null, userSub: "auth0|me", email: "me@example.com", role: "owner" },
            { id: "m1", userSub: "auth0|bo", email: "bo@example.com", role: "editor" },
          ],
        }),
      ),
      http.delete("/api/calendar/calendars/cal-1/members/:sub", failing),
    );
    const user = userEvent.setup();
    renderEditModal();

    await user.click(screen.getByRole("tab", { name: /sharing/i }));
    await user.click(await screen.findByRole("button", { name: "Remove bo@example.com" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t remove/i);
  });

  it("says when deleting the calendar failed, and stays open", async () => {
    const onClose = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <CalendarModal
          calendar={linked}
          onSave={vi.fn()}
          onDelete={() => Promise.reject(new Error("boom"))}
          onClose={onClose}
        />
      </QueryClientProvider>,
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t delete/i);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("puts the delete failure on its own line, not inside the confirm row", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <CalendarModal
          calendar={linked}
          onSave={vi.fn()}
          onDelete={() => Promise.reject(new Error("boom"))}
          onClose={vi.fn()}
        />
      </QueryClientProvider>,
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    const alert = await screen.findByRole("alert");
    const confirmRow = screen.getByRole("button", { name: "Confirm" }).closest("div");
    expect(confirmRow).not.toContainElement(alert);
    // The confirm row stays, so the delete can be retried.
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });
});
