import { describe, it, expect } from "vitest";
import type { ZeroproofEvent } from "./schemas";
import {
  biggestUnderdog,
  closestGame,
  impliedProbability,
} from "./boardHighlights";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-10-20T12:00:00.000Z");

/** A bettable h2h event. `prices` is [away, home] American odds. */
function ev(
  id: string,
  away: string,
  home: string,
  prices: [number, number],
  overrides: Partial<ZeroproofEvent> = {},
): ZeroproofEvent {
  return {
    id,
    sport: "basketball_nba",
    away,
    home,
    commenceTime: "2026-10-20T18:00:00.000Z",
    status: "upcoming",
    markets: [
      {
        market: "h2h",
        fetchedAt: "2026-10-19T00:00:00Z",
        outcomes: [
          { name: away, priceAmerican: prices[0] },
          { name: home, priceAmerican: prices[1] },
        ],
      },
    ],
    ...overrides,
  };
}

describe("impliedProbability", () => {
  it("converts favorites and underdogs to a win probability", () => {
    expect(impliedProbability(-200)).toBeCloseTo(0.6667, 3);
    expect(impliedProbability(+150)).toBeCloseTo(0.4, 3);
    expect(impliedProbability(+100)).toBeCloseTo(0.5, 3);
  });
});

describe("biggestUnderdog", () => {
  it("picks the longest positive-odds side across the board", () => {
    const events = [
      ev("a", "Nets", "Celtics", [+120, -140]),
      ev("b", "Wizards", "Thunder", [+360, -480]),
      ev("c", "Heat", "Knicks", [+105, -125]),
    ];
    const pick = biggestUnderdog(events, NOW);
    expect(pick?.event.id).toBe("b");
    expect(pick?.selection).toBe("Wizards");
    expect(pick?.priceAmerican).toBe(360);
  });

  it("ignores past fixtures — you can't bet a game that already happened", () => {
    const events = [
      ev("past", "Wizards", "Thunder", [+900, -2000], {
        status: "final",
        commenceTime: new Date(NOW - 2 * DAY_MS).toISOString(),
      }),
      ev("live", "Nets", "Celtics", [+150, -170]),
    ];
    const pick = biggestUnderdog(events, NOW);
    expect(pick?.event.id).toBe("live");
  });

  it("returns null when nothing on the board is an underdog", () => {
    const events = [ev("a", "Nets", "Celtics", [-110, -110])];
    expect(biggestUnderdog(events, NOW)).toBeNull();
  });
});

describe("closestGame", () => {
  it("picks the h2h matchup nearest to a pick'em", () => {
    const events = [
      ev("blowout", "Nets", "Celtics", [+300, -380]),
      ev("tight", "Heat", "Knicks", [-105, -115]),
      ev("lean", "Bulls", "Bucks", [+140, -160]),
    ];
    const pick = closestGame(events, NOW);
    expect(pick?.event.id).toBe("tight");
    expect(pick?.spread).toBeLessThan(0.1);
    expect(pick?.outcomes).toHaveLength(2);
  });

  it("ignores past fixtures and skips markets without two sides", () => {
    const events = [
      ev("past", "Heat", "Knicks", [-101, -101], {
        status: "final",
        commenceTime: new Date(NOW - DAY_MS).toISOString(),
      }),
      ev("live", "Bulls", "Bucks", [+140, -160]),
    ];
    const pick = closestGame(events, NOW);
    expect(pick?.event.id).toBe("live");
  });

  it("returns null when the board has no bettable two-way games", () => {
    expect(closestGame([], NOW)).toBeNull();
  });
});
