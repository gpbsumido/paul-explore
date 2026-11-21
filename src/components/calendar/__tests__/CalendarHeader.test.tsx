import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CalendarHeader from "../CalendarHeader";
import type { Calendar } from "@/types/calendar";

const state = vi.hoisted(() => ({
  calendars: [] as Calendar[],
  connected: false,
  leaveCalendar: vi.fn(),
}));

vi.mock("@/hooks/useGoogleCalendarStatus", () => ({
  useGoogleCalendarStatus: () => ({ connected: state.connected }),
}));
vi.mock("@/hooks/useCalendars", () => ({
  useCalendars: () => ({
    calendars: state.calendars,
    createCalendar: vi.fn(),
    updateCalendar: vi.fn(),
    deleteCalendar: vi.fn(),
    leaveCalendar: state.leaveCalendar,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
  }),
}));
// The modal has its own behaviour; here it only has to show that it opened.
vi.mock("@/components/calendar/CalendarModal", () => ({
  default: ({ calendar }: { calendar?: Calendar }) => (
    <div role="dialog" aria-label="calendar modal">
      {calendar ? `editing ${calendar.name}` : "new calendar"}
    </div>
  ),
}));

const calendar = (overrides: Partial<Calendar> = {}): Calendar => ({
  id: "cal-1",
  name: "Personal",
  color: "#3b82f6",
  syncMode: "none",
  role: "owner",
  ...overrides,
});

