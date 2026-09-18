import { describe, it, expect } from "vitest";
import { teamBrandColor } from "./teamColors";

describe("teamBrandColor", () => {
  it("returns the brand colour for a full vendor name", () => {
    expect(teamBrandColor("basketball_nba", "Los Angeles Lakers")).toBe("#552583");
    expect(teamBrandColor("baseball_mlb", "Boston Red Sox")).toBe("#bd3039");
  });

  it("matches a short nickname-only name too", () => {
    expect(teamBrandColor("basketball_nba", "Celtics")).toBe("#007a33");
  });

  it("scopes by league so cross-sport nicknames don't collide", () => {
    // Cardinals and Giants exist in both the NFL and MLB with different colours.
    expect(teamBrandColor("americanfootball_nfl", "Arizona Cardinals")).toBe("#97233f");
    expect(teamBrandColor("baseball_mlb", "St. Louis Cardinals")).toBe("#c41e3a");
    expect(teamBrandColor("americanfootball_nfl", "New York Giants")).toBe("#0b2265");
    expect(teamBrandColor("baseball_mlb", "San Francisco Giants")).toBe("#fd5a1e");
  });

  it("doesn't mistake Hornets for the Nets on a suffix match", () => {
    expect(teamBrandColor("basketball_nba", "Charlotte Hornets")).toBe("#1d1160");
  });

  it("returns null for fantasy teams and unknown names", () => {
    expect(teamBrandColor("fantasy_ffl", "Team Alpha")).toBeNull();
    expect(teamBrandColor("basketball_nba", "Harlem Globetrotters")).toBeNull();
  });
});
