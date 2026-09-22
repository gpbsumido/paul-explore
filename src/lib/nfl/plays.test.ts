import { describe, it, expect } from "vitest";
import { eventIdsByAbbrev, parseScoringPlays, attributePlays } from "./plays";

function scoreboard(games: { id: string; away: string; home: string }[]) {
  return {
    events: games.map((g) => ({
      id: g.id,
      competitions: [
        {
          competitors: [
            { team: { abbreviation: g.away } },
            { team: { abbreviation: g.home } },
          ],
        },
      ],
    })),
  };
}

describe("eventIdsByAbbrev", () => {
  it("maps every team abbreviation in the scoreboard to its event id", () => {
    const map = eventIdsByAbbrev(
      scoreboard([
        { id: "401772725", away: "JAX", home: "CIN" },
        { id: "401772726", away: "BUF", home: "LAC" },
      ]),
    );
    expect(map.get("JAX")).toBe("401772725");
    expect(map.get("CIN")).toBe("401772725");
    expect(map.get("BUF")).toBe("401772726");
  });

  it("degrades to an empty map on a payload that isn't a scoreboard", () => {
    expect(eventIdsByAbbrev({ nope: true }).size).toBe(0);
  });
});

function scoringPlay(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "401772725265",
    type: { id: "67", text: "Passing Touchdown" },
    text: "Dyami Brown 9 Yd pass from Trevor Lawrence (Cam Little Kick)",
    awayScore: 7,
    homeScore: 0,
    period: { number: 1 },
    clock: { value: 651, displayValue: "10:51" },
    team: { id: "30", abbreviation: "JAX" },
    scoringType: { name: "touchdown", displayName: "Touchdown", abbreviation: "TD" },
    ...overrides,
  };
}

describe("parseScoringPlays", () => {
  it("reads text, team, period, clock, and running score off a real summary shape", () => {
    const plays = parseScoringPlays({ scoringPlays: [scoringPlay()] });
    expect(plays).toEqual([
      {
        id: "401772725265",
        text: "Dyami Brown 9 Yd pass from Trevor Lawrence (Cam Little Kick)",
        teamAbbrev: "JAX",
        period: 1,
        clock: "10:51",
        scoringType: "TD",
        awayScore: 7,
        homeScore: 0,
      },
    ]);
  });

  it("degrades to an empty list on a payload with no scoringPlays", () => {
    expect(parseScoringPlays({ nope: true })).toEqual([]);
  });
});

describe("attributePlays", () => {
  const roster = [
    { name: "Trevor Lawrence", fantasyTeamName: "Paul's Perfect Team" },
    { name: "Dyami Brown", fantasyTeamName: "Paul's Perfect Team" },
    { name: "Bijan Robinson", fantasyTeamName: "George's Great Team" },
  ];

  it("tags a play with every rostered name it mentions", () => {
    const plays = parseScoringPlays({ scoringPlays: [scoringPlay()] });
    const attributed = attributePlays(plays, roster);
    expect(attributed).toHaveLength(1);
    expect(attributed[0].mentions).toEqual(
      expect.arrayContaining([
        { playerName: "Trevor Lawrence", fantasyTeamName: "Paul's Perfect Team" },
        { playerName: "Dyami Brown", fantasyTeamName: "Paul's Perfect Team" },
      ]),
    );
  });

  it("drops plays that mention nobody rostered", () => {
    const plays = parseScoringPlays({
      scoringPlays: [scoringPlay({ text: "Someone Else 2 Yd run" })],
    });
    expect(attributePlays(plays, roster)).toEqual([]);
  });
});
