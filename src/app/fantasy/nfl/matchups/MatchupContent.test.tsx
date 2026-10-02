import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NflMatchupCard } from "./MatchupContent";
import type { NflMatchup } from "@/types/espn-nfl";

function side(overrides: Partial<NflMatchup["home"]>): NflMatchup["home"] {
  return {
    teamId: 1,
    name: "Team",
    abbrev: "TM",
    ownerName: "Owner",
    totalPoints: 0,
    remaining: 0,
    starters: [],
    bench: [],
    ...overrides,
  };
}

const matchup: NflMatchup = {
  id: 10,
  matchupPeriodId: 3,
  winner: "UNDECIDED",
  away: side({
    teamId: 1,
    name: "Paul's Perfect Team",
    abbrev: "PPT",
    ownerName: "Paul S",
    totalPoints: 24.5,
    remaining: 10,
    starters: [
      {
        playerId: 100,
        name: "Josh Allen",
        proTeamId: 4,
        positionId: 1,
        lineupSlotId: 0,
        actual: 24.5,
        projected: 21,
        started: true,
      },
    ],
  }),
  home: side({
    teamId: 2,
    name: "George's Great Team",
    abbrev: "GGT",
    ownerName: "George",
    totalPoints: 30,
    remaining: 8,
    starters: [
      {
        playerId: 200,
        name: "Bijan Robinson",
        proTeamId: 2,
        positionId: 2,
        lineupSlotId: 2,
        actual: 12,
        projected: 15,
        started: true,
      },
    ],
  }),
};

describe("NflMatchupCard", () => {
  it("shows both team names and owners", () => {
    render(<NflMatchupCard matchup={matchup} winProb={{ home: 0.62, away: 0.38 }} />);
    expect(screen.getByText("Paul's Perfect Team")).toBeInTheDocument();
    expect(screen.getByText("George's Great Team")).toBeInTheDocument();
    expect(screen.getByText("Paul S")).toBeInTheDocument();
  });

  it("renders each side's win probability as a percentage", () => {
    render(<NflMatchupCard matchup={matchup} winProb={{ home: 0.62, away: 0.38 }} />);
    expect(screen.getByText("62%")).toBeInTheDocument();
    expect(screen.getByText("38%")).toBeInTheDocument();
  });

  it("lists starters with their actual and projected points", () => {
    render(<NflMatchupCard matchup={matchup} winProb={{ home: 0.62, away: 0.38 }} />);
    expect(screen.getByText("Josh Allen")).toBeInTheDocument();
    expect(screen.getByText("Bijan Robinson")).toBeInTheDocument();
    // projected points surfaced somewhere on the card
    expect(screen.getAllByText(/proj/i).length).toBeGreaterThan(0);
  });

  it("carries each full name in a title, so a truncated name reads on hover", () => {
    render(<NflMatchupCard matchup={matchup} winProb={{ home: 0.62, away: 0.38 }} />);
    expect(screen.getByText("Josh Allen")).toHaveAttribute("title", "Josh Allen");
    expect(screen.getByText("Paul's Perfect Team")).toHaveAttribute("title", "Paul's Perfect Team");
    expect(screen.getByText("Paul S")).toHaveAttribute("title", "Paul S");
  });

  it("marks the starters involved in the selected scoring play, and only them", () => {
    render(
      <NflMatchupCard
        matchup={matchup}
        winProb={{ home: 0.62, away: 0.38 }}
        highlightedPlayerIds={new Set([100])}
      />,
    );
    const markers = screen.getAllByText("In selected play");
    expect(markers).toHaveLength(1);
    expect(markers[0].closest("[data-player-id]")).toHaveAttribute("data-player-id", "100");
  });

  it("marks nobody when no play is selected", () => {
    render(<NflMatchupCard matchup={matchup} winProb={{ home: 0.62, away: 0.38 }} />);
    expect(screen.queryByText("In selected play")).not.toBeInTheDocument();
  });
});
