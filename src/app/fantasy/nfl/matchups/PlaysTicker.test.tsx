import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlaysTickerPanel } from "./PlaysTicker";
import type { NflMatchup, NflPlayAttribution, NflScoringPlay } from "@/types/espn-nfl";

function play(overrides: Partial<NflScoringPlay>): NflScoringPlay {
  return {
    id: "1",
    text: "Dyami Brown 9 Yd pass from Trevor Lawrence (Cam Little Kick)",
    teamAbbrev: "JAX",
    period: 1,
    clock: "10:51",
    scoringType: "TD",
    awayScore: 7,
    homeScore: 0,
    ...overrides,
  };
}

const plays: NflPlayAttribution[] = [
  {
    play: play({ id: "td" }),
    mentions: [
      { playerId: 1, playerName: "Trevor Lawrence", positionId: 1, fantasyTeamId: 1, fantasyTeamName: "Paul's Perfect Team", matchupId: 10 },
      { playerId: 2, playerName: "Dyami Brown", positionId: 3, fantasyTeamId: 1, fantasyTeamName: "Paul's Perfect Team", matchupId: 10 },
    ],
  },
  {
    play: play({ id: "fg", text: "Harrison Butker 44 Yd Field Goal", teamAbbrev: "KC", scoringType: "FG" }),
    mentions: [
      { playerId: 9, playerName: "Harrison Butker", positionId: 5, fantasyTeamId: 2, fantasyTeamName: "George's Great Team", matchupId: 10 },
    ],
  },
];

function side(teamId: number, name: string): NflMatchup["home"] {
  return { teamId, name, abbrev: "", ownerName: "", totalPoints: 0, remaining: 0, starters: [], bench: [] };
}

const matchups: NflMatchup[] = [
  { id: 10, matchupPeriodId: 3, winner: "UNDECIDED", away: side(1, "Paul's Perfect Team"), home: side(2, "George's Great Team") },
];

function renderPanel(overrides: Partial<Parameters<typeof PlaysTickerPanel>[0]> = {}) {
  const onSelectPlay = vi.fn();
  render(
    <PlaysTickerPanel
      plays={plays}
      matchups={matchups}
      status="ready"
      selectedPlayId={null}
      onSelectPlay={onSelectPlay}
      {...overrides}
    />,
  );
  return { onSelectPlay };
}

describe("PlaysTickerPanel", () => {
  it("renders each play's text and fantasy team tag", () => {
    renderPanel();
    expect(screen.getByText(/Dyami Brown 9 Yd pass from Trevor Lawrence/)).toBeInTheDocument();
    expect(screen.getAllByText("Paul's Perfect Team").length).toBeGreaterThan(0);
  });

  it("renders an empty state when there are no attributed plays yet", () => {
    renderPanel({ plays: [] });
    expect(screen.getByText(/no scoring plays yet/i)).toBeInTheDocument();
  });

  it("collapses to its header and expands again", async () => {
    const user = userEvent.setup();
    renderPanel();
    const toggle = screen.getByRole("button", { name: "Recent scoring plays (2)" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/Harrison Butker 44 Yd/)).not.toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Harrison Butker 44 Yd/)).toBeInTheDocument();
  });

  it("filters by type of score, position, NFL team, matchup and fantasy team", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.selectOptions(screen.getByLabelText("Score type"), "FG");
    expect(screen.queryByText(/Dyami Brown 9 Yd/)).not.toBeInTheDocument();
    expect(screen.getByText(/Harrison Butker 44 Yd/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Score type"), "");

    await user.selectOptions(screen.getByLabelText("Position"), "QB");
    expect(screen.getByText(/Dyami Brown 9 Yd/)).toBeInTheDocument();
    expect(screen.queryByText(/Harrison Butker 44 Yd/)).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Position"), "");

    await user.selectOptions(screen.getByLabelText("NFL team"), "KC");
    expect(screen.queryByText(/Dyami Brown 9 Yd/)).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("NFL team"), "");

    await user.selectOptions(screen.getByLabelText("Fantasy team"), "George's Great Team");
    expect(screen.queryByText(/Dyami Brown 9 Yd/)).not.toBeInTheDocument();
    expect(screen.getByText(/Harrison Butker 44 Yd/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Fantasy team"), "");

    await user.selectOptions(screen.getByLabelText("Matchup"), "Paul's Perfect Team vs George's Great Team");
    expect(screen.getByText(/Dyami Brown 9 Yd/)).toBeInTheDocument();
    expect(screen.getByText(/Harrison Butker 44 Yd/)).toBeInTheDocument();
  });

  it("says so, with a way out, when the filters match nothing", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.selectOptions(screen.getByLabelText("Score type"), "FG");
    await user.selectOptions(screen.getByLabelText("Position"), "QB");
    expect(screen.getByText(/no plays match these filters/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(screen.getByText(/Dyami Brown 9 Yd/)).toBeInTheDocument();
  });

  it("reports the clicked play and its starters so the cards can highlight them", async () => {
    const user = userEvent.setup();
    const { onSelectPlay } = renderPanel();
    const list = screen.getByRole("list");
    const tdButton = within(list).getByRole("button", { name: /Dyami Brown 9 Yd/ });
    expect(tdButton).toHaveAttribute("aria-pressed", "false");

    await user.click(tdButton);
    expect(onSelectPlay).toHaveBeenLastCalledWith({ playId: "td", playerIds: [1, 2] });
  });

  it("shows the selected play as pressed and clears it on a second click", async () => {
    const user = userEvent.setup();
    const { onSelectPlay } = renderPanel({ selectedPlayId: "td" });
    const tdButton = screen.getByRole("button", { name: /Dyami Brown 9 Yd/ });
    expect(tdButton).toHaveAttribute("aria-pressed", "true");

    await user.click(tdButton);
    expect(onSelectPlay).toHaveBeenLastCalledWith(null);
  });
});
