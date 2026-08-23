import { describe, it, expect } from "vitest";
import {
  generateCards,
  prettyGameDate,
  RARITY_META,
  headshotUrl,
  type PlayerPerformance,
  type Rarity,
} from "../fantasy-cards";

const perf = (overrides: Partial<PlayerPerformance> = {}): PlayerPerformance => ({
  playerId: 1,
  playerName: "Test Player",
  points: 10,
  periodId: "2024-season",
  sport: "nba",
  ...overrides,
});

/** A pool of performances, one per points value, with distinct ids. */
const pool = (points: number[]): PlayerPerformance[] =>
  points.map((p, i) => perf({ playerId: i + 1, playerName: `P${i + 1}`, points: p }));

const deepPool = (): PlayerPerformance[] =>
  pool(Array.from({ length: 20 }, (_, i) => i + 1));

const RANK: Record<Rarity, number> = { common: 0, uncommon: 1, rare: 2, sir: 3 };

describe("generateCards", () => {
  it("returns no cards for an empty pool", () => {
    expect(generateCards([])).toEqual([]);
  });

  it("makes the top scorer in a deep pool an SIR", () => {
    const top = generateCards(deepPool()).find((c) => c.points === 20);
    expect(top?.rarity).toBe("sir");
  });

  it("bands the middle to uncommon and the floor to common", () => {
    const cards = generateCards(deepPool());
    const at = (p: number) => cards.find((c) => c.points === p);
    expect(at(12)?.rarity).toBe("uncommon");
    expect(at(1)?.rarity).toBe("common");
  });

  it("gives tied performances the same rarity", () => {
    const cards = generateCards(pool([5, 5, 5, 5, 20, 1, 2, 3]));
    const fives = cards.filter((c) => c.points === 5).map((c) => c.rarity);
    expect(fives).toHaveLength(4);
    expect(new Set(fives).size).toBe(1);
  });

  it("never lets a zero or negative performance beat common", () => {
    const cards = generateCards([
      perf({ playerId: 1, points: 0 }),
      perf({ playerId: 2, points: -4 }),
    ]);
    expect(cards.every((c) => c.rarity === "common")).toBe(true);
  });

  it("caps a shallow pool at rare so a two-player week can't mint an SIR", () => {
    const cards = generateCards(pool([30, 10, 5]));
    expect(cards.every((c) => c.rarity !== "sir")).toBe(true);
    expect(cards.find((c) => c.points === 30)?.rarity).toBe("rare");
  });

  it("derives a deterministic id from sport, player, and period", () => {
    const [card] = generateCards([
      perf({ playerId: 42, periodId: "2024-wk3", sport: "nba" }),
    ]);
    expect(card.id).toBe("nba-42-2024-wk3");
  });

  it("titles the card with the player and rounded points, over an ESPN headshot", () => {
    const [card] = generateCards([
      perf({ playerId: 3975, playerName: "Victor Wembanyama", points: 50.4 }),
    ]);
    expect(card.title).toContain("Victor Wembanyama");
    expect(card.title).toContain("50");
    expect(card.imageUrl).toBe(headshotUrl("nba", 3975));
  });

  it("orders the pool rarest performance first", () => {
    const cards = generateCards(pool([3, 40, 12]));
    expect(cards.map((c) => c.points)).toEqual([40, 12, 3]);
  });
});

describe("RARITY_META", () => {
  it("weights rarer pulls strictly lower, so SIR is the hardest to hit", () => {
    const order: Rarity[] = ["common", "uncommon", "rare", "sir"];
    const weights = order.map((r) => RARITY_META[r].pullWeight);
    for (let i = 1; i < weights.length; i++) {
      expect(weights[i]).toBeLessThan(weights[i - 1]);
    }
  });

  it("gives every rarity a label and an accent colour", () => {
    for (const r of Object.keys(RANK) as Rarity[]) {
      expect(RARITY_META[r].label.length).toBeGreaterThan(0);
      expect(RARITY_META[r].color.length).toBeGreaterThan(0);
    }
  });
});

describe("headshotUrl", () => {
  it("points at the ESPN CDN allowlisted in the CSP", () => {
    expect(headshotUrl("nba", 977)).toBe(
      "https://a.espncdn.com/i/headshots/nba/players/full/977.png",
    );
  });
});

