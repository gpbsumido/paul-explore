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
    recThisWeek: 0,
    recPerGame: 0,
    onIr: false,
    droppable: true,
    tradeLocked: false,
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
    player({ playerId: 1, name: "Derrick Henry", fantasyTeamId: 1, thisWeek: 15, perGame: 15, sosRank: 21, recThisWeek: 2, recPerGame: 2 }),
    player({ playerId: 2, name: "Jahmyr Gibbs", fantasyTeamId: 2, thisWeek: 26, perGame: 26, sosRank: 12, recThisWeek: 4, recPerGame: 4 }),
    player({ playerId: 3, name: "Saquon Barkley", fantasyTeamId: 3, thisWeek: 14, perGame: 14 }),
  ],
  format: { teams: 6, ppr: 1, tePremium: 0, passTdPoints: 4, superflex: true },
  rosterMax: null,
  positionLimits: {},
  freeAgents: [],
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
    expect(verdict).toHaveTextContent(/Paul's Perfect Team wins this trade over the rest of the season/);
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

  it("states the league's own scoring format", () => {
    render(<TradeAnalyzer pool={pool} />);
    expect(
      screen.getByText("6 teams · Superflex · Full PPR · No TE premium · 4-pt passing TD"),
    ).toBeInTheDocument();
  });

  it("re-scores the trade under a hypothetical format, says so, and resets", async () => {
    const user = userEvent.setup();
    render(<TradeAnalyzer pool={pool} />);
    await user.selectOptions(screen.getByLabelText("Team B"), "2");
    await user.click(screen.getByRole("checkbox", { name: /Derrick Henry/ }));
    await user.click(screen.getByRole("checkbox", { name: /Jahmyr Gibbs/ }));
    const row = () =>
      within(screen.getByRole("table", { name: /trade projection/i })).getByRole("row", { name: /this week/i });
    expect(row()).toHaveTextContent("+11.0");

    // Non-PPR: Henry 15 - 2 = 13 for Gibbs 26 - 4 = 22.
    await user.selectOptions(screen.getByLabelText("Points per reception"), "0");
    expect(row()).toHaveTextContent("+9.0");
    expect(screen.getByText(/hypothetical scoring/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reset to league scoring/i }));
    expect(row()).toHaveTextContent("+11.0");
    expect(screen.queryByText(/hypothetical scoring/i)).toBeNull();
  });

  it("lists the drop and the waiver pickup a lopsided trade forces", async () => {
    const user = userEvent.setup();
    const full: TradePool = {
      ...pool,
      rosterMax: 2,
      players: [
        player({ playerId: 1, name: "Derrick Henry", fantasyTeamId: 1, thisWeek: 15, perGame: 15 }),
        player({ playerId: 4, name: "Bench One", fantasyTeamId: 1, thisWeek: 1, perGame: 1 }),
        player({ playerId: 2, name: "Jahmyr Gibbs", fantasyTeamId: 2, thisWeek: 26, perGame: 26 }),
        player({ playerId: 5, name: "Other Back", fantasyTeamId: 2, thisWeek: 5, perGame: 5 }),
      ],
      freeAgents: [player({ playerId: 30, name: "Jaylen Warren", fantasyTeamId: 0, thisWeek: 8, perGame: 8 })],
    };
    render(<TradeAnalyzer pool={full} />);
    await user.selectOptions(screen.getByLabelText("Team B"), "2");
    await user.click(screen.getByRole("checkbox", { name: /Derrick Henry/ }));
    await user.click(screen.getByRole("checkbox", { name: /Bench One/ }));
    await user.click(screen.getByRole("checkbox", { name: /Jahmyr Gibbs/ }));

    const moves = screen.getByRole("list", { name: /roster moves/i });
    expect(moves).toHaveTextContent(/Paul's Perfect Team picks up Jaylen Warren/);
    expect(moves).toHaveTextContent(/George's Great Team drops Bench One/);
  });

  it("adds a value-over-waiver row for positional scarcity", async () => {
    const user = userEvent.setup();
    render(<TradeAnalyzer pool={pool} />);
    await user.selectOptions(screen.getByLabelText("Team B"), "2");
    await user.click(screen.getByRole("checkbox", { name: /Derrick Henry/ }));
    await user.click(screen.getByRole("checkbox", { name: /Jahmyr Gibbs/ }));
    expect(
      within(screen.getByRole("table", { name: /trade projection/i })).getByRole("row", { name: /value over waiver/i }),
    ).toBeInTheDocument();
  });
});

