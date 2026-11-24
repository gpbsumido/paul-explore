import { describe, it, expect } from "vitest";
import {
  pointsIndex,
  usGameDate,
  completedEventIds,
  latestCompletedSlate,
  performancesFromBoxscore,
} from "../espn-boxscore";

const NBA_KEYS = [
  "minutes", "points", "fieldGoalsMade-fieldGoalsAttempted",
  "threePointFieldGoalsMade-threePointFieldGoalsAttempted",
];
const WNBA_TAIL_KEYS = ["minutes", "rebounds", "assists", "points"];

type Competitor = {
  id: string;
  homeAway: string;
  winner?: boolean;
  team: { abbreviation: string };
};

/** A minimal ESPN summary payload with two teams and given athlete lines. */
const summary = (seasonType = 2) => ({
  header: {
    season: { type: seasonType },
    competitions: [
      {
        competitors: [
          { id: "19", homeAway: "home", winner: true, team: { abbreviation: "ORL" } },
          { id: "30", homeAway: "away", winner: false, team: { abbreviation: "CHA" } },
        ] as Competitor[],
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

describe("usGameDate", () => {
  it("reads an evening game on the day it was played, not the UTC day", () => {
    expect(usGameDate("2026-04-18T00:30Z")).toBe("2026-04-17");
  });

  it("applies the winter offset too", () => {
    // 07:30Z is 23:30 the night before in Pacific standard time.
    expect(usGameDate("2026-01-01T07:30Z")).toBe("2025-12-31");
  });

  it("falls back to the date part when the timestamp won't parse", () => {
    expect(usGameDate("2026-04-17 sometime")).toBe("2026-04-17");
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

  it("picks the most recent US game date with completed games and its event ids", () => {
    // All times UTC. An evening tip the same day and one just past midnight UTC
    // are the same game night in US local time, which is the day a fan means.
    const slate = latestCompletedSlate(
      sb([
        { id: "a", date: "2026-04-16T23:00Z", state: "post" }, // Apr 16 US
        { id: "b", date: "2026-04-17T23:00Z", state: "post" }, // Apr 17 US
        { id: "c", date: "2026-04-18T00:30Z", state: "post" }, // Apr 17 US evening
        { id: "d", date: "2026-04-19T23:00Z", state: "pre" },
      ]),
    );
    expect(slate?.date).toBe("2026-04-17");
    expect(slate?.eventIds.sort()).toEqual(["b", "c"]);
  });

  it("dates a late game by its US evening, not the UTC next day", () => {
    // An 8:30pm Central tip in Minnesota is 01:30Z the next calendar day, but
    // it's tonight's game — the US local date, not tomorrow's.
    const slate = latestCompletedSlate(
      sb([{ id: "min", date: "2026-08-25T01:30Z", state: "post" }]),
    );
    expect(slate?.date).toBe("2026-08-24");
  });

  it("skips a finished game that has no date", () => {
    const slate = latestCompletedSlate({
      events: [
        { id: "undated", status: { type: { state: "post" } } },
        { id: "dated", date: "2026-04-17T23:00Z", status: { type: { state: "post" } } },
      ],
    });
    expect(slate).toEqual({ date: "2026-04-17", eventIds: ["dated"] });
  });

  it("picks the latest day however the games are ordered", () => {
    const slate = latestCompletedSlate(
      sb([
        { id: "late", date: "2026-04-20T23:00Z", state: "post" },
        { id: "early", date: "2026-04-10T23:00Z", state: "post" },
      ]),
    );
    expect(slate).toEqual({ date: "2026-04-20", eventIds: ["late"] });
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
    expect(star?.playerName).toBe("Home Star");
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

  it("counts the play-in as postseason and a missing season type as regular season", () => {
    const playIn = performancesFromBoxscore(summary(5), { sport: "nba", date: "2026-04-14" });
    const { season: _season, ...headerWithoutSeason } = summary().header;
    const noSeason = performancesFromBoxscore(
      { ...summary(), header: headerWithoutSeason },
      { sport: "nba", date: "2026-04-14" },
    );
    expect(playIn[0].playoff).toBe(true);
    expect(noSeason[0].playoff).toBe(false);
  });

  it("skips athletes who did not play, even when ESPN sent them a stat line", () => {
    const withDnpLine = summary();
    withDnpLine.boxscore.players[0].statistics[0].athletes[1].stats = ["12", "9", "3-6", "0-1"];
    const perfs = performancesFromBoxscore(withDnpLine, { sport: "nba", date: "2026-04-17" });
    expect(perfs.some((p) => p.playerId === 112)).toBe(false);
    expect(perfs.some((p) => p.playerId === 111)).toBe(true);
  });

  it("drops a line whose points aren't a number but keeps the rest of the team", () => {
    const withDash = summary();
    withDash.boxscore.players[0].statistics[0].athletes[0].stats = ["--", "--", "--", "--"];
    withDash.boxscore.players[0].statistics[0].athletes.push({
      athlete: { id: "114", displayName: "Next Man" },
      didNotPlay: false,
      stats: ["20", "9", "4-8", "1-2"],
    });
    const perfs = performancesFromBoxscore(withDash, { sport: "nba", date: "2026-04-17" });
    expect(perfs.map((p) => p.playerId).sort()).toEqual([113, 114]);
  });

  it("skips a team whose box score has no points column, keeping the other team", () => {
    const noPoints = summary();
    noPoints.boxscore.players[0].statistics[0].keys = ["minutes", "rebounds"];
    const perfs = performancesFromBoxscore(noPoints, { sport: "nba", date: "2026-04-17" });
    expect(perfs.map((p) => p.playerId)).toEqual([113]);
  });

  it("skips a team that has no stat block", () => {
    const noBlock = summary();
    noBlock.boxscore.players[0].statistics = [];
    const perfs = performancesFromBoxscore(noBlock, { sport: "nba", date: "2026-04-17" });
    expect(perfs.map((p) => p.playerId)).toEqual([113]);
  });

  it("skips a team the header doesn't list as a competitor", () => {
    const stranger = summary();
    stranger.boxscore.players[1].team.id = "99";
    const perfs = performancesFromBoxscore(stranger, { sport: "nba", date: "2026-04-17" });
    expect(perfs.map((p) => p.playerId)).toEqual([111]);
  });

  it("skips everyone when the header names only one team, so there is no opponent", () => {
    const oneSided = summary();
    oneSided.header.competitions[0].competitors.pop();
    expect(performancesFromBoxscore(oneSided, { sport: "nba", date: "2026-04-17" })).toEqual([]);
  });

  it("doesn't credit a win when ESPN leaves the winner flag out", () => {
    const unfinished = summary();
    for (const competitor of unfinished.header.competitions[0].competitors) {
      delete competitor.winner;
    }
    const perfs = performancesFromBoxscore(unfinished, { sport: "nba", date: "2026-04-17" });
    expect(perfs.every((p) => p.wonGame === false)).toBe(true);
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

  it("treats a blank owner name in the roster as unowned", () => {
    const perfs = performancesFromBoxscore(summary(), {
      sport: "nba",
      date: "2026-04-17",
      roster: new Map([[111, ""]]),
    });
    expect(perfs).toHaveLength(1);
    expect(perfs[0].rosteredBy).toBeUndefined();
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
