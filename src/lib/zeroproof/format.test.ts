import { describe, it, expect } from "vitest";
import {
  formatAmerican,
  formatPoint,
  marketLabel,
  sortMarkets,
  playerHandle,
  formatRecord,
  formatCents,
  formatSignedPct,
  formatStreak,
} from "./format";
import { eventsResponseSchema, leaderboardResponseSchema } from "./schemas";
import type { ZeroproofMarket } from "./schemas";

describe("formatAmerican", () => {
  it("leads underdog prices with a plus and leaves favourites alone", () => {
    expect(formatAmerican(122)).toBe("+122");
    expect(formatAmerican(-110)).toBe("-110");
  });
});

describe("formatPoint", () => {
  it("signs spread and total lines, and is empty for moneyline", () => {
    expect(formatPoint(3.5)).toBe("+3.5");
    expect(formatPoint(-3.5)).toBe("-3.5");
    expect(formatPoint(undefined)).toBe("");
  });
});

describe("marketLabel", () => {
  it("names the known markets and falls back to the raw key", () => {
    expect(marketLabel("h2h")).toBe("Moneyline");
    expect(marketLabel("spread")).toBe("Spread");
    expect(marketLabel("total")).toBe("Total");
    expect(marketLabel("player_props")).toBe("player_props");
  });
});

describe("sortMarkets", () => {
  it("orders markets the way a book lists them, unknown ones last", () => {
    const markets = [
      { market: "total", fetchedAt: "", outcomes: [] },
      { market: "props", fetchedAt: "", outcomes: [] },
      { market: "h2h", fetchedAt: "", outcomes: [] },
      { market: "spread", fetchedAt: "", outcomes: [] },
    ] satisfies ZeroproofMarket[];
    expect(sortMarkets(markets).map((m) => m.market)).toEqual([
      "h2h",
      "spread",
      "total",
      "props",
    ]);
  });
});

describe("playerHandle", () => {
  it("is stable for a sub and never echoes it back", () => {
    const sub = "auth0|abc123def456";
    const handle = playerHandle(sub);
    expect(handle).toBe(playerHandle(sub));
    expect(handle).toMatch(/^P-[0-9A-Z]{5}$/);
    expect(handle).not.toContain("abc123");
  });

  it("distinguishes different subs", () => {
    expect(playerHandle("auth0|one")).not.toBe(playerHandle("auth0|two"));
  });

  it("distinguishes subs that share a long prefix", () => {
    // The real failure mode: near-identical subs collapsing to one handle. A
    // handful of prefix-sharing subs must all read differently.
    const subs = ["auth0|a1", "auth0|b2", "auth0|c3", "auth0|d4", "auth0|e5"];
    const handles = new Set(subs.map(playerHandle));
    expect(handles.size).toBe(subs.length);
  });
});

describe("formatRecord", () => {
  it("reads wins-losses-pushes", () => {
    expect(formatRecord({ wins: 12, losses: 7, pushes: 1 })).toBe("12-7-1");
  });
});

describe("formatCents", () => {
  it("renders integer cents as dollars", () => {
    expect(formatCents(11840)).toBe("$118.40");
    expect(formatCents(0)).toBe("$0.00");
  });
});

describe("formatSignedPct", () => {
  it("signs a percentage and dashes null", () => {
    expect(formatSignedPct(8.4)).toBe("+8.4%");
    expect(formatSignedPct(-2.1)).toBe("-2.1%");
    expect(formatSignedPct(null)).toBe("—");
  });
});

describe("formatStreak", () => {
  it("reads a win or losing run, dashing a cold start", () => {
    expect(formatStreak(3)).toBe("W3");
    expect(formatStreak(-2)).toBe("L2");
    expect(formatStreak(0)).toBe("—");
  });
});

describe("response schemas", () => {
  it("parses an events payload, keeping an absent point absent", () => {
    const parsed = eventsResponseSchema.parse({
      events: [
        {
          id: "e1",
          sport: "basketball_nba",
          home: "Lakers",
          away: "Celtics",
          commenceTime: "2026-09-10T00:00:00.000Z",
          status: "upcoming",
          markets: [
            {
              market: "h2h",
              fetchedAt: "2026-09-09T22:00:00.000Z",
              outcomes: [
                { name: "Lakers", priceAmerican: -110 },
                { name: "Celtics", priceAmerican: -110 },
              ],
            },
          ],
        },
      ],
    });
    expect(parsed.events[0].markets[0].outcomes[0].point).toBeUndefined();
  });

  it("parses leaderboard entries with a nullable sharp score", () => {
    const parsed = leaderboardResponseSchema.parse({
      entries: [
        {
          userSub: "auth0|x",
          wins: 3,
          losses: 1,
          pushes: 0,
          betCount: 4,
          roiPct: 12.5,
          sharpScore: null,
        },
      ],
    });
    expect(parsed.entries[0].sharpScore).toBeNull();
  });
});
