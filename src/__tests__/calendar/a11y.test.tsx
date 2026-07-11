import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: [], isLoading: false }),
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

  it("has no axe violations in create mode", async () => {
    const { container } = render(<CountdownModal {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no axe violations in edit mode", async () => {
    const { container } = render(
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
    const results = await axe(container);
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

  it("announces result count via live region", async () => {
    const user = userEvent.setup();
    render(<CardSearch onSelectCard={vi.fn()} />);

    const input = screen.getByRole("combobox");
    await user.type(input, "pikachu");

    const liveRegion = document.querySelector("[aria-live='polite']");
    expect(liveRegion).toBeTruthy();
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

  it("time slots are keyboard accessible", async () => {
    const onSlotClick = vi.fn();
    render(<DayView {...defaultProps} onSlotClick={onSlotClick} />);

    const slots = screen.getAllByRole("button", {
      name: /Create event at/,
    });
    expect(slots.length).toBeGreaterThan(0);

    slots[0].focus();
    await userEvent.keyboard("{Enter}");
    expect(onSlotClick).toHaveBeenCalled();
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

  it("time slots are keyboard accessible", async () => {
    const onSlotClick = vi.fn();
    render(<WeekView {...defaultProps} onSlotClick={onSlotClick} />);

    const slots = screen.getAllByRole("button", {
      name: /Create event at/,
    });
    expect(slots.length).toBeGreaterThan(0);

    slots[0].focus();
    await userEvent.keyboard("{Enter}");
    expect(onSlotClick).toHaveBeenCalled();
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
  };

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

  it("today cell has aria-label indicating today", () => {
    const { container } = render(
      <CalendarGrid {...defaultProps} currentDate={new Date()} />,
    );
    const todayCell = container.querySelector("[aria-label*='(today)']");
    expect(todayCell).toBeTruthy();
  });
});
