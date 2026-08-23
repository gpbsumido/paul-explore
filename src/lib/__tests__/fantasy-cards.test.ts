import { describe, it, expect } from "vitest";
import {
  generateCards,
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
