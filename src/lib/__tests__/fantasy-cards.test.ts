import { describe, it, expect } from "vitest";
import {
  generateCards,
  drawPack,
  prettyGameDate,
  RARITY_META,
  headshotUrl,
  type GeneratedCard,
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

  // 21 distinct scores, so a score's percentile is exactly (score - 1) / 20 and
  // each cut-off (0.5, 0.8, 0.95) lands on a score of its own.
  it.each([
    [10, "common"],
    [11, "uncommon"],
    [16, "uncommon"],
    [17, "rare"],
    [19, "rare"],
    [20, "sir"],
    [21, "sir"],
  ] as const)("rates a score of %i as %s in a pool of 21", (points, rarity) => {
    const cards = generateCards(pool(Array.from({ length: 21 }, (_, i) => i + 1)));
    expect(cards.find((c) => c.points === points)?.rarity).toBe(rarity);
  });

  it("lets a pool of four crown an SIR but a pool of three top out at rare", () => {
    expect(generateCards(pool([1, 2, 3, 4]))[0].rarity).toBe("sir");
    expect(generateCards(pool([1, 2, 3]))[0].rarity).toBe("rare");
  });

  it("makes a lone positive score rare, since it beat everyone else in the pool", () => {
    expect(generateCards(pool([12]))[0].rarity).toBe("rare");
  });

  it("gives nobody more than common when everyone scores the same", () => {
    const cards = generateCards(pool([10, 10, 10, 10, 10]));
    expect(cards.map((c) => c.rarity)).toEqual(Array(5).fill("common"));
  });

  it("orders equal scores by player id", () => {
    const cards = generateCards([
      perf({ playerId: 9, points: 10 }),
      perf({ playerId: 3, points: 10 }),
      perf({ playerId: 5, points: 10 }),
    ]);
    expect(cards.map((c) => c.playerId)).toEqual([3, 5, 9]);
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
    expect(card.title).toBe("Victor Wembanyama · 50 PTS");
    expect(card.imageUrl).toBe(headshotUrl("nba", 3975));
  });

  it("rounds the points in the title to the nearest whole number", () => {
    const [card] = generateCards([perf({ points: 50.6 })]);
    expect(card.title).toBe("Test Player · 51 PTS");
    expect(card.points).toBe(50.6);
  });

  it("carries the pro team and game context onto the card", () => {
    const [card] = generateCards([
      perf({ proTeamId: 21, opponent: "PHX", home: false, periodId: "2026-04-17" }),
    ]);
    expect(card).toMatchObject({ proTeamId: 21, opponent: "PHX", home: false });
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
  it("passes through a date whose month doesn't exist", () => {
    expect(prettyGameDate("2026-13-01")).toBe("2026-13-01");
    expect(prettyGameDate("2026-00-01")).toBe("2026-00-01");
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

  it("drops the leading zero from an NFL week number", () => {
    const [card] = generateCards([
      { playerId: 3, playerName: "RB One", points: 28.4, periodId: "2025-wk05", sport: "nfl" },
    ]);
    expect(card.subtitle).toBe("Week 5, 2025");
  });

  it("labels an NFL weekly card by its week", () => {
    const [card] = generateCards([
      { playerId: 3, playerName: "RB One", points: 28.4, periodId: "2025-wk5", sport: "nfl" },
    ]);
    expect(card.subtitle).toBe("Week 5, 2025");
  });
});

describe("drawPack", () => {
  const c = (rarity: Rarity, id: string): GeneratedCard => ({
    id,
    playerId: 1,
    playerName: id,
    points: 20,
    periodId: "2026-04-17",
    sport: "nba",
    rarity,
    title: `${id} · 20 PTS`,
    subtitle: "Apr 17",
    imageUrl: "x",
    boosts: [],
  });

  it("draws the requested number of distinct cards", () => {
    const pool = [c("common", "a"), c("common", "b"), c("rare", "d"), c("sir", "e")];
    const pack = drawPack(pool, { size: 3, random: () => 0.5 });
    expect(pack).toHaveLength(3);
    expect(new Set(pack.map((x) => x.id)).size).toBe(3);
  });

  it("draws a pack of five by default", () => {
    const big = Array.from({ length: 8 }, (_, i) => c("common", `card-${i}`));
    expect(drawPack(big, { random: () => 0.3 })).toHaveLength(5);
  });

  it("never draws the same card twice, even when every roll lands on the first", () => {
    const pool = [c("common", "a"), c("common", "b"), c("common", "c")];
    expect(drawPack(pool, { size: 3, random: () => 0 }).map((x) => x.id)).toEqual(["a", "b", "c"]);
  });

  it("returns the whole pool when it's smaller than the pack", () => {
    const pool = [c("common", "a"), c("sir", "b")];
    expect(drawPack(pool, { size: 5, random: () => 0.5 })).toHaveLength(2);
  });

  it("weights by pull weight — a low roll hits the rare, a high roll the common", () => {
    const pool = [c("sir", "sir"), c("common", "common")];
    expect(drawPack(pool, { size: 1, random: () => 0 })[0].id).toBe("sir");
    expect(drawPack(pool, { size: 1, random: () => 0.99 })[0].id).toBe("common");
  });

  it("returns nothing for an empty pool", () => {
    expect(drawPack([], { size: 5 })).toEqual([]);
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
  const low = (cards: ReturnType<typeof generateCards>): GeneratedCard => {
    const card = cards.find((c) => c.playerId === 1);
    if (!card) throw new Error("the low scorer is missing from the pool");
    return card;
  };

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

  it.each([
    ["win", "uncommon", "Fantasy W"],
    ["playoff", "rare", "Fantasy Playoffs"],
    ["finals", "sir", "Fantasy Finals"],
  ] as const)("a fantasy %s lifts a floor card to %s and badges it %s", (fantasyResult, rarity, badge) => {
    const card = low(generateCards(boosted({ fantasyResult })));
    expect(card.rarity).toBe(rarity);
    expect(card.boosts).toEqual([badge]);
  });

  it("stacks a real win and a real playoff game for two tiers", () => {
    const card = low(generateCards(boosted({ wonGame: true, playoff: true })));
    expect(card.rarity).toBe("rare");
    expect(card.boosts).toEqual(["Won", "Playoffs"]);
  });

  it("shows the rostering fantasy team as a badge without changing rarity", () => {
    const card = low(generateCards(boosted({ rosteredBy: "Team Paul" })));
    expect(card.rarity).toBe("common");
    expect(card.boosts).toContain("Team Paul");
  });

  it("bumps a tier for a card rostered by a fantasy playoff team", () => {
    const card = low(generateCards(boosted({ fantasyPlayoffTeam: true })));
    expect(card.rarity).toBe("uncommon");
    expect(card.boosts).toContain("Fantasy Playoffs");
  });

  it("caps stacked boosts at SIR", () => {
    const card = low(
      generateCards(boosted({ wonGame: true, playoff: true, fantasyResult: "finals" })),
    );
    expect(card.rarity).toBe("sir");
  });

  it("with a rare boost ceiling, boosts can't mint an SIR from a low line", () => {
    // A quiet game stacked with boosts tops out at rare when a ceiling is set —
    // SIR is reserved for a genuine top line, so a nightly slate stays scarce.
    const card = low(
      generateCards(boosted({ fantasyResult: "finals" }), { boostCeiling: "rare" }),
    );
    expect(card.rarity).toBe("rare");
  });

  it("a boost ceiling never pulls down a base-tier SIR", () => {
    // playerId 5 tops the pool, so its base tier is SIR; the ceiling only caps
    // what boosts add, it doesn't demote a line that earned SIR on its own.
    const top = generateCards(boosted({}), { boostCeiling: "rare" }).find(
      (c) => c.playerId === 5,
    );
    expect(top?.rarity).toBe("sir");
  });

  it("caps how many cards may hold a tier, dropping the lowest scorers", () => {
    // Five finals lines all boost to SIR; a cap of two keeps the top two by
    // points and demotes the rest to rare.
    const finalsPool = [10, 20, 30, 40, 50].map((p, i) =>
      perf({ playerId: i + 1, playerName: `P${i + 1}`, points: p, fantasyResult: "finals" }),
    );
    const cards = generateCards(finalsPool, { caps: { sir: 2 } });
    const sirs = cards.filter((c) => c.rarity === "sir");
    expect(sirs.map((c) => c.points)).toEqual([50, 40]);
    expect(cards.filter((c) => c.rarity === "rare")).toHaveLength(3);
  });

  it("demotes overflow a tier at a time, down through every capped tier", () => {
    const finalsPool = [10, 20, 30, 40].map((p, i) =>
      perf({ playerId: i + 1, points: p, fantasyResult: "finals" }),
    );
    const cards = generateCards(finalsPool, { caps: { sir: 1, rare: 1, uncommon: 1 } });
    expect(cards.map((c) => c.rarity)).toEqual(["sir", "rare", "uncommon", "common"]);
  });

  it("does not boost a zero or negative outing", () => {
    const cards = generateCards([
      { playerId: 1, playerName: "DNP", points: 0, periodId: "2026-04-17", sport: "nba", wonGame: true, fantasyResult: "finals" },
      { playerId: 2, playerName: "P2", points: 20, periodId: "2026-04-17", sport: "nba" },
    ]);
    expect(cards.find((c) => c.playerId === 1)?.rarity).toBe("common");
    expect(cards.find((c) => c.playerId === 1)?.boosts).toEqual([]);
  });
});
