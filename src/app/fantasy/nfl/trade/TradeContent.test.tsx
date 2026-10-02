import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TradeAnalyzer } from "./TradeContent";
import type { TradePlayer, TradePool } from "@/lib/nfl/trade";

function player(overrides: Partial<TradePlayer> & { playerId: number; name: string }): TradePlayer {
  return {
    positionId: 2,
    proTeamId: 8,
    fantasyTeamId: 1,
    injuryStatus: "ACTIVE",
    eligibleSlots: [2],
    thisWeek: 10,
    perGame: 10,
    opponents: { "5": 1 },
    sosRank: 16,
    ...overrides,
  };
}

const pool: TradePool = {
  season: 2026,
  currentWeek: 4,
  finalWeek: 5,
  slotCounts: { "2": 1 },
  teams: [
    { teamId: 1, name: "Paul's Perfect Team", ownerName: "Paul S" },
    { teamId: 2, name: "George's Great Team", ownerName: "George" },
    { teamId: 3, name: "Third Team", ownerName: "Third" },
  ],
  players: [
    player({ playerId: 1, name: "Derrick Henry", fantasyTeamId: 1, thisWeek: 15, perGame: 15, sosRank: 21 }),
    player({ playerId: 2, name: "Jahmyr Gibbs", fantasyTeamId: 2, thisWeek: 26, perGame: 26, sosRank: 12 }),
    player({ playerId: 3, name: "Saquon Barkley", fantasyTeamId: 3, thisWeek: 14, perGame: 14 }),
  ],
};

describe("TradeAnalyzer", () => {
  it("asks for players on both sides before it judges anything", () => {
    render(<TradeAnalyzer pool={pool} />);
    expect(screen.getByText(/add players to both sides/i)).toBeInTheDocument();
  });

  it("builds a trade from both rosters and names the winner and margin", async () => {
    const user = userEvent.setup();
    render(<TradeAnalyzer pool={pool} />);

    await user.selectOptions(screen.getByLabelText("Team A"), "1");
    await user.selectOptions(screen.getByLabelText("Team B"), "2");
    await user.click(screen.getByRole("checkbox", { name: /Derrick Henry/ }));
    await user.click(screen.getByRole("checkbox", { name: /Jahmyr Gibbs/ }));

    // Henry 15 for Gibbs 26: Paul's side gains 11, George's loses 11.
    const verdict = screen.getByRole("status");
    expect(verdict).toHaveTextContent(/Paul's Perfect Team wins/);
    expect(verdict).toHaveTextContent("22");

    const table = screen.getByRole("table", { name: /trade projection/i });
    expect(within(table).getByRole("row", { name: /this week/i })).toHaveTextContent("+11");
  });

  it("searches the league and starts a trade with the found player's team", async () => {
    const user = userEvent.setup();
    render(<TradeAnalyzer pool={pool} />);

    await user.type(screen.getByRole("searchbox", { name: /search players/i }), "barkley");
    await user.click(screen.getByRole("button", { name: /add saquon barkley/i }));

    expect(screen.getByLabelText("Team B")).toHaveValue("3");
    expect(screen.getByRole("checkbox", { name: /Saquon Barkley/ })).toBeChecked();
  });

  it("shows each player's strength of schedule in words, not only a number", async () => {
    const user = userEvent.setup();
    render(<TradeAnalyzer pool={pool} />);
    await user.selectOptions(screen.getByLabelText("Team A"), "1");
    expect(screen.getByRole("checkbox", { name: /Derrick Henry/ }).closest("li")).toHaveTextContent(
      /SOS 21 · easy/i,
    );
  });

  it("won't put the same team on both sides", async () => {
    const user = userEvent.setup();
    render(<TradeAnalyzer pool={pool} />);
    await user.selectOptions(screen.getByLabelText("Team A"), "1");
    const teamB = screen.getByLabelText("Team B");
    expect(within(teamB).queryByRole("option", { name: "Paul's Perfect Team" })).not.toBeInTheDocument();
  });
});
