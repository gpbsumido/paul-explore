import { describe, it, expect } from "vitest";
import {
  DUE_AFTER_DAYS,
  daysSinceReview,
  isDueForReview,
  serializeReviewState,
  parseReviewState,
} from "./reviewState";

const DAY = 24 * 60 * 60 * 1000;

describe("daysSinceReview", () => {
  it("counts whole days between a review and now", () => {
    expect(daysSinceReview(0, 3 * DAY)).toBe(3);
    expect(daysSinceReview(0, 3 * DAY + DAY / 2)).toBe(3);
  });

  it("never goes negative for a timestamp in the future", () => {
    expect(daysSinceReview(10 * DAY, 0)).toBe(0);
  });
});

describe("isDueForReview", () => {
  it("is due once the threshold has passed", () => {
    const now = 10 * DAY;
    expect(isDueForReview(10 * DAY - DUE_AFTER_DAYS * DAY, now)).toBe(true);
    expect(isDueForReview(now, now)).toBe(false);
  });

  it("respects a custom threshold", () => {
    const now = 5 * DAY;
    expect(isDueForReview(4 * DAY, now, 1)).toBe(true);
    expect(isDueForReview(4 * DAY, now, 2)).toBe(false);
  });
});

describe("serialize / parse review state", () => {
  it("round-trips a review map", () => {
    const state = { "acme/perf": 1000, "acme/testing": 2000 };
    expect(parseReviewState(serializeReviewState(state))).toEqual(state);
  });

  it("rejects a string that isn't exported review state", () => {
    expect(parseReviewState("not json")).toBeNull();
    expect(parseReviewState("[]")).toBeNull();
    expect(parseReviewState(JSON.stringify({ nope: true }))).toBeNull();
  });

  it("drops entries whose value isn't a finite number", () => {
    const raw = JSON.stringify({
      reviewed: { "a": 1, "b": "later", "c": null, "d": 2 },
    });
    expect(parseReviewState(raw)).toEqual({ a: 1, d: 2 });
  });
});
