import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import ComparePanel from "./ComparePanel";
import { playerHandle } from "@/lib/zeroproof/format";
import type {
  LeaderboardEntry,
  ProfileStats,
  ZeroproofBet,
} from "@/lib/zeroproof/schemas";

const myStats: ProfileStats = {
  wins: 18,
  losses: 11,
  pushes: 2,
  betCount: 29,
  roiPct: 8.4,
  currentStreak: 3,
  longestStreak: 6,
  biggestHitCents: 4200,
  clvAvgPct: 2.1,
  sharpScore: 72.5,
};

const entries: LeaderboardEntry[] = [
  { userSub: "auth0|sharp-one", wins: 41, losses: 22, pushes: 3, betCount: 63, roiPct: 14.2, sharpScore: 88.5 },
  { userSub: "auth0|sharp-two", wins: 30, losses: 28, pushes: 1, betCount: 58, roiPct: 3.1, sharpScore: 61.0 },
];

const openBets: ZeroproofBet[] = [
  {
    id: "o1",
    walletId: "w",
    eventId: "e",
    market: "h2h",
    selection: "Lakers",
    oddsAmerican: -110,
    lineValue: null,
    closingOddsAmerican: null,
    clv: null,
    stakeCents: 2000,
    status: "open",
    placedAt: "2026-09-08T00:00:00.000Z",
    settledAt: null,
  },
];

describe("ComparePanel", () => {
  it("shows where I rank against the field", () => {
    render(<ComparePanel myStats={myStats} entries={entries} openBets={openBets} />);
    // ROI 8.4 beats one of {14.2, 3.1} → rank 2 of 3.
    expect(screen.getByText("#2 of 3")).toBeInTheDocument();
  });

  it("compares me to the selected player across the metrics", () => {
    render(<ComparePanel myStats={myStats} entries={entries} openBets={openBets} />);
    expect(screen.getByText("Win rate")).toBeInTheDocument();
    expect(screen.getByText("Sharp score")).toBeInTheDocument();
    // my ROI and the leader's ROI both on screen
    expect(screen.getByText("+8.4%")).toBeInTheDocument();
    expect(screen.getByText("+14.2%")).toBeInTheDocument();
  });

  it("leaves me out of the players I can compare against", () => {
    // The leaderboard includes me; I can't stack up against myself.
    const withMe: LeaderboardEntry[] = [
      { userSub: "auth0|me", wins: 18, losses: 11, pushes: 2, betCount: 29, roiPct: 8.4, sharpScore: 72.5 },
      ...entries,
    ];
    render(
      <ComparePanel
        myStats={myStats}
        myUserSub="auth0|me"
        entries={withMe}
        openBets={openBets}
      />,
    );
    const select = screen.getByRole("combobox", { name: /compare against/i });
    expect(within(select).queryByText(playerHandle("auth0|me"))).toBeNull();
    expect(within(select).getByText(playerHandle("auth0|sharp-one"))).toBeInTheDocument();
    // Ranking counts the field once: me plus the two others.
    expect(screen.getByText("#2 of 3")).toBeInTheDocument();
  });

  it("lets me pick a different player to compare against", async () => {
    const user = userEvent.setup();
    render(<ComparePanel myStats={myStats} entries={entries} openBets={openBets} />);
    await user.selectOptions(
      screen.getByRole("combobox", { name: /compare against/i }),
      playerHandle(entries[1].userSub),
    );
    expect(screen.getByText("+3.1%")).toBeInTheDocument();
  });

  it("lists my upcoming bets", () => {
    render(<ComparePanel myStats={myStats} entries={entries} openBets={openBets} />);
    const upcoming = screen.getByRole("region", { name: /upcoming/i });
    expect(within(upcoming).getByText(/Lakers/)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <ComparePanel myStats={myStats} entries={entries} openBets={openBets} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
