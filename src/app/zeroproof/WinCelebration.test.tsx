import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import WinCelebration from "./WinCelebration";
import type { ZeroproofBet } from "@/lib/zeroproof/schemas";

const bet = (over: Partial<ZeroproofBet> = {}): ZeroproofBet => ({
  id: "1",
  walletId: "w",
  eventId: "e",
  market: "h2h",
  selection: "Home",
  oddsAmerican: 100,
  lineValue: null,
  closingOddsAmerican: null,
  clv: null,
  stakeCents: 1000,
  status: "won",
  placedAt: "2026-01-01T00:00:00.000Z",
  settledAt: "2026-01-02T00:00:00.000Z",
  ...over,
});

// Two fresh wins worth $10 and $20 → $30.00 total.
const WINS = [
  bet({ id: "w1", stakeCents: 1000, oddsAmerican: 100 }),
  bet({ id: "w2", stakeCents: 2000, oddsAmerican: 100 }),
];

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("WinCelebration", () => {
  it("celebrates newly-settled wins with the count and total", () => {
    render(<WinCelebration bets={WINS} />);
    expect(screen.getByText(/2 new wins/i)).toBeInTheDocument();
    expect(screen.getByText(/\$30\.00/)).toBeInTheDocument();
  });

  it("renders nothing when there are no wins", () => {
    const { container } = render(
      <WinCelebration bets={[bet({ status: "lost" })]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("dismisses and marks the wins seen, so they don't celebrate again", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<WinCelebration bets={WINS} />);
    await user.click(screen.getByRole("button", { name: /nice/i }));
    expect(screen.queryByText(/new wins/i)).not.toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem("zeroproof-seen-wins") ?? "[]"),
    ).toEqual(["w1", "w2"]);

    // A fresh visit with the same settled wins stays quiet.
    unmount();
    const { container } = render(<WinCelebration bets={WINS} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("only celebrates the wins not seen before, and counts only those", () => {
    window.localStorage.setItem("zeroproof-seen-wins", JSON.stringify(["w1"]));
    render(<WinCelebration bets={WINS} />);
    expect(screen.getByText("1 new win")).toBeInTheDocument();
    expect(screen.getByText("$20.00")).toBeInTheDocument();
  });

  it("does not celebrate bets that lost, pushed or are still open", () => {
    const { container } = render(
      <WinCelebration
        bets={[
          bet({ id: "l", status: "lost" }),
          bet({ id: "p", status: "push" }),
          bet({ id: "o", status: "open", settledAt: null }),
        ]}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("still shows the win, without motion, when reduced motion is set", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("reduce"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      })),
    );
    const { container } = render(<WinCelebration bets={WINS} />);
    expect(screen.getByText(/2 new wins/i)).toBeInTheDocument();
    expect(container.querySelector(".animate-ping")).toBeNull();
  });

  it("sparkles when motion is allowed", () => {
    const { container } = render(<WinCelebration bets={WINS} />);
    expect(container.querySelectorAll(".animate-ping").length).toBeGreaterThan(0);
  });

  it("announces politely and has no accessibility violations", async () => {
    const { container } = render(<WinCelebration bets={WINS} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
