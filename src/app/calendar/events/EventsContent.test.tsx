import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import type { CalendarEvent } from "@/types/calendar";
import EventsContent from "./EventsContent";

const buildEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: "e1",
  title: "League night",
  startDate: "2026-11-20T23:00:00.000Z",
  endDate: "2026-11-21T02:00:00.000Z",
  color: "#3b82f6",
  allDay: false,
  ...overrides,
});

const renderContent = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <EventsContent />
    </QueryClientProvider>,
  );
};

/** Serves a fixed list and records the query string of every request. */
const serveEvents = (events: CalendarEvent[]) => {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get("/api/calendar/events", ({ request }) => {
      requests.push(new URL(request.url).searchParams);
      return HttpResponse.json({ events });
    }),
  );
  return requests;
};

/** The titles of the rows on screen, top to bottom. */
const rowTitles = () =>
  screen.queryAllByRole("link").map((link) => link.querySelector("p")?.textContent);

afterEach(() => vi.restoreAllMocks());

describe("EventsContent", () => {
  it("lists events newest first", async () => {
    serveEvents([
      buildEvent({ id: "old", title: "Old", startDate: "2026-01-01T10:00:00.000Z" }),
      buildEvent({ id: "new", title: "New", startDate: "2026-12-01T10:00:00.000Z" }),
      buildEvent({ id: "mid", title: "Middle", startDate: "2026-06-01T10:00:00.000Z" }),
    ]);
    renderContent();

    await screen.findByText("New");

    expect(rowTitles()).toEqual(["New", "Middle", "Old"]);
  });

  it("asks the backend for everything when no filter is set", async () => {
    const requests = serveEvents([]);
    renderContent();

    await screen.findByText("No events yet.");

    expect(requests).toHaveLength(1);
    expect([...requests[0].keys()]).toEqual([]);
  });

  it("says there are no events yet when the list is empty and nothing is filtered", async () => {
    serveEvents([]);
    renderContent();

    expect(await screen.findByText("No events yet.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();
  });

  it("filters by title in the page without asking the backend again", async () => {
    const user = userEvent.setup();
    const requests = serveEvents([
      buildEvent({ id: "a", title: "League night" }),
      buildEvent({ id: "b", title: "Draft weekend", startDate: "2026-10-01T10:00:00.000Z" }),
    ]);
    renderContent();
    await screen.findByText("League night");

    await user.type(screen.getByLabelText("Search by title"), "DRAFT");

    await waitFor(() => expect(rowTitles()).toEqual(["Draft weekend"]));
    expect(requests).toHaveLength(1);
  });

  it("says nothing matches when a title filter leaves no rows", async () => {
    const user = userEvent.setup();
    serveEvents([buildEvent()]);
    renderContent();
    await screen.findByText("League night");

    await user.type(screen.getByLabelText("Search by title"), "zzz");

    expect(await screen.findByText("No events match your filters.")).toBeInTheDocument();
  });

  it("sends the card name to the backend once typing pauses", async () => {
    const user = userEvent.setup();
    const requests = serveEvents([buildEvent()]);
    renderContent();
    await screen.findByText("League night");

    await user.type(screen.getByLabelText("Card contains"), "char");

    await waitFor(() => expect(requests.at(-1)?.get("cardName")).toBe("char"));
    // typing four letters must not have fired a request per letter
    expect(requests.filter((params) => params.has("cardName"))).toHaveLength(1);
  });

  it("sends the date range it was given, as full ISO timestamps", async () => {
    const user = userEvent.setup();
    const requests = serveEvents([buildEvent()]);
    renderContent();
    await screen.findByText("League night");

    await user.type(screen.getByLabelText("From"), "2026-11-01");
    await user.type(screen.getByLabelText("To"), "2026-11-30");

    await waitFor(() => expect(requests.at(-1)?.has("end")).toBe(true));
    const last = requests.at(-1)!;
    expect(last.get("start")).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(last.get("end")).toMatch(/T\d{2}:59:59\.999Z$/);
  });

  describe("in a zone west of UTC, where a date input's midnight-UTC parse lands on the day before", () => {
    const originalZone = process.env.TZ;
    afterEach(() => {
      if (originalZone === undefined) delete process.env.TZ;
      else process.env.TZ = originalZone;
    });

    // Known bug, not fixed here: the date inputs give "2026-11-30", which
    // `new Date()` reads as midnight UTC. In Toronto that is the evening of
    // Nov 29, so "end of the selected day" becomes the end of Nov 29 and every
    // event on the 30th is left out. Flip to a plain `it` once the parse is local.
    it.fails("ends the range at the last moment of the day chosen, in the viewer's zone", async () => {
      process.env.TZ = "America/Toronto";
      const user = userEvent.setup();
      const requests = serveEvents([buildEvent()]);
      renderContent();
      await screen.findByText("League night");

      await user.type(screen.getByLabelText("To"), "2026-11-30");

      await waitFor(() => expect(requests.at(-1)?.has("end")).toBe(true));
      const end = new Date(requests.at(-1)?.get("end") ?? "");
      expect([end.getMonth(), end.getDate(), end.getHours(), end.getMinutes()]).toEqual([10, 30, 23, 59]);
    });

    // Known bug, kept red on purpose: starts the range at local midnight of the day chosen. Drop .fails when it is fixed.
    it.fails("starts the range at local midnight of the day chosen", async () => {
      process.env.TZ = "America/Toronto";
      const user = userEvent.setup();
      const requests = serveEvents([buildEvent()]);
      renderContent();
      await screen.findByText("League night");

      await user.type(screen.getByLabelText("From"), "2026-11-01");

      await waitFor(() => expect(requests.at(-1)?.has("start")).toBe(true));
      expect(requests.at(-1)?.get("start")).toBe(new Date(2026, 10, 1).toISOString());
    });
  });

  it("clears every filter and goes back to the full list", async () => {
    const user = userEvent.setup();
    serveEvents([buildEvent()]);
    renderContent();
    await screen.findByText("League night");

    await user.type(screen.getByLabelText("Search by title"), "zzz");
    await screen.findByText("No events match your filters.");
    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(await screen.findByText("League night")).toBeInTheDocument();
    expect(screen.getByLabelText("Search by title")).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();
  });

  it("says it couldn't load events when the request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("/api/calendar/events", () => HttpResponse.json({ error: "x" }, { status: 500 })),
    );
    renderContent();

    expect(await screen.findByText(/couldn.t load events/i)).toBeInTheDocument();
    expect(screen.queryByText("No events yet.")).toBeNull();
  });

  it("treats a reply with no events key as an empty list", async () => {
    server.use(http.get("/api/calendar/events", () => HttpResponse.json({})));
    renderContent();

    expect(await screen.findByText("No events yet.")).toBeInTheDocument();
  });
});
