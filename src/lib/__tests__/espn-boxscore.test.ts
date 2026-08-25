import { describe, it, expect } from "vitest";
import {
  pointsIndex,
  completedEventIds,
  latestCompletedSlate,
  performancesFromBoxscore,
} from "../espn-boxscore";

const NBA_KEYS = [
  "minutes", "points", "fieldGoalsMade-fieldGoalsAttempted",
  "threePointFieldGoalsMade-threePointFieldGoalsAttempted",
];
const WNBA_TAIL_KEYS = ["minutes", "rebounds", "assists", "points"];

/** A minimal ESPN summary payload with two teams and given athlete lines. */
const summary = (seasonType = 2) => ({
  header: {
    season: { type: seasonType },
    competitions: [
      {
        competitors: [
          { id: "19", homeAway: "home", winner: true, team: { abbreviation: "ORL" } },
          { id: "30", homeAway: "away", winner: false, team: { abbreviation: "CHA" } },
        ],
      },
    ],
  },
  boxscore: {
    players: [
      {
        team: { id: "19", abbreviation: "ORL" },
        statistics: [
          {
            keys: NBA_KEYS,
            athletes: [
              { athlete: { id: "111", displayName: "Home Star" }, didNotPlay: false, stats: ["36", "41", "14-20", "5-9"] },
              { athlete: { id: "112", displayName: "Bench DNP" }, didNotPlay: true, stats: [] },
            ],
          },
        ],
      },
      {
        team: { id: "30", abbreviation: "CHA" },
        statistics: [
          {
            keys: NBA_KEYS,
            athletes: [
              { athlete: { id: "113", displayName: "Away Guy" }, didNotPlay: false, stats: ["30", "12", "5-12", "1-4"] },
            ],
          },
        ],
      },
    ],
  },
});

describe("pointsIndex", () => {
  it("finds points regardless of column order", () => {
    expect(pointsIndex(NBA_KEYS)).toBe(1);
    expect(pointsIndex(WNBA_TAIL_KEYS)).toBe(3);
  });
  it("returns -1 when there is no points column", () => {
    expect(pointsIndex(["minutes", "rebounds"])).toBe(-1);
  });
});

describe("completedEventIds", () => {
  it("returns only games that have finished", () => {
    const scoreboard = {
      events: [
        { id: "1", status: { type: { state: "post" } } },
        { id: "2", status: { type: { state: "in" } } },
        { id: "3", status: { type: { state: "pre" } } },
        { id: "4", status: { type: { state: "post" } } },
      ],
    };
    expect(completedEventIds(scoreboard)).toEqual(["1", "4"]);
  });
  it("returns [] for a payload that isn't a scoreboard", () => {
    expect(completedEventIds({ nope: true })).toEqual([]);
  });
});

describe("latestCompletedSlate", () => {
  const sb = (events: { id: string; date: string; state: string }[]) => ({
    events: events.map((e) => ({
      id: e.id,
      date: e.date,
      status: { type: { state: e.state } },
    })),
  });

  it("picks the most recent date with completed games and its event ids", () => {
    const slate = latestCompletedSlate(
      sb([
        { id: "a", date: "2026-04-16T23:00Z", state: "post" },
        { id: "b", date: "2026-04-17T23:00Z", state: "post" },
        { id: "c", date: "2026-04-17T01:30Z", state: "post" },
        { id: "d", date: "2026-04-18T23:00Z", state: "pre" },
      ]),
    );
    expect(slate?.date).toBe("2026-04-17");
    expect(slate?.eventIds.sort()).toEqual(["b", "c"]);
  });

  it("returns null when no game has finished", () => {
    expect(
      latestCompletedSlate(sb([{ id: "a", date: "2026-10-03T23:00Z", state: "pre" }])),
    ).toBeNull();
  });

  it("returns null for a payload that isn't a scoreboard", () => {
    expect(latestCompletedSlate({ nope: true })).toBeNull();
  });
});

describe("performancesFromBoxscore", () => {
  it("maps points, opponent, home/away, and who won from the summary", () => {
    const perfs = performancesFromBoxscore(summary(), { sport: "nba", date: "2026-04-17" });
    const star = perfs.find((p) => p.playerId === 111);
    expect(star?.points).toBe(41);
    expect(star?.opponent).toBe("CHA");
    expect(star?.home).toBe(true);
    expect(star?.wonGame).toBe(true);
    expect(star?.periodId).toBe("2026-04-17");
    expect(star?.sport).toBe("nba");
    const away = perfs.find((p) => p.playerId === 113);
    expect(away?.opponent).toBe("ORL");
    expect(away?.home).toBe(false);
    expect(away?.wonGame).toBe(false);
  });

  it("marks a postseason game as a playoff", () => {
    const reg = performancesFromBoxscore(summary(2), { sport: "nba", date: "2026-04-17" });
    const post = performancesFromBoxscore(summary(3), { sport: "nba", date: "2026-06-14" });
    expect(reg[0].playoff).toBe(false);
    expect(post[0].playoff).toBe(true);
  });

  it("skips athletes who did not play", () => {
    const perfs = performancesFromBoxscore(summary(), { sport: "nba", date: "2026-04-17" });
    expect(perfs.some((p) => p.playerId === 112)).toBe(false);
  });

  it("filters to the roster and stamps the owning team (NBA)", () => {
    const perfs = performancesFromBoxscore(summary(), {
      sport: "nba",
      date: "2026-04-17",
      roster: new Map([[111, "Team Paul"]]),
    });
    expect(perfs.map((p) => p.playerId)).toEqual([111]);
    expect(perfs[0].rosteredBy).toBe("Team Paul");
  });

  it("marks players on a fantasy playoff team", () => {
    const perfs = performancesFromBoxscore(summary(), {
      sport: "nba",
      date: "2026-04-17",
      roster: new Map([[111, "Team Paul"], [113, "Team Rival"]]),
      playoffTeamIds: new Set([111]),
    });
    expect(perfs.find((p) => p.playerId === 111)?.fantasyPlayoffTeam).toBe(true);
    expect(perfs.find((p) => p.playerId === 113)?.fantasyPlayoffTeam).toBeUndefined();
  });

  it("keeps every player and stamps no team when no roster is given (WNBA)", () => {
    const perfs = performancesFromBoxscore(summary(), { sport: "wnba", date: "2026-08-19" });
    expect(perfs.map((p) => p.playerId).sort()).toEqual([111, 113]);
    expect(perfs[0].rosteredBy).toBeUndefined();
  });

  it("returns [] for a payload that isn't a summary", () => {
    expect(performancesFromBoxscore({ bad: 1 }, { sport: "nba", date: "2026-04-17" })).toEqual([]);
  });
});
