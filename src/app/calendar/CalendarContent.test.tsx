import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { forwardRef, lazy, Suspense, useImperativeHandle, type ComponentType } from "react";
import type { CalendarEvent, Countdown } from "@/types/calendar";

// CalendarContent owns the view state, the fetch window and the modal wiring.
// Everything it renders is stubbed down to the props it hands over and the
// callbacks it expects back, so these tests are about that wiring.
const scroll = vi.hoisted(() => ({
  props: null as null | Record<string, (...args: never[]) => unknown> & { initialDate: Date },
  scrollToDate: vi.fn(),
  scrollToToday: vi.fn(),
}));
const hooks = vi.hoisted(() => ({
  eventsArgs: [] as { start: string; end: string; calendarId: string | null }[],
  events: [] as unknown[],
  eventsError: null as string | null,
  calendarsFailed: false,
  calendars: [{ id: "cal-a" }, { id: "cal-b" }] as { id: string }[],
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  createCountdown: vi.fn(),
  updateCountdown: vi.fn(),
  deleteCountdown: vi.fn(),
}));

vi.mock("next/dynamic", () => ({
  default: (
    loader: () => Promise<{ default: ComponentType<Record<string, unknown>> }>,
  ) => {
    const Lazy = lazy(loader);
    return (props: Record<string, unknown>) => (
      <Suspense fallback={null}>
        <Lazy {...props} />
      </Suspense>
    );
  },
}));

vi.mock("@/hooks/useCalendars", () => ({
  useCalendars: () => ({ calendars: hooks.calendars, isError: hooks.calendarsFailed }),
}));
vi.mock("@/hooks/useCalendarEvents", () => ({
  useCalendarEvents: (args: { start: string; end: string; calendarId: string | null }) => {
    hooks.eventsArgs.push(args);
    return {
      events: hooks.events,
      loading: false,
      error: hooks.eventsError,
      createEvent: hooks.createEvent,
      updateEvent: hooks.updateEvent,
      deleteEvent: hooks.deleteEvent,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
    };
  },
}));
vi.mock("@/hooks/useCountdowns", () => ({
  useCountdowns: () => ({
    countdowns: [],
    createCountdown: hooks.createCountdown,
    updateCountdown: hooks.updateCountdown,
    deleteCountdown: hooks.deleteCountdown,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
  }),
}));

vi.mock("@/components/calendar/InfiniteCalendarScroll", () => ({
  default: forwardRef(function Scroll(
    props: {
      initialDate: Date;
      renderPeriod: (date: Date) => React.ReactNode;
    },
    ref,
  ) {
    scroll.props = props as never;
    useImperativeHandle(ref, () => ({
      scrollToDate: scroll.scrollToDate,
      scrollToToday: scroll.scrollToToday,
    }));
    return <div data-testid="scroll">{props.renderPeriod(props.initialDate)}</div>;
  }),
}));

vi.mock("@/components/calendar/CalendarHeader", () => ({
  default: (props: {
    view: string;
    currentDate: Date;
    selectedCalendarId: string | null;
    onNavigate: (dir: -1 | 1) => void;
    onToday: () => void;
    onViewChange: (view: string) => void;
    onNewCountdown: () => void;
    onSelectCalendar: (id: string | null) => void;
  }) => (
    <div>
      <p data-testid="heading">
        {props.view} {props.currentDate.getFullYear()}-{props.currentDate.getMonth() + 1}-
        {props.currentDate.getDate()}
      </p>
      <p data-testid="selected-calendar">{String(props.selectedCalendarId)}</p>
      <button onClick={() => props.onNavigate(-1)}>prev</button>
      <button onClick={() => props.onNavigate(1)}>next</button>
      <button onClick={props.onToday}>today</button>
      <button onClick={() => props.onViewChange("week")}>to week</button>
      <button onClick={() => props.onViewChange("day")}>to day</button>
      <button onClick={() => props.onViewChange("year")}>to year</button>
      <button onClick={props.onNewCountdown}>new countdown</button>
      <button onClick={() => props.onSelectCalendar("cal-b")}>pick b</button>
      <button onClick={() => props.onSelectCalendar(null)}>pick none</button>
    </div>
  ),
}));

