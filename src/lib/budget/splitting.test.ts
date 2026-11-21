import { describe, it, expect } from "vitest";
import { evenSplit, splitsTotal } from "./splitting";

describe("evenSplit", () => {
  it("divides a whole amount evenly", () => {
    expect(evenSplit(1000, ["a", "b"])).toEqual([
      { personId: "a", amountCents: 500 },
      { personId: "b", amountCents: 500 },
    ]);
  });

  it("gives the leftover cents to the earliest people so the split still sums", () => {
    const split = evenSplit(1000, ["a", "b", "c"]);
    expect(split).toEqual([
      { personId: "a", amountCents: 334 },
      { personId: "b", amountCents: 333 },
      { personId: "c", amountCents: 333 },
    ]);
    expect(splitsTotal(split)).toBe(1000);
  });

  it("rounds down for everyone and hands the odd cent to the first person", () => {
    expect(evenSplit(101, ["a", "b"])).toEqual([
      { personId: "a", amountCents: 51 },
      { personId: "b", amountCents: 50 },
    ]);
  });

  it("gives some people nothing when there are fewer cents than people", () => {
    expect(evenSplit(2, ["a", "b", "c"]).map((s) => s.amountCents)).toEqual([1, 1, 0]);
  });

  it("returns an empty split for no people", () => {
    expect(evenSplit(1000, [])).toEqual([]);
  });
});

describe("splitsTotal", () => {
  it("sums the split amounts", () => {
    expect(splitsTotal([
      { personId: "a", amountCents: 300 },
      { personId: "b", amountCents: 700 },
    ])).toBe(1000);
  });
});
