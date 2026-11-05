import { describe, it, expect } from "vitest";
import { scheduleReview, dueItems, REVIEW_LADDER_DAYS } from "./review";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 4, 12);

describe("scheduleReview", () => {
  it("brings a first solve back tomorrow, or in three days if it was easy", () => {
    expect(scheduleReview({ previous: undefined, rating: "good", now: NOW }).due).toBe(NOW + 1 * DAY);
    expect(scheduleReview({ previous: undefined, rating: "hard", now: NOW }).due).toBe(NOW + 1 * DAY);
    expect(scheduleReview({ previous: undefined, rating: "again", now: NOW }).due).toBe(NOW + 1 * DAY);
    expect(scheduleReview({ previous: undefined, rating: "easy", now: NOW }).due).toBe(NOW + 3 * DAY);
  });

  it("climbs the ladder one rung on good and two on easy", () => {
    const first = scheduleReview({ previous: undefined, rating: "good", now: NOW });
    const second = scheduleReview({ previous: first, rating: "good", now: NOW });
    expect(second.due).toBe(NOW + 3 * DAY);
    const third = scheduleReview({ previous: second, rating: "easy", now: NOW });
    expect(third.due).toBe(NOW + 14 * DAY);
  });

  it("holds the interval on hard and drops back to the bottom on again", () => {
    const climbed = { step: 2, due: NOW, lastReviewed: NOW - 7 * DAY, reviews: 4 };
    expect(scheduleReview({ previous: climbed, rating: "hard", now: NOW }).due).toBe(NOW + 7 * DAY);
    expect(scheduleReview({ previous: climbed, rating: "again", now: NOW }).due).toBe(NOW + 1 * DAY);
  });

  it("tops out at sixty days however many times it is easy", () => {
    const top = { step: 5, due: NOW, lastReviewed: NOW, reviews: 9 };
    expect(scheduleReview({ previous: top, rating: "easy", now: NOW }).due).toBe(NOW + 60 * DAY);
  });

  it("counts the reviews and remembers when the last one was", () => {
    const first = scheduleReview({ previous: undefined, rating: "good", now: NOW });
    const later = scheduleReview({ previous: first, rating: "good", now: NOW + DAY });
    expect(first).toMatchObject({ reviews: 1, lastReviewed: NOW });
    expect(later).toMatchObject({ reviews: 2, lastReviewed: NOW + DAY });
  });

  it("publishes the ladder it uses", () => {
    expect(REVIEW_LADDER_DAYS).toEqual([1, 3, 7, 14, 30, 60]);
  });
});

describe("dueItems", () => {
  it("lists what is due, most overdue first, and leaves the future alone", () => {
    const states = {
      "two-sum": { step: 0, due: NOW - 1 * DAY, lastReviewed: 0, reviews: 1 },
      "3sum": { step: 0, due: NOW + 1 * DAY, lastReviewed: 0, reviews: 1 },
      "valid-anagram": { step: 0, due: NOW - 3 * DAY, lastReviewed: 0, reviews: 1 },
      "contains-duplicate": { step: 0, due: NOW, lastReviewed: 0, reviews: 1 },
    };
    expect(dueItems(states, NOW)).toEqual(["valid-anagram", "two-sum", "contains-duplicate"]);
  });

  it("returns nothing for an empty history", () => {
    expect(dueItems({}, NOW)).toEqual([]);
  });
});