vi.mock("@/components/calendar/CalendarGrid", () => ({
  default: (props: {
    events: unknown[];
    onDayClick: (d: Date) => void;
    onChipClick: (e: CalendarEvent) => void;
    onShowMore: (d: Date) => void;
  }) => (
    <div data-testid="month-grid">
      <span data-testid="event-count">{props.events.length}</span>
      <button onClick={() => props.onDayClick(new Date(2026, 10, 18))}>click day</button>
      <button
        onClick={() =>
          props.onChipClick({
            id: "e9",
            title: "Existing",
            startDate: "2026-11-05T15:00:00.000Z",
            endDate: "2026-11-05T16:00:00.000Z",
            color: "#000000",
            allDay: false,
          })
        }
      >
        click chip
      </button>
      <button onClick={() => props.onShowMore(new Date(2026, 10, 9))}>show more</button>
    </div>
  ),
}));
vi.mock("@/components/calendar/DayView", () => ({ default: () => <div data-testid="day-view" /> }));
vi.mock("@/components/calendar/WeekView", () => ({ default: () => <div data-testid="week-view" /> }));
vi.mock("@/components/calendar/YearView", () => ({
  default: (props: { onMonthClick: (d: Date) => void }) => (
    <div data-testid="year-view">
      <button onClick={() => props.onMonthClick(new Date(2026, 2, 20))}>open march</button>
    </div>
  ),
}));

