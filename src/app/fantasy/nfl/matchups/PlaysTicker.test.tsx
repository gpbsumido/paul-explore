import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaysTickerList } from "./PlaysTicker";
import type { NflPlayAttribution } from "@/types/espn-nfl";

const attributed: NflPlayAttribution[] = [
  {
    play: {
      id: "1",
      text: "Dyami Brown 9 Yd pass from Trevor Lawrence (Cam Little Kick)",
      teamAbbrev: "JAX",
      period: 1,
      clock: "10:51",
      scoringType: "TD",
      awayScore: 7,
      homeScore: 0,
    },
    mentions: [
      { playerName: "Trevor Lawrence", fantasyTeamName: "Paul's Perfect Team" },
    ],
  },
];

describe("PlaysTickerList", () => {
  it("renders each play's text and fantasy team tag", () => {
    render(<PlaysTickerList plays={attributed} />);
    expect(
      screen.getByText(/Dyami Brown 9 Yd pass from Trevor Lawrence/),
    ).toBeInTheDocument();
    expect(screen.getByText("Paul's Perfect Team")).toBeInTheDocument();
  });

  it("renders an empty state when there are no attributed plays yet", () => {
    render(<PlaysTickerList plays={[]} />);
    expect(screen.getByText(/no scoring plays yet/i)).toBeInTheDocument();
  });
});
