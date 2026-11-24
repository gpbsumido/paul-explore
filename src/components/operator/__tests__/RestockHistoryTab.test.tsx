import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RestockHistoryTab, {
  completedFirstNewestFirst,
  sessionOutcome,
} from "../RestockHistoryTab";
import type { UseRestockHistoryReturn } from "@/hooks/useRestockHistory";

const history = vi.hoisted(() => ({
  current: { sessions: [], loading: false, error: null } as UseRestockHistoryReturn,
}));
vi.mock("@/hooks/useRestockHistory", () => ({
  useRestockHistory: () => history.current,
}));

beforeEach(() => {
  history.current = { sessions: [], loading: false, error: null };
});
import type { RestockSession, RestockLine } from "@/types/operator";

const session = (over: Partial<RestockSession> = {}): RestockSession => ({
  id: "s1",
  storeId: "store-04",
  startedAt: "2026-02-01T10:00:00.000Z",
  completedAt: "2026-02-01T11:00:00.000Z",
  actor: "casey",
  notes: null,
  ...over,
});

const line = (over: Partial<RestockLine> = {}): RestockLine => ({
  id: "l1",
  sessionId: "s1",
  itemId: "i1",
  expectedQty: 10,
  countedQty: 10,
  added: 0,
  removed: 0,
  removalReason: null,
  resultingStock: 10,
  countStatus: "matches-expected",
  ...over,
});

describe("completedFirstNewestFirst", () => {
  it("puts the most recently completed session at the top", () => {
    const older = session({ id: "old", completedAt: "2026-01-01T00:00:00Z" });
    const newer = session({ id: "new", completedAt: "2026-03-01T00:00:00Z" });

    expect(completedFirstNewestFirst([older, newer]).map((s) => s.id)).toEqual([
      "new",
      "old",
    ]);
  });

  it("keeps an in-progress session above finished ones, since it is the one to act on", () => {
    const done = session({ id: "done", completedAt: "2026-03-01T00:00:00Z" });
    const open = session({ id: "open", completedAt: null });

    expect(completedFirstNewestFirst([done, open]).map((s) => s.id)).toEqual([
      "open",
      "done",
    ]);
  });

  it("does not mutate the array it was given", () => {
    const input = [
      session({ id: "a", completedAt: "2026-01-01T00:00:00Z" }),
      session({ id: "b", completedAt: "2026-02-01T00:00:00Z" }),
    ];
    completedFirstNewestFirst(input);
    expect(input.map((s) => s.id)).toEqual(["a", "b"]);
  });
});

describe("sessionOutcome", () => {
  it("totals what was counted, added, and removed across the lines", () => {
    const out = sessionOutcome([
      line({ id: "a", added: 3, removed: 1 }),
      line({ id: "b", added: 2, removed: 4 }),
    ]);

    expect(out.counted).toBe(2);
    expect(out.added).toBe(5);
    expect(out.removed).toBe(5);
  });

  it("does not count a line nobody actually counted", () => {
    const out = sessionOutcome([
      line({ id: "a", countedQty: 7, countStatus: "matches-expected" }),
      line({ id: "b", countedQty: null, countStatus: "not-counted" }),
    ]);

    expect(out.counted).toBe(1);
  });

  it("surfaces the removal reasons, which is what the shrink report is asking about", () => {
    const out = sessionOutcome([
      line({ id: "a", removed: 2, removalReason: "expired" }),
      line({ id: "b", removed: 1, removalReason: "damaged" }),
      line({ id: "c", removed: 1, removalReason: "expired" }),
      line({ id: "d", removed: 0, removalReason: null }),
    ]);

    expect(out.reasons).toEqual(["expired", "damaged"]);
  });

  it("reports zeroes for a session with no lines rather than throwing", () => {
    const out = sessionOutcome([]);

    expect(out).toEqual({ counted: 0, added: 0, removed: 0, reasons: [] });
  });
});

