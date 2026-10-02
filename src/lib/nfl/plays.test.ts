import { describe, it, expect } from "vitest";
import {
  attributePlays,
  eventIdsByAbbrev,
  filterPlays,
  parseScoringPlays,
  playFilterOptions,
  rosterStarters,
  type RosterStarter,
} from "./plays";
import type { NflMatchup, NflMatchupSide, NflPlayerLine } from "@/types/espn-nfl";

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
  const roster: RosterStarter[] = [
    { playerId: 1, name: "Trevor Lawrence", positionId: 1, fantasyTeamId: 1, fantasyTeamName: "Paul's Perfect Team", matchupId: 10 },
    { playerId: 2, name: "Dyami Brown", positionId: 3, fantasyTeamId: 1, fantasyTeamName: "Paul's Perfect Team", matchupId: 10 },
    { playerId: 3, name: "Bijan Robinson", positionId: 2, fantasyTeamId: 2, fantasyTeamName: "George's Great Team", matchupId: 10 },
  ];

  it("tags a play with every rostered starter it mentions, ids and all", () => {
    const plays = parseScoringPlays({ scoringPlays: [scoringPlay()] });
    const attributed = attributePlays(plays, roster);
    expect(attributed).toHaveLength(1);
    expect(attributed[0].mentions).toEqual(
      expect.arrayContaining([
        { playerId: 1, playerName: "Trevor Lawrence", positionId: 1, fantasyTeamId: 1, fantasyTeamName: "Paul's Perfect Team", matchupId: 10 },
        { playerId: 2, playerName: "Dyami Brown", positionId: 3, fantasyTeamId: 1, fantasyTeamName: "Paul's Perfect Team", matchupId: 10 },
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

function line(overrides: Partial<NflPlayerLine>): NflPlayerLine {
  return {
    playerId: 0,
    name: "",
    proTeamId: 0,
    positionId: 0,
    lineupSlotId: 0,
    actual: 0,
    projected: 0,
    started: true,
    ...overrides,
  };
}

function side(teamId: number, name: string, starters: NflPlayerLine[]): NflMatchupSide {
  return { teamId, name, abbrev: "", ownerName: "", totalPoints: 0, remaining: 0, starters, bench: [] };
}

describe("rosterStarters", () => {
  it("lists every starter with their fantasy team and matchup", () => {
    const matchups: NflMatchup[] = [
      {
        id: 10,
        matchupPeriodId: 3,
        winner: "UNDECIDED",
        away: side(1, "Paul's Perfect Team", [line({ playerId: 7, name: "Josh Allen", positionId: 1 })]),
        home: side(2, "George's Great Team", [line({ playerId: 8, name: "Bijan Robinson", positionId: 2 })]),
      },
    ];
    expect(rosterStarters(matchups)).toEqual([
      { playerId: 7, name: "Josh Allen", positionId: 1, fantasyTeamId: 1, fantasyTeamName: "Paul's Perfect Team", matchupId: 10 },
      { playerId: 8, name: "Bijan Robinson", positionId: 2, fantasyTeamId: 2, fantasyTeamName: "George's Great Team", matchupId: 10 },
    ]);
  });
});

describe("filterPlays", () => {
  const td = {
    play: { ...parseScoringPlays({ scoringPlays: [scoringPlay()] })[0], id: "td", teamAbbrev: "JAX", scoringType: "TD" },
    mentions: [
      { playerId: 1, playerName: "Trevor Lawrence", positionId: 1, fantasyTeamId: 1, fantasyTeamName: "Paul's Perfect Team", matchupId: 10 },
      { playerId: 2, playerName: "Dyami Brown", positionId: 3, fantasyTeamId: 2, fantasyTeamName: "George's Great Team", matchupId: 10 },
    ],
  };
  const fg = {
    play: { ...td.play, id: "fg", teamAbbrev: "KC", scoringType: "FG" },
    mentions: [
      { playerId: 9, playerName: "Harrison Butker", positionId: 5, fantasyTeamId: 3, fantasyTeamName: "Third Team", matchupId: 11 },
    ],
  };
  const plays = [td, fg];
  const ids = (filters: Parameters<typeof filterPlays>[1]) =>
    filterPlays(plays, filters).map((p) => p.play.id);

  it("keeps everything with no filters set", () => {
    expect(ids({})).toEqual(["td", "fg"]);
  });

  it("narrows by the type of score", () => {
    expect(ids({ scoringType: "FG" })).toEqual(["fg"]);
  });

  it("narrows by the NFL team that scored", () => {
    expect(ids({ nflTeam: "JAX" })).toEqual(["td"]);
  });

  it("narrows by a mentioned player's position", () => {
    expect(ids({ positionId: 5 })).toEqual(["fg"]);
    expect(ids({ positionId: 3 })).toEqual(["td"]);
  });

  it("narrows by fantasy team and by matchup", () => {
    expect(ids({ fantasyTeamId: 2 })).toEqual(["td"]);
    expect(ids({ matchupId: 11 })).toEqual(["fg"]);
  });

  it("requires one mention to satisfy every player-level filter at once", () => {
    // Lawrence is the QB but plays for team 1; Brown plays for team 2 but is a WR.
    expect(ids({ positionId: 1, fantasyTeamId: 2 })).toEqual([]);
    expect(ids({ positionId: 1, fantasyTeamId: 1 })).toEqual(["td"]);
  });

  it("offers only the options that appear in the plays, sorted", () => {
    expect(playFilterOptions(plays)).toEqual({
      positionIds: [1, 3, 5],
      scoringTypes: ["FG", "TD"],
      nflTeams: ["JAX", "KC"],
    });
  });
});
