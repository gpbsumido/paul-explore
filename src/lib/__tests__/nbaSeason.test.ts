import { describe, it, expect } from "vitest";
import { currentNbaSeason } from "@/lib/nbaSeason";

/**
 * ESPN and the playoffs API both name a season by the year it ends, and a
 * season tips off in October. The playoffs routes had that rule and the
 * fantasy pages used the calendar year, so every November to December they
 * disagreed about which season "now" is.
 */
describe("currentNbaSeason", () => {
  it.each([
    ["April, during the playoffs", new Date(2026, 3, 20), 2026],
    ["September, still the offseason", new Date(2026, 8, 30), 2026],
    ["October, the new season tipping off", new Date(2026, 9, 1), 2027],
    ["November", new Date(2026, 10, 19), 2027],
    ["January", new Date(2027, 0, 5), 2027],
  ])("is the season ending that year in %s", (_label, now, season) => {
    expect(currentNbaSeason(now)).toBe(season);
  });
});