function renderHeader(props: Partial<React.ComponentProps<typeof CalendarHeader>> = {}) {
  const handlers = {
    onNavigate: vi.fn(),
    onViewChange: vi.fn(),
    onToday: vi.fn(),
    onSelectCalendar: vi.fn(),
  };
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(
    <QueryClientProvider client={client}>
      <CalendarHeader
        currentDate={new Date(2026, 2, 15)}
        view="month"
        selectedCalendarId={null}
        {...handlers}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { ...handlers, invalidate, user: userEvent.setup() };
}

beforeEach(() => {
  state.calendars = [calendar()];
  state.connected = false;
  state.leaveCalendar.mockReset().mockResolvedValue({ googleAclRemoved: true });
});

describe("CalendarHeader controls", () => {
  it("steps back and forward, and jumps to today", async () => {
    const { onNavigate, onToday, user } = renderHeader();
    await user.click(screen.getByRole("button", { name: "Previous" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Today" }));
    expect(onNavigate.mock.calls).toEqual([[-1], [1]]);
    expect(onToday).toHaveBeenCalledOnce();
  });

  it("names the period being viewed", () => {
    renderHeader();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("March 2026");
  });

  it("offers each view and reports the one picked", async () => {
    const { onViewChange, user } = renderHeader({ view: "month" });
    await user.click(screen.getByRole("button", { name: "Week" }));
    expect(onViewChange).toHaveBeenCalledWith("week");
  });

  it("only offers a new countdown when the page can make one", async () => {
    const onNewCountdown = vi.fn();
    const { user } = renderHeader({ onNewCountdown });
    await user.click(screen.getByRole("button", { name: "New countdown" }));
    expect(onNewCountdown).toHaveBeenCalledOnce();
  });

  it("has no new-countdown button without a handler", () => {
    renderHeader();
    expect(screen.queryByRole("button", { name: "New countdown" })).not.toBeInTheDocument();
  });

  it("shows the Google refresh only when connected, and refresh re-reads every events window", async () => {
    state.connected = true;
    const { user, invalidate } = renderHeader();
    await user.click(screen.getByRole("button", { name: "Refresh calendar from Google" }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["calendar", "events"] });
  });

  it("hides the Google refresh when not connected", () => {
    renderHeader();
    expect(
      screen.queryByRole("button", { name: "Refresh calendar from Google" }),
    ).not.toBeInTheDocument();
  });

  it("opens the new-calendar form", async () => {
    const { user } = renderHeader();
    await user.click(screen.getByRole("button", { name: "New calendar" }));
    expect(screen.getByRole("dialog", { name: "calendar modal" })).toHaveTextContent("new calendar");
  });
});

describe("CalendarHeader with one calendar", () => {
  it("shows its name, and lets the owner edit it", async () => {
    const { user } = renderHeader();
    expect(screen.getByText("Personal")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit calendar" }));
    expect(screen.getByRole("dialog", { name: "calendar modal" })).toHaveTextContent("editing Personal");
    expect(screen.queryByRole("button", { name: "Leave calendar" })).not.toBeInTheDocument();
  });

  it("lets a member of a shared calendar leave it, not edit it", () => {
    state.calendars = [calendar({ role: "viewer", ownerEmail: "owner@example.com" })];
    renderHeader();
    expect(screen.getByRole("button", { name: "Leave calendar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit calendar" })).not.toBeInTheDocument();
    expect(screen.getByTitle("Shared by owner@example.com")).toBeInTheDocument();
  });

  it("leaves quietly when Google access went with it", async () => {
    state.calendars = [calendar({ role: "viewer" })];
    const { user } = renderHeader();
    await user.click(screen.getByRole("button", { name: "Leave calendar" }));
    await waitFor(() => expect(state.leaveCalendar).toHaveBeenCalledWith("cal-1"));
    expect(screen.queryByText(/google calendar access may still be active/i)).not.toBeInTheDocument();
  });

  it("warns that Google access may linger when it could not be removed", async () => {
    state.calendars = [calendar({ role: "viewer" })];
    state.leaveCalendar.mockResolvedValue({ googleAclRemoved: false });
    const { user } = renderHeader();
    await user.click(screen.getByRole("button", { name: "Leave calendar" }));
    expect(await screen.findByText(/google calendar access may still be active/i)).toBeInTheDocument();
  });

  it("says so when leaving fails, and lets the banner be dismissed", async () => {
    state.calendars = [calendar({ role: "viewer" })];
    state.leaveCalendar.mockRejectedValue(new Error("Failed to leave calendar"));
    const { user } = renderHeader();
    await user.click(screen.getByRole("button", { name: "Leave calendar" }));
    expect(await screen.findByText("Could not leave the calendar. Please try again.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("Could not leave the calendar. Please try again.")).not.toBeInTheDocument();
  });
});

describe("CalendarHeader banner", () => {
  it("clears itself after five seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      state.calendars = [calendar({ role: "viewer" })];
      state.leaveCalendar.mockRejectedValue(new Error("nope"));
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderHeader();
      await user.click(screen.getByRole("button", { name: "Leave calendar" }));
      const message = "Could not leave the calendar. Please try again.";
      expect(await screen.findByText(message)).toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(4_000);
      expect(screen.getByText(message)).toBeInTheDocument();
      await vi.advanceTimersByTimeAsync(2_000);
      await waitFor(() => expect(screen.queryByText(message)).not.toBeInTheDocument());
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("CalendarHeader with several calendars", () => {
  beforeEach(() => {
    state.calendars = [
      calendar({ id: "cal-1", name: "Personal" }),
      calendar({ id: "cal-2", name: "Work shared", role: "editor", color: "#ef4444" }),
    ];
  });

  it("says all calendars until one is chosen, then names the chosen one", () => {
    renderHeader({ selectedCalendarId: "cal-2" });
    expect(screen.getByRole("button", { name: /work shared/i })).toBeInTheDocument();
    expect(screen.queryByText("All calendars")).not.toBeInTheDocument();
  });

  it("starts on all calendars", () => {
    renderHeader();
    expect(screen.getByRole("button", { name: /all calendars/i })).toBeInTheDocument();
  });

  it("reports a calendar picked from the list and closes the list", async () => {
    const { onSelectCalendar, user } = renderHeader();
    await user.click(screen.getByRole("button", { name: /all calendars/i }));
    await user.click(screen.getByRole("button", { name: "Work shared" }));
    expect(onSelectCalendar).toHaveBeenCalledWith("cal-2");
    expect(screen.queryByRole("button", { name: "Edit Personal" })).not.toBeInTheDocument();
  });

  it("goes back to all calendars from the list", async () => {
    const { onSelectCalendar, user } = renderHeader({ selectedCalendarId: "cal-2" });
    await user.click(screen.getAllByRole("button", { name: "Work shared" })[0]);
    await user.click(screen.getByRole("button", { name: "All calendars" }));
    expect(onSelectCalendar).toHaveBeenCalledWith(null);
  });

  it("offers edit for the ones you own and leave for the ones shared with you", async () => {
    const { user } = renderHeader();
    await user.click(screen.getByRole("button", { name: /all calendars/i }));
    expect(screen.getByRole("button", { name: "Edit Personal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Leave Work shared" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Leave Personal" })).not.toBeInTheDocument();
  });

  it("closes the list on a click elsewhere", async () => {
    const { user } = renderHeader();
    await user.click(screen.getByRole("button", { name: /all calendars/i }));
    expect(screen.getByRole("button", { name: "Edit Personal" })).toBeInTheDocument();
    await user.click(document.body);
    expect(screen.queryByRole("button", { name: "Edit Personal" })).not.toBeInTheDocument();
  });

  it("leaves a shared calendar from the list", async () => {
    const { user } = renderHeader();
    await user.click(screen.getByRole("button", { name: /all calendars/i }));
    await user.click(screen.getByRole("button", { name: "Leave Work shared" }));
    await waitFor(() => expect(state.leaveCalendar).toHaveBeenCalledWith("cal-2"));
  });
});
