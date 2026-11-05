import { describe, it, expect } from "vitest";
import { drillDeck, nextDrillCard, buildDrillOptions, isAcceptedAnswer } from "./drill";
import { PATTERNS } from "./patterns";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 4, 12);
const deck = drillDeck(PATTERNS);

/** A deterministic stand-in for Math.random that walks a fixed sequence. */
function sequenceRandom(values: readonly number[]) {
  let index = 0;
  return () => values[index++ % values.length];
}

describe("drillDeck", () => {
  it("has one card per problem, answered by the pattern that owns it", () => {
    const problemCount = PATTERNS.reduce((sum, p) => sum + p.problems.length, 0);
    expect(deck).toHaveLength(problemCount);
    const twoSum = deck.find((c) => c.problem.slug === "two-sum");
    expect(twoSum?.patternId).toBe("arrays-hashing");
  });
});

describe("nextDrillCard", () => {
  it("serves an unseen card when nothing is due, in roadmap order", () => {
    const card = nextDrillCard({ deck, states: {}, now: NOW });
    expect(card?.problem.slug).toBe(deck[0].problem.slug);
  });

  it("serves the most overdue card before anything new", () => {
    const [first, second, third] = deck;
    const states = {
      [second.problem.slug]: { step: 1, due: NOW - DAY, lastReviewed: 0, reviews: 2 },
      [third.problem.slug]: { step: 1, due: NOW - 3 * DAY, lastReviewed: 0, reviews: 2 },
      [first.problem.slug]: { step: 1, due: NOW + DAY, lastReviewed: 0, reviews: 2 },
    };
    expect(nextDrillCard({ deck, states, now: NOW })?.problem.slug).toBe(third.problem.slug);
  });

  it("keeps to the chosen patterns", () => {
    const card = nextDrillCard({ deck, states: {}, now: NOW, patternIds: ["heap"] });
    expect(card?.patternId).toBe("heap");
  });

  it("runs out when every card in scope is scheduled for later", () => {
    const heapCards = deck.filter((c) => c.patternId === "heap");
    const states = Object.fromEntries(
      heapCards.map((c) => [c.problem.slug, { step: 2, due: NOW + DAY, lastReviewed: 0, reviews: 3 }]),
    );
    expect(nextDrillCard({ deck, states, now: NOW, patternIds: ["heap"] })).toBeNull();
  });

  it("can study ahead, taking the soonest scheduled card once nothing is due", () => {
    const heapCards = deck.filter((c) => c.patternId === "heap");
    const states = Object.fromEntries(
      heapCards.map((c, i) => [c.problem.slug, { step: 2, due: NOW + (i + 1) * DAY, lastReviewed: 0, reviews: 3 }]),
    );
    const card = nextDrillCard({ deck, states, now: NOW, patternIds: ["heap"], studyAhead: true });
    expect(card?.problem.slug).toBe(heapCards[0].problem.slug);
  });
});

describe("buildDrillOptions", () => {
  const card = deck.find((c) => c.problem.slug === "two-sum")!;

  it("offers four distinct patterns, one of them right", () => {
    const options = buildDrillOptions({ card, patterns: PATTERNS, random: sequenceRandom([0.1, 0.7, 0.3, 0.9, 0.5]) });
    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    expect(options).toContain("arrays-hashing");
  });

  it("never offers an alternative that would also be right as a distractor", () => {
    const withAlternate = deck.find((c) => (c.problem.alsoAccept ?? []).length > 0)!;
    const options = buildDrillOptions({ card: withAlternate, patterns: PATTERNS, random: sequenceRandom([0.2, 0.4, 0.6, 0.8]) });
    const alternates = withAlternate.problem.alsoAccept ?? [];
    expect(options.filter((o) => alternates.includes(o))).toEqual([]);
  });

  it("does not always put the answer in the same place", () => {
    const positions = new Set(
      [0.01, 0.3, 0.6, 0.99].map((r) =>
        buildDrillOptions({ card, patterns: PATTERNS, random: sequenceRandom([r, 0.5, r, 0.25]) }).indexOf("arrays-hashing"),
      ),
    );
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe("isAcceptedAnswer", () => {
  it("accepts the owning pattern and any listed alternative, nothing else", () => {
    const withAlternate = deck.find((c) => (c.problem.alsoAccept ?? []).length > 0)!;
    expect(isAcceptedAnswer(withAlternate, withAlternate.patternId)).toBe(true);
    expect(isAcceptedAnswer(withAlternate, withAlternate.problem.alsoAccept![0])).toBe(true);
    const wrong = PATTERNS.map((p) => p.id).find(
      (id) => id !== withAlternate.patternId && !(withAlternate.problem.alsoAccept ?? []).includes(id),
    )!;
    expect(isAcceptedAnswer(withAlternate, wrong)).toBe(false);
  });
});
