import { describe, it, expect } from "vitest";
import { paletteReducer, initialPaletteState } from "../state";
import type { PaletteState, PaletteAction } from "../state";

function reduce(state: PaletteState, action: PaletteAction): PaletteState {
  return paletteReducer(Object.freeze(state), action);
}

describe("paletteReducer", () => {
  it("starts with an empty query and the cursor at the top", () => {
    expect(initialPaletteState).toEqual({ query: "", activeIndex: 0 });
  });

  it("SET_QUERY updates the query and resets the cursor", () => {
    const state = { query: "old", activeIndex: 3 };
    const result = reduce(state, { type: "SET_QUERY", query: "cal" });
    expect(result).toEqual({ query: "cal", activeIndex: 0 });
  });

  it("MOVE steps the cursor forward", () => {
    const result = reduce(
      { query: "", activeIndex: 0 },
      { type: "MOVE", delta: 1, count: 3 },
    );
    expect(result.activeIndex).toBe(1);
  });

  it("MOVE wraps past the end back to the start", () => {
    const result = reduce(
      { query: "", activeIndex: 2 },
      { type: "MOVE", delta: 1, count: 3 },
    );
    expect(result.activeIndex).toBe(0);
  });

  it("MOVE wraps before the start to the end", () => {
    const result = reduce(
      { query: "", activeIndex: 0 },
      { type: "MOVE", delta: -1, count: 3 },
    );
    expect(result.activeIndex).toBe(2);
  });

  it("MOVE sends the cursor back to zero when the results run out", () => {
    const result = reduce(
      { query: "x", activeIndex: 2 },
      { type: "MOVE", delta: 1, count: 0 },
    );
    expect(result).toEqual({ query: "x", activeIndex: 0 });
  });

  it("MOVE keeps the query while the cursor moves", () => {
    const result = reduce(
      { query: "cal", activeIndex: 0 },
      { type: "MOVE", delta: 1, count: 3 },
    );
    expect(result).toEqual({ query: "cal", activeIndex: 1 });
  });

  it("MOVE wraps a step larger than the list", () => {
    const back = reduce({ query: "", activeIndex: 0 }, { type: "MOVE", delta: -4, count: 3 });
    const forward = reduce({ query: "", activeIndex: 2 }, { type: "MOVE", delta: 5, count: 3 });
    expect(back.activeIndex).toBe(2);
    expect(forward.activeIndex).toBe(1);
  });

  it("RESET returns to the initial state", () => {
    const result = reduce({ query: "cal", activeIndex: 2 }, { type: "RESET" });
    expect(result).toEqual(initialPaletteState);
  });
});
