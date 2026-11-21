import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { format, parseISO } from "date-fns";
import { server } from "@/test/server";
import { API_URL } from "@/lib/apiUrl";

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn().mockResolvedValue({ token: "t" }) },
}));

vi.mock("./BackLink", () => ({ default: () => <a href="/calendar">Back</a> }));

import { auth0 } from "@/lib/auth0";
import type { EventCard } from "@/types/calendar";
import EventDetailWithData from "./EventDetailWithData";

const event = {
  id: "e1",
  title: "League night",
  startDate: "2026-11-20T23:00:00.000Z",
  endDate: "2026-11-21T02:00:00.000Z",
  allDay: false,
  color: "#3b82f6",
};

/** An attached card, with the fields the tile never reads filled in. */
const buildCard = (overrides: Partial<EventCard> = {}): EventCard => ({
  id: "ec1",
  eventId: "e1",
  cardId: "base1-4",
  cardName: "Charizard",
  quantity: 1,
  createdAt: "2026-11-01T00:00:00.000Z",
  ...overrides,
});

const serve = (eventReply: () => Response, cardsReply: () => Response) =>
  server.use(
    http.get(`${API_URL}/api/calendar/events/e1`, eventReply),
    http.get(`${API_URL}/api/calendar/events/e1/cards`, cardsReply),
  );

/**
 * The event and its cards are two requests. A failed cards request used to
 * render exactly like an event with no cards attached.
 */
describe("EventDetailWithData", () => {
  it("says the cards couldn't load rather than hiding them", async () => {
    server.use(
      http.get(`${API_URL}/api/calendar/events/e1`, () => HttpResponse.json({ event })),
      http.get(`${API_URL}/api/calendar/events/e1/cards`, () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
    );

    render(await EventDetailWithData({ id: "e1" }));

    expect(screen.getByText("League night")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/couldn.t load the cards/i);
  });

  it("shows nothing extra for an event with no cards", async () => {
    server.use(
      http.get(`${API_URL}/api/calendar/events/e1`, () => HttpResponse.json({ event })),
      http.get(`${API_URL}/api/calendar/events/e1/cards`, () =>
        HttpResponse.json({ cards: [] }),
      ),
    );

    render(await EventDetailWithData({ id: "e1" }));

    expect(screen.getByText("League night")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("lists the attached cards under a count", async () => {
    serve(
      () => HttpResponse.json({ event }),
      () =>
        HttpResponse.json({
          cards: [
            buildCard({ id: "c1", cardName: "Charizard", quantity: 2 }),
            buildCard({ id: "c2", cardName: "Pikachu" }),
          ],
        }),
    );

    render(await EventDetailWithData({ id: "e1" }));

    expect(screen.getByRole("heading", { name: "Cards (2)" })).toBeInTheDocument();
    expect(screen.getByText("Charizard")).toBeInTheDocument();
    expect(screen.getByText("Pikachu")).toBeInTheDocument();
    expect(screen.getByText("×2")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("leaves out the cards section when there are none", async () => {
    serve(
      () => HttpResponse.json({ event }),
      () => HttpResponse.json({ cards: [] }),
    );

    render(await EventDetailWithData({ id: "e1" }));

    expect(screen.queryByRole("heading", { name: /cards/i })).toBeNull();
  });

  it("labels an all-day event as all day, with the date", async () => {
    serve(
      () =>
        HttpResponse.json({
          event: { ...event, allDay: true, startDate: "2026-11-20T12:00:00.000Z" },
        }),
      () => HttpResponse.json({ cards: [] }),
    );

    render(await EventDetailWithData({ id: "e1" }));

    const day = format(parseISO("2026-11-20T12:00:00.000Z"), "EEEE, MMMM d, yyyy");
    expect(screen.getByText(`All day · ${day}`)).toBeInTheDocument();
  });

  it("labels a timed event with its start and end times", async () => {
    serve(
      () => HttpResponse.json({ event }),
      () => HttpResponse.json({ cards: [] }),
    );

    render(await EventDetailWithData({ id: "e1" }));

    // the page shows local time, so the expected times are worked out in the same zone
    const startTime = format(parseISO(event.startDate), "h:mm aaa");
    const endTime = format(parseISO(event.endDate), "h:mm aaa");
    expect(startTime).not.toBe(endTime);
    expect(screen.getByText(new RegExp(`${startTime} – ${endTime}$`))).toBeInTheDocument();
  });

  it("shows the description when the event has one", async () => {
    serve(
      () => HttpResponse.json({ event: { ...event, description: "Bring a deck" } }),
      () => HttpResponse.json({ cards: [] }),
    );

    render(await EventDetailWithData({ id: "e1" }));

    expect(screen.getByText("Bring a deck")).toBeInTheDocument();
  });

  it("says the event was not found on a 404", async () => {
    serve(
      () => HttpResponse.json({ error: "nope" }, { status: 404 }),
      () => HttpResponse.json({ cards: [] }),
    );

    render(await EventDetailWithData({ id: "e1" }));

    expect(screen.getByText("Event not found.")).toBeInTheDocument();
    expect(screen.queryByText("League night")).toBeNull();
  });

  it("says it couldn't load the event on any other failure", async () => {
    serve(
      () => HttpResponse.json({ error: "boom" }, { status: 500 }),
      () => HttpResponse.json({ cards: [] }),
    );

    render(await EventDetailWithData({ id: "e1" }));

    expect(screen.getByText("Couldn't load this event.")).toBeInTheDocument();
  });

  it("says it couldn't load the event when the sign-in lookup throws", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValueOnce(new Error("no session"));

    render(await EventDetailWithData({ id: "e1" }));

    expect(screen.getByText("Couldn't load this event.")).toBeInTheDocument();
  });

  it("falls back to not found, without calling the backend, when there is no token", async () => {
    let called = false;
    server.use(
      http.get(`${API_URL}/api/calendar/events/e1`, () => {
        called = true;
        return HttpResponse.json({ event });
      }),
    );
    vi.mocked(auth0.getAccessToken).mockResolvedValueOnce({ token: "" } as never);

    render(await EventDetailWithData({ id: "e1" }));

    expect(screen.getByText("Event not found.")).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it("sends the access token with both requests", async () => {
    const seen: (string | null)[] = [];
    server.use(
      http.get(`${API_URL}/api/calendar/events/e1`, ({ request }) => {
        seen.push(request.headers.get("authorization"));
        return HttpResponse.json({ event });
      }),
      http.get(`${API_URL}/api/calendar/events/e1/cards`, ({ request }) => {
        seen.push(request.headers.get("authorization"));
        return HttpResponse.json({ cards: [] });
      }),
    );

    render(await EventDetailWithData({ id: "e1" }));

    expect(seen).toEqual(["Bearer t", "Bearer t"]);
  });
});
