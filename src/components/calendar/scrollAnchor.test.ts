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
    expect(pickAnchor([{ key: "jan", top: 8 }])?.key).toBe("jan");
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
});
