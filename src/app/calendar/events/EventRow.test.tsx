import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { format, parseISO } from "date-fns";
import type { CalendarEvent } from "@/types/calendar";
import EventRow from "./EventRow";

/** An event with the fields the row never reads filled in. */
const buildEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: "e1",
  title: "League night",
  startDate: "2026-11-20T23:00:00.000Z",
  endDate: "2026-11-21T02:00:00.000Z",
  color: "#3b82f6",
  allDay: false,
  ...overrides,
});

const renderRow = (event: CalendarEvent) =>
  render(
    <ul>
      <EventRow event={event} />
    </ul>,
  );

describe("EventRow", () => {
  it("links to the event's own page", () => {
    renderRow(buildEvent({ id: "abc-123" }));
    expect(screen.getByRole("link")).toHaveAttribute("href", "/calendar/events/abc-123");
  });

  it("shows the title", () => {
    renderRow(buildEvent({ title: "Draft night" }));
    expect(screen.getByText("Draft night")).toBeInTheDocument();
  });

  it("labels a timed event with its date and its start and end times", () => {
    const event = buildEvent();
    renderRow(event);
    // the row shows local time, so the expectation is worked out in the same zone
    const day = format(parseISO(event.startDate), "EEE, MMM d, yyyy");
    const startTime = format(parseISO(event.startDate), "h:mm aaa");
    const endTime = format(parseISO(event.endDate), "h:mm aaa");
    expect(startTime).not.toBe(endTime);
    expect(screen.getByText(`${day} · ${startTime} – ${endTime}`)).toBeInTheDocument();
  });

  it("shows only the date for an all-day event", () => {
    const event = buildEvent({ allDay: true });
    renderRow(event);
    expect(
      screen.getByText(format(parseISO(event.startDate), "EEE, MMM d, yyyy")),
    ).toBeInTheDocument();
    expect(screen.queryByText(/ · /)).toBeNull();
  });

  it("paints the dot in the event's colour", () => {
    const { container } = renderRow(buildEvent({ color: "#123456" }));
    expect(container.querySelector("div.rounded-full")).toHaveStyle({
      backgroundColor: "#123456",
    });
  });

  it("shows a short description whole", () => {
    renderRow(buildEvent({ description: "Bring a deck" }));
    expect(screen.getByText("Bring a deck")).toBeInTheDocument();
  });

  it("cuts a long description at 100 characters with an ellipsis", () => {
    const long = "a".repeat(100) + "TAIL";
    renderRow(buildEvent({ description: long }));
    expect(screen.getByText(`${"a".repeat(100)}…`)).toBeInTheDocument();
    expect(screen.queryByText(/TAIL/)).toBeNull();
  });

  it("does not shorten a description of exactly 100 characters", () => {
    const exact = "b".repeat(100);
    renderRow(buildEvent({ description: exact }));
    expect(screen.getByText(exact)).toBeInTheDocument();
  });

  it("shows no description line when there is none", () => {
    const { container } = renderRow(buildEvent({ description: undefined }));
    expect(container.querySelector("p.line-clamp-1")).toBeNull();
  });
});
