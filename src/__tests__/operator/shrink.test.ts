import { describe, it, expect } from "vitest";
import {
  summarizeShrink,
  fleetShrink,
  type ShrinkLineInput,
} from "@/lib/operator-shrink";

const PRICES = { a: 2, b: 3, c: 5 };

/**
 * A representative set: one unexplained shortfall (a), one reasoned removal (b),
 * one slot the restocker skipped counting (c).
 */
const LINES: ShrinkLineInput[] = [
  { itemId: "a", expectedQty: 10, countedQty: 7, removed: 0, removalReason: null },
  { itemId: "b", expectedQty: 5, countedQty: 5, removed: 2, removalReason: "expired" },
  { itemId: "c", expectedQty: 4, countedQty: null, removed: 0, removalReason: null },
];

// ---------------------------------------------------------------------------
// summarizeShrink
// ---------------------------------------------------------------------------

describe("summarizeShrink", () => {
  it("separates unexplained shrink from reasoned removals", () => {
    const s = summarizeShrink(LINES, PRICES);
    // a: expected 10, counted 7 -> 3 units missing, unexplained.
    expect(s.unexplainedUnits).toBe(3);
    expect(s.unexplainedValue).toBe(6); // 3 * $2
    // b: 2 removed as expired -> explained loss.
    expect(s.explainedUnits).toBe(2);
    expect(s.explainedValue).toBe(6); // 2 * $3
    expect(s.explainedByReason).toEqual({ expired: 2 });
  });

  it("counts counted vs skipped slots as coverage", () => {
    const s = summarizeShrink(LINES, PRICES);
    expect(s.countedLines).toBe(2); // a and b were counted
    expect(s.notCountedLines).toBe(1); // c was skipped
  });

  it("does not read a surplus count as negative shrink", () => {
    // Counted more than expected (a miscount the other way) is not shrink.
    const s = summarizeShrink(
      [{ itemId: "a", expectedQty: 3, countedQty: 5, removed: 0, removalReason: null }],
      PRICES,
    );
    expect(s.unexplainedUnits).toBe(0);
    expect(s.unexplainedValue).toBe(0);
  });

  it("files a removal with no reason under other", () => {
    const s = summarizeShrink(
      [{ itemId: "a", expectedQty: 4, countedQty: 4, removed: 1, removalReason: null }],
      PRICES,
    );
    expect(s.explainedByReason).toEqual({ other: 1 });
  });

  it("is all zeroes for no lines", () => {
    expect(summarizeShrink([], PRICES)).toEqual({
      unexplainedUnits: 0,
      unexplainedValue: 0,
      explainedUnits: 0,
      explainedValue: 0,
      explainedByReason: {},
      countedLines: 0,
      notCountedLines: 0,
    });
  });

  it("adds up removals that share a reason", () => {
    const s = summarizeShrink(
      [
        { itemId: "a", expectedQty: 4, countedQty: 4, removed: 1, removalReason: "expired" },
        { itemId: "b", expectedQty: 4, countedQty: 4, removed: 2, removalReason: "expired" },
        { itemId: "c", expectedQty: 4, countedQty: 4, removed: 3, removalReason: "damaged" },
      ],
      PRICES,
    );
    expect(s.explainedByReason).toEqual({ expired: 3, damaged: 3 });
    expect(s.explainedUnits).toBe(6);
    // 1 * $2 + 2 * $3 + 3 * $5
    expect(s.explainedValue).toBe(23);
  });

  it("values an item with no known price at nothing rather than NaN", () => {
    const s = summarizeShrink(
      [{ itemId: "ghost", expectedQty: 4, countedQty: 1, removed: 1, removalReason: "damaged" }],
      PRICES,
    );
    expect(s.unexplainedUnits).toBe(3);
    expect(s.unexplainedValue).toBe(0);
    expect(s.explainedValue).toBe(0);
  });

  it("rounds values to the cent", () => {
    const s = summarizeShrink(
      [{ itemId: "a", expectedQty: 3, countedQty: 0, removed: 0, removalReason: null }],
      { a: 0.1 },
    );
    expect(s.unexplainedValue).toBe(0.3);
  });
});

// ---------------------------------------------------------------------------
// fleetShrink
// ---------------------------------------------------------------------------

describe("fleetShrink", () => {
  it("ranks stores worst-first by unexplained value and totals the fleet", () => {
    const result = fleetShrink([
      {
        storeId: "s1",
        storeName: "Quiet Lobby",
        lines: [
          { itemId: "a", expectedQty: 5, countedQty: 4, removed: 0, removalReason: null },
        ],
        priceByItemId: { a: 2 },
      },
      {
        storeId: "s2",
        storeName: "Busy Gym",
        lines: [
          { itemId: "b", expectedQty: 10, countedQty: 4, removed: 0, removalReason: null },
        ],
        priceByItemId: { b: 3 },
      },
    ]);

    // s2 loses 6 * $3 = $18, s1 loses 1 * $2 = $2 -> s2 first.
    expect(result.stores.map((s) => s.storeId)).toEqual(["s2", "s1"]);
    expect(result.totals.unexplainedUnits).toBe(7);
    expect(result.totals.unexplainedValue).toBe(20);
  });

  it("ranks by the value lost, not the units lost", () => {
    const result = fleetShrink([
      {
        storeId: "many-cheap",
        storeName: "A Cheap Store",
        lines: [
          { itemId: "x", expectedQty: 10, countedQty: 0, removed: 0, removalReason: null },
        ],
        priceByItemId: { x: 1 },
      },
      {
        storeId: "few-dear",
        storeName: "B Dear Store",
        lines: [
          { itemId: "y", expectedQty: 2, countedQty: 0, removed: 0, removalReason: null },
        ],
        priceByItemId: { y: 20 },
      },
    ]);
    expect(result.stores.map((s) => s.storeId)).toEqual(["few-dear", "many-cheap"]);
  });

  it("orders stores with the same loss by name", () => {
    const lossyStore = (storeId: string, storeName: string) => ({
      storeId,
      storeName,
      lines: [
        { itemId: "a", expectedQty: 2, countedQty: 1, removed: 0, removalReason: null },
      ],
      priceByItemId: { a: 2 },
    });
    const result = fleetShrink([
      lossyStore("s-z", "Zed Cafe"),
      lossyStore("s-a", "Alpha Lobby"),
    ]);
    expect(result.stores.map((s) => s.storeName)).toEqual(["Alpha Lobby", "Zed Cafe"]);
  });

  it("totals removals, reasons and coverage across stores", () => {
    const result = fleetShrink([
      { storeId: "s1", storeName: "One", lines: LINES, priceByItemId: PRICES },
      { storeId: "s2", storeName: "Two", lines: LINES, priceByItemId: PRICES },
    ]);
    expect(result.totals).toMatchObject({
      explainedUnits: 4,
      explainedValue: 12,
      explainedByReason: { expired: 4 },
      countedLines: 4,
      notCountedLines: 2,
    });
  });

  it("is all zeroes for a fleet with no stores", () => {
    const result = fleetShrink([]);
    expect(result.stores).toEqual([]);
    expect(result.totals.unexplainedValue).toBe(0);
    expect(result.totals.explainedByReason).toEqual({});
  });
});
