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

/** A small seeded generator (mulberry32), so a spread of shuffles is repeatable. */
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("drillDeck", () => {
  it("has one card per problem, answered by the pattern that owns it", () => {
    const problemCount = PATTERNS.reduce((sum, p) => sum + p.problems.length, 0);
    expect(deck).toHaveLength(problemCount);
    const twoSum = deck.find((c) => c.problem.slug === "two-sum");
    expect(twoSum?.patternId).toBe("arrays-hashing");
  });

  it("mixes the patterns from the first card, so the order never gives the answer away", () => {
    const firstRound = deck.slice(0, PATTERNS.length).map((c) => c.patternId);
    expect(new Set(firstRound).size).toBe(PATTERNS.length);
  });

  it("still starts every pattern on the first problem of its ladder", () => {
    const firstSeen = new Map<string, string>();
    deck.forEach((c) => firstSeen.has(c.patternId) || firstSeen.set(c.patternId, c.problem.slug));
    PATTERNS.forEach((p) => expect(firstSeen.get(p.id)).toBe(p.problems[0].slug));
  });
});

describe("nextDrillCard", () => {
  it("serves an unseen card when nothing is due", () => {
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

  it("treats a card that is due exactly now as due", () => {
    const [first, second] = deck;
    const states = {
      [first.problem.slug]: { step: 1, due: NOW, lastReviewed: 0, reviews: 2 },
    };
    // second has never been seen; the due card still comes first
    expect(deck.indexOf(second)).toBeGreaterThan(deck.indexOf(first));
    expect(nextDrillCard({ deck, states, now: NOW })?.problem.slug).toBe(first.problem.slug);
    expect(nextDrillCard({ deck: [second, first], states, now: NOW })?.problem.slug).toBe(
      first.problem.slug,
    );
  });

  it("does not skip unseen cards just because study ahead is on", () => {
    const [first, second] = deck;
    const states = {
      [first.problem.slug]: { step: 1, due: NOW + DAY, lastReviewed: 0, reviews: 2 },
    };
    const card = nextDrillCard({ deck: [first, second], states, now: NOW, studyAhead: true });
    expect(card?.problem.slug).toBe(second.problem.slug);
  });

  it("keeps to the chosen patterns", () => {
    const card = nextDrillCard({ deck: deck.filter((c) => c.patternId === "heap"), states: {}, now: NOW });
    expect(card?.patternId).toBe("heap");
  });

  it("runs out when every card in scope is scheduled for later", () => {
    const heapCards = deck.filter((c) => c.patternId === "heap");
    const states = Object.fromEntries(
      heapCards.map((c) => [c.problem.slug, { step: 2, due: NOW + DAY, lastReviewed: 0, reviews: 3 }]),
    );
    expect(nextDrillCard({ deck: heapCards, states, now: NOW })).toBeNull();
  });

  it("can study ahead, taking the soonest scheduled card once nothing is due", () => {
    const heapCards = deck.filter((c) => c.patternId === "heap");
    const states = Object.fromEntries(
      heapCards.map((c, i) => [c.problem.slug, { step: 2, due: NOW + (i + 1) * DAY, lastReviewed: 0, reviews: 3 }]),
    );
    const card = nextDrillCard({ deck: heapCards, states, now: NOW, studyAhead: true });
    expect(card?.problem.slug).toBe(heapCards[0].problem.slug);
  });
});

describe("buildDrillOptions", () => {
  const card = deck.find((c) => c.problem.slug === "two-sum")!;

  it("offers four distinct patterns, one of them right", () => {
    const options = buildDrillOptions({ card, patterns: PATTERNS, random: sequenceRandom([0.1, 0.7, 0.3, 0.9, 0.5]) }).map((p) => p.id);
    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    expect(options).toContain("arrays-hashing");
  });

  it("never offers an alternative that would also be right as a distractor", () => {
    const withAlternate = deck.find((c) => (c.problem.alsoAccept ?? []).length > 0)!;
    const options = buildDrillOptions({ card: withAlternate, patterns: PATTERNS, random: sequenceRandom([0.2, 0.4, 0.6, 0.8]) }).map((p) => p.id);
    const alternates = withAlternate.problem.alsoAccept ?? [];
    expect(options.filter((o) => alternates.includes(o))).toEqual([]);
  });

  it("puts the answer in every one of the four slots across shuffles", () => {
    const positions = new Set(
      Array.from({ length: 60 }, (_, seed) =>
        buildDrillOptions({ card, patterns: PATTERNS, random: seededRandom(seed) }).findIndex(
          (p) => p.id === "arrays-hashing",
        ),
      ),
    );
    expect([...positions].sort()).toEqual([0, 1, 2, 3]);
  });

  it("draws different distractors from the whole catalogue, not the first few", () => {
    const seen = new Set(
      Array.from({ length: 60 }, (_, seed) =>
        buildDrillOptions({ card, patterns: PATTERNS, random: seededRandom(seed) }).map((p) => p.id),
      ).flat(),
    );
    expect(seen.size).toBeGreaterThan(10);
  });

  it("never offers a listed alternative across any shuffle", () => {
    const answer = PATTERNS[0];
    const alternative = PATTERNS[1];
    const alternateCard = {
      patternId: answer.id,
      problem: { ...answer.problems[0], alsoAccept: [alternative.id] },
    };
    for (let seed = 0; seed < 60; seed++) {
      const options = buildDrillOptions({
        card: alternateCard,
        patterns: PATTERNS.slice(0, 6),
        random: seededRandom(seed),
      }).map((p) => p.id);
      expect(options, `seed ${seed}`).not.toContain(alternative.id);
      expect(options, `seed ${seed}`).toContain(answer.id);
    }
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
