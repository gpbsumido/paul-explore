import { describe, it, expect } from "vitest";
import {
  completedFirstNewestFirst,
  sessionOutcome,
} from "../RestockHistoryTab";
import type { RestockSession, RestockLine } from "@/types/operator";

const session = (over: Partial<RestockSession> = {}): RestockSession => ({
  id: "s1",
  storeId: "store-04",
  startedAt: "2026-02-01T10:00:00.000Z",
  completedAt: "2026-02-01T11:00:00.000Z",
  actor: "casey",
  notes: null,
  ...over,
});

const line = (over: Partial<RestockLine> = {}): RestockLine => ({
  id: "l1",
  sessionId: "s1",
  itemId: "i1",
  expectedQty: 10,
  countedQty: 10,
  added: 0,
  removed: 0,
  removalReason: null,
  resultingStock: 10,
  countStatus: "matches-expected",
  ...over,
});

describe("completedFirstNewestFirst", () => {
  it("puts the most recently completed session at the top", () => {
    const older = session({ id: "old", completedAt: "2026-01-01T00:00:00Z" });
    const newer = session({ id: "new", completedAt: "2026-03-01T00:00:00Z" });

    expect(completedFirstNewestFirst([older, newer]).map((s) => s.id)).toEqual([
      "new",
      "old",
    ]);
  });

  it("keeps an in-progress session above finished ones, since it is the one to act on", () => {
    const done = session({ id: "done", completedAt: "2026-03-01T00:00:00Z" });
    const open = session({ id: "open", completedAt: null });

    expect(completedFirstNewestFirst([done, open]).map((s) => s.id)).toEqual([
      "open",
      "done",
    ]);
  });

  it("does not mutate the array it was given", () => {
    const input = [
      session({ id: "a", completedAt: "2026-01-01T00:00:00Z" }),
      session({ id: "b", completedAt: "2026-02-01T00:00:00Z" }),
    ];
    completedFirstNewestFirst(input);
    expect(input.map((s) => s.id)).toEqual(["a", "b"]);
  });
});

describe("sessionOutcome", () => {
  it("totals what was counted, added, and removed across the lines", () => {
    const out = sessionOutcome([
      line({ id: "a", added: 3, removed: 1 }),
      line({ id: "b", added: 2, removed: 4 }),
    ]);

    expect(out.counted).toBe(2);
    expect(out.added).toBe(5);
    expect(out.removed).toBe(5);
  });

  it("does not count a line nobody actually counted", () => {
    const out = sessionOutcome([
      line({ id: "a", countedQty: 7, countStatus: "matches-expected" }),
      line({ id: "b", countedQty: null, countStatus: "not-counted" }),
    ]);

    expect(out.counted).toBe(1);
  });

  it("surfaces the removal reasons, which is what the shrink report is asking about", () => {
    const out = sessionOutcome([
      line({ id: "a", removed: 2, removalReason: "expired" }),
      line({ id: "b", removed: 1, removalReason: "damaged" }),
      line({ id: "c", removed: 1, removalReason: "expired" }),
      line({ id: "d", removed: 0, removalReason: null }),
    ]);

    expect(out.reasons).toEqual(["expired", "damaged"]);
  });

  it("reports zeroes for a session with no lines rather than throwing", () => {
    const out = sessionOutcome([]);

    expect(out).toEqual({ counted: 0, added: 0, removed: 0, reasons: [] });
  });
});
