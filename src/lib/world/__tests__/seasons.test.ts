import { describe, it, expect } from "vitest";
import { seasonFor, SEASON_DRESSING } from "../seasons";

describe("seasonFor", () => {
  it("runs a Toronto winter from December through February", () => {
    expect(seasonFor(new Date(2026, 11, 20))).toBe("winter");
    expect(seasonFor(new Date(2026, 0, 15))).toBe("winter");
    expect(seasonFor(new Date(2026, 1, 28))).toBe("winter");
  });

  it("thaws into spring", () => {
    expect(seasonFor(new Date(2026, 2, 15))).toBe("spring");
    expect(seasonFor(new Date(2026, 4, 30))).toBe("spring");
  });

  it("gets a summer and a fall", () => {
    expect(seasonFor(new Date(2026, 6, 1))).toBe("summer");
    expect(seasonFor(new Date(2026, 9, 12))).toBe("fall");
  });
});

describe("SEASON_DRESSING", () => {
  it("dresses every season", () => {
    for (const season of ["winter", "spring", "summer", "fall"] as const) {
      const dressing = SEASON_DRESSING[season];
      expect(dressing.foliage).toMatch(/^#/);
      expect(dressing.park).toMatch(/^#/);
      expect(dressing.label.length).toBeGreaterThan(0);
    }
  });

  it("only puts snow and festive lights on the city in winter", () => {
    expect(SEASON_DRESSING.winter.snow).toBe(true);
    expect(SEASON_DRESSING.winter.festive).toBe(true);
    expect(SEASON_DRESSING.summer.snow).toBe(false);
    expect(SEASON_DRESSING.fall.festive).toBe(false);
  });

  it("turns the leaves in the fall", () => {
    expect(SEASON_DRESSING.fall.foliage).not.toBe(SEASON_DRESSING.summer.foliage);
  });
});