describe("sessionOutcome edge cases", () => {
  it("ignores a removal reason on a line where nothing was removed", () => {
    const out = sessionOutcome([
      line({ id: "a", removed: 0, removalReason: "expired" }),
    ]);

    expect(out.reasons).toEqual([]);
  });

  it("ignores a removal with no reason given", () => {
    const out = sessionOutcome([line({ id: "a", removed: 3, removalReason: null })]);

    expect(out.reasons).toEqual([]);
    expect(out.removed).toBe(3);
  });
});

describe("RestockHistoryTab", () => {
  it("shows the failure message instead of a list when the history could not load", () => {
    history.current = { sessions: [], loading: false, error: "Failed to load restock history." };
    render(<RestockHistoryTab storeId="store-04" />);

    expect(screen.getByText("Failed to load restock history.")).toBeInTheDocument();
    expect(screen.queryByText(/no restock counts/i)).not.toBeInTheDocument();
  });

  it("shows placeholders while the first load is in flight", () => {
    history.current = { sessions: [], loading: true, error: null };
    const { container } = render(<RestockHistoryTab storeId="store-04" />);

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText(/no restock counts/i)).not.toBeInTheDocument();
  });

  it("keeps showing the sessions it has while a refetch is in flight", () => {
    history.current = { sessions: [session()], loading: true, error: null };
    const { container } = render(<RestockHistoryTab storeId="store-04" />);

    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    expect(screen.getByText("Counted by casey")).toBeInTheDocument();
  });

  it("explains the empty state and links to starting a restock for this store", () => {
    render(<RestockHistoryTab storeId="store-04" />);

    expect(screen.getByText(/no restock counts recorded/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start a restock" })).toHaveAttribute(
      "href",
      "/operator/stores/store-04?tab=inventory",
    );
  });

  it("lists an in-progress count first, flagged, then finished ones newest first", () => {
    history.current = {
      sessions: [
        session({ id: "old", actor: "old-actor", completedAt: "2026-01-01T12:00:00Z" }),
        session({ id: "open", actor: "open-actor", completedAt: null }),
        session({ id: "new", actor: "new-actor", completedAt: "2026-03-01T12:00:00Z" }),
      ],
      loading: false,
      error: null,
    };
    render(<RestockHistoryTab storeId="store-04" />);

    const rows = screen.getAllByRole("button").map((button) => button.textContent);
    expect(rows[0]).toContain("open-actor");
    expect(rows[0]).toContain("In progress");
    expect(rows[1]).toContain("new-actor");
    expect(rows[2]).toContain("old-actor");
    expect(rows[1]).not.toContain("In progress");
  });

  it("shows who counted it and any note, or says it is unattributed", () => {
    history.current = {
      sessions: [
        session({ id: "a", actor: "casey", notes: "back stockroom" }),
        session({ id: "b", actor: null, notes: null, completedAt: "2026-01-01T12:00:00Z" }),
      ],
      loading: false,
      error: null,
    };
    render(<RestockHistoryTab storeId="store-04" />);

    expect(screen.getByText("Counted by casey · back stockroom")).toBeInTheDocument();
    expect(screen.getByText("Unattributed")).toBeInTheDocument();
  });

  it("opens one row's details at a time, and closes it again", async () => {
    const user = userEvent.setup();
    history.current = {
      sessions: [
        session({ id: "a", actor: "first" }),
        session({ id: "b", actor: "second", completedAt: "2026-01-01T12:00:00Z" }),
      ],
      loading: false,
      error: null,
    };
    render(<RestockHistoryTab storeId="store-04" />);
    const [first, second] = screen.getAllByRole("button");

    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByText(/start a new count/i)).toHaveLength(2);

    await user.click(second);
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(second).toHaveAttribute("aria-expanded", "true");

    await user.click(second);
    expect(second).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /new count|resume/i })).not.toBeInTheDocument();
  });

  it("offers to resume a count that was never finished", async () => {
    const user = userEvent.setup();
    history.current = {
      sessions: [session({ id: "open", completedAt: null })],
      loading: false,
      error: null,
    };
    render(<RestockHistoryTab storeId="store-04" />);

    await user.click(screen.getByRole("button"));

    expect(screen.getByText(/never finished/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /resume count/i })).toHaveAttribute(
      "href",
      "/operator/stores/store-04?tab=inventory",
    );
  });
});
