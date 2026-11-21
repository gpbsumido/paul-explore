import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import YearView from "../YearView";
import type { CalendarEvent, Countdown } from "@/types/calendar";

const event = (id: string, startDate: string, color: string): CalendarEvent => ({
  id,
  title: id,
  startDate,
  endDate: startDate,
  color,
  allDay: true,
});
const countdown = (id: string, targetDate: string, color: string): Countdown => ({
  id,
  title: id,
  targetDate,
  color,
  createdAt: "2026-01-01T00:00:00Z",
});

const monthButton = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}`) });
const dots = (button: HTMLElement) =>
  [...button.querySelectorAll<HTMLElement>("div.rounded-full")].map((d) => d.style.backgroundColor);

describe("YearView", () => {
  it("shows all twelve months of the year of the date it is given", () => {
    render(<YearView currentDate={new Date(2026, 5, 15)} events={[]} onMonthClick={() => {}} />);
    const names = screen.getAllByRole("button").map((b) => b.firstElementChild?.textContent);
    expect(names).toEqual([
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ]);
  });

  it("hands the clicked month back to the caller", async () => {
    const onMonthClick = vi.fn();
    const user = userEvent.setup();
    render(<YearView currentDate={new Date(2026, 5, 15)} events={[]} onMonthClick={onMonthClick} />);

    await user.click(monthButton("March"));

    expect(onMonthClick).toHaveBeenCalledOnce();
    const clicked: Date = onMonthClick.mock.calls[0][0];
    expect([clicked.getFullYear(), clicked.getMonth()]).toEqual([2026, 2]);
  });

  it("marks the month being viewed", () => {
    render(<YearView currentDate={new Date(2026, 5, 15)} events={[]} onMonthClick={() => {}} />);
    expect(monthButton("June").className).toContain("border-t-primary-500");
    expect(monthButton("July").className).not.toContain("border-t-primary-500");
  });

  it("puts a dot of the event's colour on its day, in the right month only", () => {
    render(
      <YearView
        currentDate={new Date(2026, 5, 15)}
        events={[event("a", "2026-03-10T00:00:00", "rgb(255, 0, 0)")]}
        onMonthClick={() => {}}
      />,
    );
    expect(dots(monthButton("March"))).toEqual(["rgb(255, 0, 0)"]);
    expect(dots(monthButton("April"))).toEqual([]);
  });

  it("puts a countdown on its target day, sharing the three-dot budget with events", () => {
    render(
      <YearView
        currentDate={new Date(2026, 5, 15)}
        events={[
          event("e1", "2026-03-10T00:00:00", "rgb(1, 0, 0)"),
          event("e2", "2026-03-10T00:00:00", "rgb(2, 0, 0)"),
        ]}
        countdowns={[
          countdown("c1", "2026-03-10", "rgb(3, 0, 0)"),
          countdown("c2", "2026-03-10", "rgb(4, 0, 0)"),
        ]}
        onMonthClick={() => {}}
      />,
    );
    expect(dots(monthButton("March"))).toEqual(["rgb(1, 0, 0)", "rgb(2, 0, 0)", "rgb(3, 0, 0)"]);
  });

  it("leaves the spill-over days of a neighbouring month undotted", () => {
    // January 2026 starts on a Thursday, so its grid opens with 28 to 31 December.
    render(
      <YearView
        currentDate={new Date(2026, 5, 15)}
        events={[event("a", "2025-12-30T00:00:00", "rgb(255, 0, 0)")]}
        onMonthClick={() => {}}
      />,
    );
    expect(dots(monthButton("January"))).toEqual([]);
  });

  it("marks the month that contains today as the one to scroll to", () => {
    render(<YearView currentDate={new Date()} events={[]} onMonthClick={() => {}} />);
    const marked = screen.getAllByRole("button").filter((b) => b.hasAttribute("data-scroll-target"));
    expect(marked).toHaveLength(1);
    expect(within(marked[0]).getByText(new Date().toLocaleString("en-US", { month: "long" }))).toBeInTheDocument();
  });
});
