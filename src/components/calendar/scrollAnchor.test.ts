import { describe, it, expect } from "vitest";
import { pickAnchor, anchorCorrection } from "./scrollAnchor";

describe("pickAnchor", () => {
  it("picks the period whose top edge has most recently passed the top", () => {
    expect(
      pickAnchor([
        { key: "jan", top: -400 },
        { key: "feb", top: -50 },
        { key: "mar", top: 300 },
      ]),
    ).toEqual({ key: "feb", top: -50 });
  });

  it("falls back to the first when the reader is above all of them", () => {
    expect(
      pickAnchor([
        { key: "jan", top: 120 },
        { key: "feb", top: 600 },
      ]),
    ).toEqual({ key: "jan", top: 120 });
  });

  it("counts a period sitting just below the edge as the one in view", () => {
    // With a single period the fallback would answer "jan" whatever the
    // threshold did, so a second one has to be the correct answer.
    expect(
      pickAnchor([
        { key: "jan", top: -300 },
        { key: "feb", top: 8 },
      ])?.key,
    ).toBe("feb");
  });

  it("stops counting a period once it is more than the threshold below the edge", () => {
    const periods = [
      { key: "jan", top: -300 },
      { key: "feb", top: 10 },
      { key: "mar", top: 11 },
    ];
    expect(pickAnchor(periods)?.key).toBe("feb");
  });

  it("takes a different threshold when asked", () => {
    const periods = [
      { key: "jan", top: -300 },
      { key: "feb", top: 40 },
    ];
    expect(pickAnchor(periods, 50)?.key).toBe("feb");
    expect(pickAnchor(periods)?.key).toBe("jan");
  });

  it("has nothing to anchor to when there are no periods", () => {
    expect(pickAnchor([])).toBeNull();
  });
});

describe("anchorCorrection", () => {
  it("returns how far the anchor moved, so it can be put back", () => {
    // Content appeared above: the anchor slid down 120px.
    expect(anchorCorrection(-50, 70)).toBe(120);
  });

  it("corrects upward too, when content above shrank", () => {
    expect(anchorCorrection(70, -50)).toBe(-120);
  });

  it("ignores sub-pixel drift rather than chasing layout rounding", () => {
    expect(anchorCorrection(10, 10.4)).toBe(0);
    expect(anchorCorrection(10, 10)).toBe(0);
  });

  it("still corrects once the drift is real", () => {
    expect(anchorCorrection(10, 12)).toBe(2);
  });

  it("corrects a drift of exactly one pixel, the smallest it chases", () => {
    expect(anchorCorrection(10, 11)).toBe(1);
    expect(anchorCorrection(10, 9)).toBe(-1);
  });
});
