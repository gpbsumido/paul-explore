import { describe, it, expect } from "vitest";
import type { LeaderboardEntry } from "./schemas";
import { compareStats, leadSummary, rankByMetric } from "./compare";

const mine = {
  wins: 6,
  losses: 4,
  pushes: 0,
  betCount: 10,
  roiPct: 20,
  sharpScore: null,
};

const theirs = {
  wins: 5,
  losses: 5,
  pushes: 0,
  betCount: 10,
  roiPct: 5,
  sharpScore: 80,
};

const entry = (over: Partial<LeaderboardEntry>): LeaderboardEntry => ({
  userSub: "auth0|x",
  wins: 5,
  losses: 5,
  pushes: 0,
  betCount: 10,
  roiPct: 5,
  sharpScore: 60,
  ...over,
});

describe("compareStats", () => {
  const metrics = compareStats(mine, theirs);
  const by = (key: string) => metrics.find((m) => m.key === key)!;

  it("marks who leads each comparable metric", () => {
    expect(by("winRate").leader).toBe("mine"); // 60% vs 50%
    expect(by("roi").leader).toBe("mine"); // +20% vs +5%
    expect(by("sharp").leader).toBe("theirs"); // null loses to 80
  });

  it("leaves record and bet count as informational, with no leader", () => {
    expect(by("record").leader).toBeNull();
    expect(by("bets").leader).toBeNull();
    expect(by("record").mine).toBe("6-4-0");
  });

  it("formats a missing sharp score as a dash rather than null", () => {
    expect(by("sharp").mine).toBe("—");
    expect(by("sharp").theirs).toBe("80");
  });
});

describe("leadSummary", () => {
  it("counts who's ahead across the comparable metrics", () => {
    const summary = leadSummary(compareStats(mine, theirs));
    expect(summary).toEqual({ mineLeads: 2, theirsLeads: 1, comparable: 3 });
  });
});

describe("rankByMetric", () => {
  it("ranks me by ROI against the field, one better than anyone I beat", () => {
    const entries = [entry({ roiPct: 30 }), entry({ roiPct: 12 }), entry({ roiPct: 2 })];
    // roiPct 20 beats 12 and 2, loses to 30 → rank 2 of 4 (three of them plus me).
    expect(rankByMetric(entries, mine, "roiPct")).toEqual({ rank: 2, total: 4 });
  });

  it("sinks a null sharp score below anyone with a real one", () => {
    const entries = [entry({ sharpScore: 40 }), entry({ sharpScore: null })];
    // mine.sharpScore is null → behind the 40, tied-or-ahead of the null → rank 2 of 3.
    expect(rankByMetric(entries, mine, "sharpScore")).toEqual({ rank: 2, total: 3 });
  });
});