vi.mock("@/components/calendar/EventModal", () => ({
  default: (props: {
    initialDate: Date;
    event?: CalendarEvent;
    defaultCalendarId: string | null;
    onSave: (draft: Record<string, unknown>) => Promise<unknown>;
    onDelete: (id: string) => Promise<void>;
    onClose: () => void;
    onSwitchToCountdown?: () => void;
  }) => (
    <div role="dialog" aria-label="event modal">
      <p data-testid="event-modal-date">{props.initialDate.toDateString()}</p>
      <p data-testid="event-modal-event">{props.event?.title ?? "new"}</p>
      <p data-testid="event-modal-calendar">{String(props.defaultCalendarId)}</p>
      <button onClick={() => props.onSave({ title: "Fresh", startDate: "s", endDate: "e", color: "c", allDay: false })}>
        save new
      </button>
      <button onClick={() => props.onSave({ id: "e9", title: "Edited", startDate: "s", endDate: "e", color: "c", allDay: false })}>
        save existing
      </button>
      <button onClick={() => props.onDelete("e9")}>delete event</button>
      <button onClick={props.onClose}>close event</button>
      {props.onSwitchToCountdown && <button onClick={props.onSwitchToCountdown}>switch to countdown</button>}
    </div>
  ),
}));
vi.mock("@/components/calendar/CountdownModal", () => ({
  default: (props: {
    countdown?: Countdown;
    initialDate?: Date;
    onSave: (data: Record<string, unknown>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onClose: () => void;
    onSwitchToEvent?: () => void;
  }) => (
    <div role="dialog" aria-label="countdown modal">
      <p data-testid="countdown-modal-date">{props.initialDate?.toDateString() ?? "none"}</p>
      <button onClick={() => props.onSave({ title: "T", targetDate: "2027-01-01", color: "c" })}>save countdown</button>
      <button onClick={() => props.onDelete("cd1")}>delete countdown</button>
      <button onClick={props.onClose}>close countdown</button>
      {props.onSwitchToEvent && <button onClick={props.onSwitchToEvent}>switch to event</button>}
    </div>
  ),
}));

import CalendarContent from "./CalendarContent";

// Thursday 19 Nov 2026, local noon. Only Date is faked so promises and effects run normally.
const TODAY = new Date(2026, 10, 19, 12, 0, 0);

const lastRange = () => hooks.eventsArgs[hooks.eventsArgs.length - 1];
const heading = () => screen.getByTestId("heading").textContent;

beforeEach(() => {
  vi.useFakeTimers({ now: TODAY, toFake: ["Date"] });
  hooks.eventsArgs.length = 0;
  hooks.events = [];
  hooks.eventsError = null;
  hooks.calendarsFailed = false;
  hooks.calendars = [{ id: "cal-a" }, { id: "cal-b" }];
  scroll.scrollToDate.mockClear();
  scroll.scrollToToday.mockClear();
  for (const fn of [hooks.createEvent, hooks.updateEvent, hooks.deleteEvent, hooks.createCountdown, hooks.updateCountdown, hooks.deleteCountdown]) {
    fn.mockReset().mockResolvedValue({});
  }
});

afterEach(() => vi.useRealTimers());

const setup = () => {
  const user = userEvent.setup({ advanceTimers: () => {} });
  render(<CalendarContent />);
  return user;
};

describe("CalendarContent fetch window", () => {
  it("starts in the current month and fetches from the month before to the month after, padded to whole weeks", () => {
    setup();

    expect(heading()).toBe("month 2026-11-1");
    // Oct 1 2026 is a Thursday, so the Sunday-start week begins Sep 27; Dec 31 is a Thursday, so the week ends Jan 2.
    expect(lastRange().start).toBe(new Date(2026, 8, 27).toISOString());
    expect(lastRange().end).toBe(new Date(2027, 0, 2, 23, 59, 59, 999).toISOString());
  });

  it("refetches for the periods the scroll area reports", () => {
    setup();

    act(() => {
      (scroll.props?.onPeriodsChange as (periods: Date[]) => void)([
        new Date(2026, 7, 1),
        new Date(2026, 8, 1),
      ]);
    });

    expect(lastRange().start).toBe(new Date(2026, 6, 26).toISOString());
    expect(lastRange().end).toBe(new Date(2026, 9, 3, 23, 59, 59, 999).toISOString());
  });

  it("ignores an empty list of periods", () => {
    setup();
    const before = lastRange();

    act(() => (scroll.props?.onPeriodsChange as (periods: Date[]) => void)([]));

    expect(lastRange()).toEqual(before);
  });

  it("hands the scroll area the month's events through the grid", () => {
    hooks.events = [{ id: "a" }, { id: "b" }];
    setup();
    expect(screen.getByTestId("event-count")).toHaveTextContent("2");
  });
});

describe("CalendarContent calendar choice", () => {
  it("shows the first calendar until another is picked", async () => {
    const user = setup();
    expect(screen.getByTestId("selected-calendar")).toHaveTextContent("cal-a");
    expect(lastRange().calendarId).toBe("cal-a");

    await user.click(screen.getByText("pick b"));

    expect(screen.getByTestId("selected-calendar")).toHaveTextContent("cal-b");
    expect(lastRange().calendarId).toBe("cal-b");
  });

  it("honours an explicit choice of no calendar rather than falling back to the first", async () => {
    const user = setup();
    await user.click(screen.getByText("pick none"));
    expect(lastRange().calendarId).toBeNull();
  });

  it("has no calendar selected when the user has none", () => {
    hooks.calendars = [];
    setup();
    expect(lastRange().calendarId).toBeNull();
  });

  it("says the calendars could not be loaded", () => {
    hooks.calendarsFailed = true;
    setup();
    expect(screen.getByRole("alert")).toHaveTextContent(/couldn.t load your calendars/i);
  });

  it("shows the events error and no calendars alert otherwise", () => {
    hooks.eventsError = "Couldn't load events.";
    setup();
    expect(screen.getByText("Couldn't load events.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("CalendarContent navigation", () => {
  it("moves to the next and previous month and scrolls there", async () => {
    const user = setup();

    await user.click(screen.getByText("next"));
    expect(heading()).toBe("month 2026-12-1");
    expect(scroll.scrollToDate).toHaveBeenLastCalledWith(new Date(2026, 11, 1));

    await user.click(screen.getByText("prev"));
    await user.click(screen.getByText("prev"));
    expect(heading()).toBe("month 2026-10-1");
    expect(scroll.scrollToDate).toHaveBeenLastCalledWith(new Date(2026, 9, 1));
  });

  it("steps by the unit of the current view", async () => {
    const user = setup();

    await user.click(screen.getByText("to day"));
    await user.click(screen.getByText("next"));
    expect(heading()).toBe("day 2026-11-2");

    await user.click(screen.getByText("to year"));
    await user.click(screen.getByText("next"));
    expect(heading()).toBe("year 2027-1-1");
  });

  it("jumps back to the current period on Today, scrolling it into view", async () => {
    const user = setup();
    await user.click(screen.getByText("next"));
    await user.click(screen.getByText("next"));

    await user.click(screen.getByText("today"));

    expect(heading()).toBe("month 2026-11-1");
    expect(scroll.scrollToToday).toHaveBeenCalledWith(new Date(2026, 10, 1));
  });

  it("follows the scroll area when it reports a different visible month", () => {
    setup();
    act(() => (scroll.props?.onVisibleDateChange as (d: Date) => void)(new Date(2027, 1, 1)));
    expect(heading()).toBe("month 2027-2-1");
  });
});

describe("CalendarContent views", () => {
  it.each([
    ["to week", "week-view", "week 2026-11-29"],
    ["to day", "day-view", "day 2026-12-1"],
    ["to year", "year-view", "year 2026-1-1"],
  ])("%s renders its own view and snaps the date to the start of the period", async (button, testId, expectedHeading) => {
    const user = setup();
    // Dec 1 2026 is a Tuesday, so the week it falls in starts on Sun Nov 29
    await user.click(screen.getByText("next"));

    await user.click(screen.getByText(button));

    expect(await screen.findByTestId(testId)).toBeInTheDocument();
    expect(screen.queryByTestId("month-grid")).toBeNull();
    expect(heading()).toBe(expectedHeading);
  });

  it("opens a day in full from '+N more'", async () => {
    const user = setup();

    await user.click(screen.getByText("show more"));

    expect(await screen.findByTestId("day-view")).toBeInTheDocument();
    expect(heading()).toBe("day 2026-11-9");
  });

  it("opens the month picked in the year view", async () => {
    const user = setup();
    await user.click(screen.getByText("to year"));

    await user.click(await screen.findByText("open march"));

    expect(await screen.findByTestId("month-grid")).toBeInTheDocument();
    expect(heading()).toBe("month 2026-3-1");
  });
});

describe("CalendarContent event modal", () => {
  it("opens a new-event modal on the day clicked, for the selected calendar", async () => {
    const user = setup();

    await user.click(screen.getByText("click day"));

    expect(await screen.findByTestId("event-modal-date")).toHaveTextContent(new Date(2026, 10, 18).toDateString());
    expect(screen.getByTestId("event-modal-event")).toHaveTextContent("new");
    expect(screen.getByTestId("event-modal-calendar")).toHaveTextContent("cal-a");
  });

  it("opens the modal on an existing event, at that event's start", async () => {
    const user = setup();

    await user.click(screen.getByText("click chip"));

    expect(await screen.findByTestId("event-modal-event")).toHaveTextContent("Existing");
    expect(screen.getByTestId("event-modal-date")).toHaveTextContent(new Date("2026-11-05T15:00:00.000Z").toDateString());
  });

  it("creates when the draft has no id and updates when it has one", async () => {
    const user = setup();
    await user.click(screen.getByText("click day"));

    await user.click(await screen.findByText("save new"));
    expect(hooks.createEvent).toHaveBeenCalledWith(expect.objectContaining({ title: "Fresh" }));
    expect(hooks.updateEvent).not.toHaveBeenCalled();

    await user.click(screen.getByText("save existing"));
    expect(hooks.updateEvent).toHaveBeenCalledWith("e9", expect.objectContaining({ title: "Edited" }));
    expect(hooks.updateEvent.mock.calls[0][1]).not.toHaveProperty("id");
  });

  it("deletes through the hook and closes on request", async () => {
    const user = setup();
    await user.click(screen.getByText("click chip"));

    await user.click(await screen.findByText("delete event"));
    expect(hooks.deleteEvent).toHaveBeenCalledWith("e9");

    await user.click(screen.getByText("close event"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("offers to switch to a countdown for a new event only, carrying the day over", async () => {
    const user = setup();
    await user.click(screen.getByText("click chip"));
    await screen.findByText("close event");
    expect(screen.queryByText("switch to countdown")).toBeNull();
    await user.click(screen.getByText("close event"));

    await user.click(screen.getByText("click day"));
    await user.click(await screen.findByText("switch to countdown"));

    expect(screen.queryByRole("dialog", { name: "event modal" })).toBeNull();
    expect(await screen.findByTestId("countdown-modal-date")).toHaveTextContent(new Date(2026, 10, 18).toDateString());
  });
});

describe("CalendarContent countdown modal", () => {
  it("opens a new countdown from the header with no date preset", async () => {
    const user = setup();
    await user.click(screen.getByText("new countdown"));
    expect(await screen.findByTestId("countdown-modal-date")).toHaveTextContent("none");
  });

  it("creates a countdown when saving from a new one", async () => {
    const user = setup();
    await user.click(screen.getByText("new countdown"));

    await user.click(await screen.findByText("save countdown"));

    expect(hooks.createCountdown).toHaveBeenCalledWith({ title: "T", targetDate: "2027-01-01", color: "c" });
    expect(hooks.updateCountdown).not.toHaveBeenCalled();
  });

  it("deletes through the hook and closes on request", async () => {
    const user = setup();
    await user.click(screen.getByText("new countdown"));

    await user.click(await screen.findByText("delete countdown"));
    expect(hooks.deleteCountdown).toHaveBeenCalledWith("cd1");

    await user.click(screen.getByText("close countdown"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("switches from a new countdown to a new event on the same day, or today when none was set", async () => {
    const user = setup();
    await user.click(screen.getByText("new countdown"));

    await user.click(await screen.findByText("switch to event"));

    expect(await screen.findByTestId("event-modal-date")).toHaveTextContent(TODAY.toDateString());
    expect(screen.queryByRole("dialog", { name: "countdown modal" })).toBeNull();
  });
});
