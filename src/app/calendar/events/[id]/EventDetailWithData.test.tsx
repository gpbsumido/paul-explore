import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { API_URL } from "@/lib/apiUrl";

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn().mockResolvedValue({ token: "t" }) },
}));

vi.mock("./BackLink", () => ({ default: () => <a href="/calendar">Back</a> }));

import EventDetailWithData from "./EventDetailWithData";

const event = {
  id: "e1",
  title: "League night",
  startDate: "2026-11-20T23:00:00.000Z",
  endDate: "2026-11-21T02:00:00.000Z",
  allDay: false,
  color: "#3b82f6",
};

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
});
