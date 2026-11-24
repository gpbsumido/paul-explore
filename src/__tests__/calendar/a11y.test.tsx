import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import CountdownModal from "@/components/calendar/CountdownModal";
import CardSearch from "@/components/calendar/CardSearch";
import DayView from "@/components/calendar/DayView";
import WeekView from "@/components/calendar/WeekView";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import type { CalendarEvent } from "@/types/calendar";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

/** What the mocked card search query hands back; each test sets its own. */
const searchState = vi.hoisted(() => ({ results: [] as { id: string; name: string }[] }));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: searchState.results, isLoading: false }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
    getQueriesData: () => [],
    getQueryState: () => null,
  }),
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (val: string) => val,
}));

vi.mock("@/lib/queryKeys", () => ({
  queryKeys: {
    tcg: { search: (q: string) => ["tcg", "search", q] },
  },
}));

// ---------------------------------------------------------------------------
// CountdownModal
// ---------------------------------------------------------------------------

describe("CountdownModal accessibility", () => {
  const defaultProps = {
    onSave: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
    onClose: vi.fn(),
    isSaving: false,
    isDeleting: false,
  };

  // The modal renders into a portal on document.body, so the render's own
  // container is empty. Axe has to look at baseElement or it checks nothing.
  it("has no axe violations in create mode", async () => {
    const { baseElement } = render(<CountdownModal {...defaultProps} />);
    const results = await axe(baseElement);
    expect(results).toHaveNoViolations();
  });

  it("has no axe violations in edit mode", async () => {
    const { baseElement } = render(
      <CountdownModal
        {...defaultProps}
        countdown={{
          id: "cd-1",
          title: "Launch day",
          description: "Product launch",
          targetDate: "2026-12-25",
          color: "#3b82f6",
          createdAt: "2026-01-01T00:00:00Z",
        }}
      />,
    );
    const results = await axe(baseElement);
    expect(results).toHaveNoViolations();
  });

  it("renders entry type toggle as a tablist with aria-selected", () => {
    render(<CountdownModal {...defaultProps} onSwitchToEvent={vi.fn()} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
  });
});

// ---------------------------------------------------------------------------
// CardSearch
// ---------------------------------------------------------------------------

describe("CardSearch accessibility", () => {
  afterEach(() => {
    searchState.results = [];
  });

  it("has no axe violations in default state", async () => {
    const { container } = render(<CardSearch onSelectCard={vi.fn()} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders input with combobox role", () => {
    render(<CardSearch onSelectCard={vi.fn()} />);
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("announces how many results are available through the live region", async () => {
    searchState.results = [
      { id: "sv1-1", name: "Bulbasaur" },
      { id: "sv1-4", name: "Charmander" },
      { id: "sv1-7", name: "Squirtle" },
    ];
    const user = userEvent.setup();
    render(<CardSearch onSelectCard={vi.fn()} />);

    await user.type(screen.getByRole("combobox"), "saur");

    expect(document.querySelector("[aria-live='polite']")).toHaveTextContent("3 results available");
  });

  it("says '1 result' in the singular", async () => {
    searchState.results = [{ id: "sv1-1", name: "Bulbasaur" }];
    const user = userEvent.setup();
    render(<CardSearch onSelectCard={vi.fn()} />);

    await user.type(screen.getByRole("combobox"), "saur");

    expect(document.querySelector("[aria-live='polite']")).toHaveTextContent("1 result available");
  });

  it("announces nothing before there is anything to choose", async () => {
    const user = userEvent.setup();
    render(<CardSearch onSelectCard={vi.fn()} />);

    await user.type(screen.getByRole("combobox"), "saur");

    expect(document.querySelector("[aria-live='polite']")).toBeEmptyDOMElement();
  });
});

// ---------------------------------------------------------------------------
// Test data for calendar views
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "ev-1",
    title: "Team standup",
    startDate: "2026-07-10T09:00:00",
    endDate: "2026-07-10T09:30:00",
    color: "#3b82f6",
    allDay: false,
    ...overrides,
  };
}

const JULY_10 = new Date(2026, 6, 10);

// ---------------------------------------------------------------------------
// DayView
// ---------------------------------------------------------------------------

describe("DayView accessibility", () => {
  const defaultProps = {
    currentDate: JULY_10,
    events: [makeEvent()],
    onSlotClick: vi.fn(),
    onChipClick: vi.fn(),
  };

  it("has no axe violations", async () => {
    const { container } = render(<DayView {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("clicking a time slot opens that hour", async () => {
    const onSlotClick = vi.fn();
    render(<DayView {...defaultProps} onSlotClick={onSlotClick} />);

    await userEvent.click(screen.getByRole("button", { name: "Create event at 14:00" }));

    expect(onSlotClick).toHaveBeenCalledWith(new Date(2026, 6, 10, 14, 0));
  });

  it.each(["{Enter}", " "])("time slots open that hour from the keyboard (%j)", async (key) => {
    const onSlotClick = vi.fn();
    render(<DayView {...defaultProps} onSlotClick={onSlotClick} />);

    screen.getByRole("button", { name: "Create event at 9:00" }).focus();
    await userEvent.keyboard(key);

    expect(onSlotClick).toHaveBeenCalledTimes(1);
    expect(onSlotClick).toHaveBeenCalledWith(new Date(2026, 6, 10, 9, 0));
  });
});

// ---------------------------------------------------------------------------
// WeekView
// ---------------------------------------------------------------------------

describe("WeekView accessibility", () => {
  const defaultProps = {
    currentDate: JULY_10,
    events: [makeEvent()],
    onSlotClick: vi.fn(),
    onChipClick: vi.fn(),
  };

  it("has no axe violations", async () => {
    const { container } = render(<WeekView {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("clicking a time slot opens that hour on that day", async () => {
    const onSlotClick = vi.fn();
    render(<WeekView {...defaultProps} onSlotClick={onSlotClick} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Create event at 14:00" })[0]);

    expect(onSlotClick).toHaveBeenCalledWith(new Date(2026, 6, 5, 14, 0));
  });

  it.each(["{Enter}", " "])("time slots open that hour from the keyboard (%j)", async (key) => {
    const onSlotClick = vi.fn();
    render(<WeekView {...defaultProps} onSlotClick={onSlotClick} />);

    // Seven days share each hour label, so take the first one: Sunday July 5.
    screen.getAllByRole("button", { name: "Create event at 9:00" })[0].focus();
    await userEvent.keyboard(key);

    expect(onSlotClick).toHaveBeenCalledTimes(1);
    expect(onSlotClick).toHaveBeenCalledWith(new Date(2026, 6, 5, 9, 0));
  });
});

// ---------------------------------------------------------------------------
// CalendarGrid
// ---------------------------------------------------------------------------

describe("CalendarGrid accessibility", () => {
  const defaultProps = {
    currentDate: JULY_10,
    events: [] as CalendarEvent[],
    onDayClick: vi.fn(),
    onChipClick: vi.fn(),
    onShowMore: vi.fn(),
  };

  it("opens the day (not the create modal) when the overflow line is clicked", () => {
    const onShowMore = vi.fn();
    const onDayClick = vi.fn();
    // Enough events on one day to overflow the cell's visible-chip cap.
    const events = Array.from({ length: 8 }, (_, i) =>
      makeEvent({ id: `e${i}`, title: `Event ${i}` }),
    );
    render(
      <CalendarGrid
        {...defaultProps}
        events={events}
        onShowMore={onShowMore}
        onDayClick={onDayClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /\+\d+ more/ }));
    expect(onShowMore).toHaveBeenCalledTimes(1);
    expect(onShowMore.mock.calls[0][0].getDate()).toBe(10);
    expect(onDayClick).not.toHaveBeenCalled();
  });

  it("reserves a row for the overflow line so it is never clipped", () => {
    // The cell is a fixed height with overflow-hidden. If the "+N more" line is
    // an extra row on top of a full set of chips, it gets pushed past the clip
    // edge and vanishes. So on an overflowing day the more line must take a chip
    // slot: at most two event chips render, leaving room for it inside the cell.
    const events = Array.from({ length: 8 }, (_, i) =>
      makeEvent({ id: `e${i}`, title: `Event ${i}` }),
    );
    render(<CalendarGrid {...defaultProps} events={events} />);

    const chips = screen.getAllByRole("button", { name: /^Event \d+$/ });
    expect(chips.length).toBeLessThanOrEqual(2);
    // The count on the line accounts for every hidden event.
    expect(
      screen.getByRole("button", {
        name: `+${8 - chips.length} more`,
      }),
    ).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<CalendarGrid {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no axe violations with events", async () => {
    const { container } = render(
      <CalendarGrid {...defaultProps} events={[makeEvent()]} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe("on a fixed day", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 6, 15, 12));
    });
    afterEach(() => vi.useRealTimers());

    it("marks today's cell, and only that one, as today in its label", () => {
      render(<CalendarGrid {...defaultProps} currentDate={new Date()} />);

      const todayCells = screen.getAllByLabelText(/\(today\)/);
      expect(todayCells).toHaveLength(1);
      expect(todayCells[0]).toHaveAccessibleName("Wednesday, July 15 (today)");
    });
  });
});