describe("prettyGameDate", () => {
  it("turns an ISO date into a short label deterministically", () => {
    expect(prettyGameDate("2026-04-17")).toBe("Apr 17");
    expect(prettyGameDate("2025-12-01")).toBe("Dec 1");
  });
  it("passes through anything that isn't a plain date", () => {
    expect(prettyGameDate("2025-season")).toBe("2025-season");
  });
});

describe("generateCards game context", () => {
  const nightly = (overrides: Partial<PlayerPerformance> = {}): PlayerPerformance => ({
    playerId: 1,
    playerName: "Home Star",
    points: 41,
    periodId: "2026-04-17",
    sport: "nba",
    opponent: "PHX",
    home: true,
    ...overrides,
  });

  it("gives a nightly card a 'date vs OPP' subtitle when home", () => {
    const [card] = generateCards([nightly({ home: true })]);
    expect(card.subtitle).toBe("Apr 17 vs PHX");
    expect(card.opponent).toBe("PHX");
  });

  it("uses '@ OPP' when the game was away", () => {
    const [card] = generateCards([nightly({ home: false })]);
    expect(card.subtitle).toBe("Apr 17 @ PHX");
  });

  it("keeps a readable season subtitle when there is no opponent", () => {
    const [card] = generateCards([
      { playerId: 2, playerName: "Season Guy", points: 500, periodId: "2025-season", sport: "nba" },
    ]);
    expect(card.subtitle).toBe("2025 season");
  });

  it("labels an NFL weekly card by its week", () => {
    const [card] = generateCards([
      { playerId: 3, playerName: "RB One", points: 28.4, periodId: "2025-wk5", sport: "nfl" },
    ]);
    expect(card.subtitle).toBe("Week 5, 2025");
  });
});

describe("rarity boosts", () => {
  // A five-player pool where playerId 1 (1 pt) is a plain common at the floor.
  const boosted = (extra: Partial<PlayerPerformance>): PlayerPerformance[] => [
    { playerId: 1, playerName: "Low", points: 1, periodId: "2026-04-17", sport: "nba", ...extra },
    ...[2, 3, 4, 5].map((id) => ({
      playerId: id,
      playerName: `P${id}`,
      points: id * 5,
      periodId: "2026-04-17",
      sport: "nba" as const,
    })),
  ];
  const low = (cards: ReturnType<typeof generateCards>) => cards.find((c) => c.playerId === 1)!;

  it("has no boosts and unchanged rarity by default", () => {
    const card = low(generateCards(boosted({})));
    expect(card.rarity).toBe("common");
    expect(card.boosts).toEqual([]);
  });

  it("bumps a tier when the real team won the game", () => {
    const card = low(generateCards(boosted({ wonGame: true })));
    expect(card.rarity).toBe("uncommon");
    expect(card.boosts).toContain("Won");
  });

  it("bumps a tier for a real playoff game", () => {
    const card = low(generateCards(boosted({ playoff: true })));
    expect(card.rarity).toBe("uncommon");
    expect(card.boosts).toContain("Playoffs");
  });

  it("boosts a fantasy finals performance hardest, up to three tiers", () => {
    const card = low(generateCards(boosted({ fantasyResult: "finals" })));
    expect(card.rarity).toBe("sir");
    expect(card.boosts).toContain("Fantasy Finals");
  });

  it("shows the rostering fantasy team as a badge without changing rarity", () => {
    const card = low(generateCards(boosted({ rosteredBy: "Team Paul" })));
    expect(card.rarity).toBe("common");
    expect(card.boosts).toContain("Team Paul");
  });

  it("caps stacked boosts at SIR", () => {
    const card = low(
      generateCards(boosted({ wonGame: true, playoff: true, fantasyResult: "finals" })),
    );
    expect(card.rarity).toBe("sir");
  });

  it("does not boost a zero or negative outing", () => {
    const cards = generateCards([
      { playerId: 1, playerName: "DNP", points: 0, periodId: "2026-04-17", sport: "nba", wonGame: true, fantasyResult: "finals" },
      { playerId: 2, playerName: "P2", points: 20, periodId: "2026-04-17", sport: "nba" },
    ]);
    expect(cards.find((c) => c.playerId === 1)!.rarity).toBe("common");
  });
});
