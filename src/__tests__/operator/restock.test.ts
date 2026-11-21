import { describe, it, expect } from "vitest";

import {
  countStatusOf,
  describeDraft,
  draftFor,
  isLineDirty,
  resultingStock,
  summarizeDraft,
} from "@/lib/operator-restock";
import type { InventoryItem } from "@/types/operator";

const item = (over: Partial<InventoryItem> = {}): InventoryItem => ({
  id: "item-1",
  storeId: "store-001",
  productName: "Greek Yogurt Cup",
  category: "dairy",
  currentStock: 8,
  capacity: 12,
  price: 3.25,
  lastRestocked: "2026-08-01T12:00:00.000Z",
  ...over,
});

const draft = (over = {}) => ({
  itemId: "item-1",
  expectedQty: 8,
  countedQty: null as number | null,
  added: 0,
  removed: 0,
  removalReason: null as string | null,
  ...over,
});

describe("resultingStock", () => {
  it("prefers the counted quantity over what the system expected", () => {
    expect(resultingStock(draft({ countedQty: 5 }), 12)).toBe(5);
  });

  it("falls back to expected when the count was skipped", () => {
    expect(resultingStock(draft({ countedQty: null }), 12)).toBe(8);
  });

  it("treats a counted zero as a real count, not a skip", () => {
    expect(resultingStock(draft({ countedQty: 0 }), 12)).toBe(0);
  });

  it("applies adds and removes on top of the base", () => {
    expect(
      resultingStock(draft({ countedQty: 5, added: 4, removed: 2 }), 12),
    ).toBe(7);
  });

  it("clamps between zero and capacity", () => {
    expect(resultingStock(draft({ countedQty: 2, removed: 9 }), 12)).toBe(0);
    expect(resultingStock(draft({ countedQty: 10, added: 20 }), 12)).toBe(12);
  });
});

describe("resultingStock with a bad capacity", () => {
  it("never reports negative stock when capacity is negative", () => {
    expect(resultingStock(draft({ countedQty: 5 }), -3)).toBe(0);
  });
});

describe("countStatusOf", () => {
  it("distinguishes not-counted, matches-expected and correction", () => {
    expect(countStatusOf(draft({ countedQty: null }))).toBe("not-counted");
    expect(countStatusOf(draft({ countedQty: 8 }))).toBe("matches-expected");
    expect(countStatusOf(draft({ countedQty: 5 }))).toBe("correction");
  });
});

describe("draftFor", () => {
  it("seeds a slot from what the system currently believes", () => {
    expect(draftFor(item())).toEqual({
      itemId: "item-1",
      expectedQty: 8,
      countedQty: null,
      added: 0,
      removed: 0,
      removalReason: null,
    });
  });
});

describe("isLineDirty", () => {
  it("is clean when the restocker changed nothing", () => {
    expect(isLineDirty(draft())).toBe(false);
  });

  it("is dirty once a count is entered, even one that agrees", () => {
    // Confirming a count is information, so it is worth persisting.
    expect(isLineDirty(draft({ countedQty: 8 }))).toBe(true);
  });

  it("is dirty when stock moved", () => {
    expect(isLineDirty(draft({ added: 3 }))).toBe(true);
    expect(isLineDirty(draft({ removed: 1, removalReason: "expired" }))).toBe(
      true,
    );
  });
});

describe("summarizeDraft", () => {
  const drafts = [
    draft({ itemId: "a", expectedQty: 8, countedQty: 5, added: 4 }),
    draft({
      itemId: "b",
      expectedQty: 6,
      countedQty: 6,
      removed: 2,
      removalReason: "expired",
    }),
    draft({ itemId: "c", expectedQty: 3, countedQty: null, added: 9 }),
    draft({ itemId: "d", expectedQty: 4, countedQty: 4 }),
  ];

  it("counts only the slots the restocker actually touched", () => {
    // 'd' was counted and matched with no movement -- still a touched slot.
    expect(summarizeDraft(drafts).itemsTouched).toBe(4);
  });

  it("totals adds and removes", () => {
    const summary = summarizeDraft(drafts);
    expect(summary.added).toBe(13);
    expect(summary.removed).toBe(2);
  });

  it("separates corrections from skipped counts", () => {
    const summary = summarizeDraft(drafts);
    expect(summary.corrections).toBe(1);
    expect(summary.notCounted).toBe(1);
  });

  it("breaks removals down by reason", () => {
    expect(summarizeDraft(drafts).removedByReason).toEqual({ expired: 2 });
  });

  it("counts a removal with no reason in the total but not in the reason breakdown", () => {
    const summary = summarizeDraft([draft({ countedQty: 8, removed: 3 })]);
    expect(summary.removed).toBe(3);
    expect(summary.removedByReason).toEqual({});
  });

  it("adds up removals that share a reason", () => {
    const summary = summarizeDraft([
      draft({ itemId: "a", removed: 2, removalReason: "damaged" }),
      draft({ itemId: "b", removed: 1, removalReason: "damaged" }),
      draft({ itemId: "c", removed: 4, removalReason: "expired" }),
    ]);
    expect(summary.removedByReason).toEqual({ damaged: 3, expired: 4 });
  });

  it("ignores untouched slots entirely", () => {
    const summary = summarizeDraft([draft(), draft({ itemId: "z" })]);
    expect(summary.itemsTouched).toBe(0);
  });
});

describe("describeDraft", () => {
  it("names removals by reason, because that is the point of the audit trail", () => {
    const text = describeDraft(
      summarizeDraft([
        draft({ countedQty: 6, removed: 2, removalReason: "expired" }),
        draft({ itemId: "a", countedQty: 5, added: 4 }),
      ]),
    );
    expect(text).toBe("Restocked 2 items, +4, -2 (2 expired), 2 corrections");
  });

  it("uses the singular for one item and one correction", () => {
    const text = describeDraft(summarizeDraft([draft({ countedQty: 6 })]));
    expect(text).toBe("Restocked 1 item, 1 correction");
  });

  it("lists every removal reason with its count", () => {
    const text = describeDraft(
      summarizeDraft([
        draft({ itemId: "a", countedQty: 8, removed: 3, removalReason: "expired" }),
        draft({ itemId: "b", countedQty: 8, removed: 2, removalReason: "damaged" }),
      ]),
    );
    expect(text).toBe("Restocked 2 items, -5 (3 expired, 2 damaged)");
  });

  it("shows the removal total alone when no reason was given", () => {
    const text = describeDraft(summarizeDraft([draft({ countedQty: 8, removed: 2 })]));
    expect(text).toBe("Restocked 1 item, -2");
  });

  it("says how many slots were left uncounted", () => {
    const text = describeDraft(summarizeDraft([draft({ added: 2 })]));
    expect(text).toBe("Restocked 1 item, +2, 1 not counted");
  });

  it("reads sensibly when nothing moved", () => {
    expect(describeDraft(summarizeDraft([]))).toBe(
      "Restock completed with no changes",
    );
  });
});
