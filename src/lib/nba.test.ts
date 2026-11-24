import { describe, it, expect } from "vitest";
import type { PlayerRow, PlayerStats } from "@/types/nba";
import { COLUMNS, getSortValue } from "./nba";

/** A full stat line, so each test overrides only the number it is about. */
const statLine = (over: Partial<PlayerStats> = {}): PlayerStats => ({
  pts: 20,
  reb: 8,
  ast: 5,
  stl: 1,
  blk: 2,
  games_played: 60,
  min: "32:10",
  fgm: 8,
  fga: 16,
  fg_pct: 0.5,
  ft_pct: 0.8,
  fg3_pct: 0.35,
  turnover: 2,
  fantasy_points: 41.5,
  ...over,
});

const row = (over: Partial<PlayerRow> = {}): PlayerRow => ({
  id: 1,
  name: "Nikola Jokic",
  pos: "C",
  stats: statLine(),
  ...over,
});

describe("getSortValue", () => {
  it("sorts names and positions without regard to case", () => {
    expect(getSortValue(row({ name: "LeBron James" }), "name")).toBe("lebron james");
    expect(getSortValue(row({ pos: "PG-SG" }), "pos")).toBe("pg-sg");
  });

  it.each([
    ["gp", 60],
    ["pts", 20],
    ["reb", 8],
    ["ast", 5],
    ["stl", 1],
    ["blk", 2],
    ["fpt", 41.5],
  ] as const)("reads %s from the matching stat", (key, expected) => {
    expect(getSortValue(row(), key)).toBe(expected);
  });

  it.each(["gp", "pts", "reb", "ast", "stl", "blk", "fpt"] as const)(
    "puts a player with no %s below every real value, including a zero",
    (key) => {
      const missing = getSortValue(row({ stats: null }), key);
      const zero = getSortValue(
        row({
          stats: statLine({ games_played: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fantasy_points: 0 }),
        }),
        key,
      );
      expect(missing).toBeLessThan(Number(zero));
    },
  );

  it("treats a missing fantasy score as no data, not as zero", () => {
    expect(getSortValue(row({ stats: statLine({ fantasy_points: undefined }) }), "fpt")).toBe(-1);
  });
});

describe("COLUMNS", () => {
  it("has a sort value for every column the table shows", () => {
    for (const { key } of COLUMNS) {
      expect(getSortValue(row(), key)).not.toBeUndefined();
    }
  });

  it("lists each sortable key once", () => {
    const keys = COLUMNS.map((column) => column.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
