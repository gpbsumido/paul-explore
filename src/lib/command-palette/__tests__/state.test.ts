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

  it("MOVE keeps the cursor at zero when there are no results", () => {
    const result = reduce(
      { query: "x", activeIndex: 0 },
      { type: "MOVE", delta: 1, count: 0 },
    );
    expect(result.activeIndex).toBe(0);
  });

  it("RESET returns to the initial state", () => {
    const result = reduce({ query: "cal", activeIndex: 2 }, { type: "RESET" });
    expect(result).toEqual(initialPaletteState);
  });
});
