import { describe, it, expect } from "vitest";
import { currentNflSeason } from "@/lib/nflSeason";

/**
 * ESPN names a football season by the year it kicks off, and fantasy playoffs
 * run into early January. The NFL pages used the calendar year, so from New
 * Year's to the next kickoff they asked ESPN for a season that hadn't started.
 */
describe("currentNflSeason", () => {
  it.each([
    ["November, mid-season", new Date(2026, 10, 22), 2026],
    ["January, fantasy playoffs", new Date(2027, 0, 4), 2026],
    ["August, still last season", new Date(2027, 7, 31), 2026],
    ["September, kickoff", new Date(2027, 8, 1), 2027],
  ])("is the season that kicked off before %s", (_label, now, season) => {
    expect(currentNflSeason(now)).toBe(season);
  });
});
