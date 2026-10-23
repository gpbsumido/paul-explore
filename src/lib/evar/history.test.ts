import { describe, it, expect, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { readHistory, recordAttempt, summarize, useHistory, type HistoryEntry } from "./history";

afterEach(() => {
  window.localStorage.clear();
});

const entry = (overrides: Partial<HistoryEntry> = {}): HistoryEntry => ({
  id: "a1",
  levelId: "medium",
  caseId: "long-neck",
  finishedAt: Date.UTC(2026, 9, 23, 9, 0),
  within: 4,
  stars: 2,
  total: 600,
  timedOut: false,
  deltas: { neckDiameter: 0.4, maxSac: -1.2 },
  ...overrides,
});

describe("attempt history", () => {
  it("forgets attempts finished on the first phantom, whose anatomy has since changed", () => {
    window.localStorage.setItem("evar-history", JSON.stringify([entry()]));
    expect(readHistory()).toEqual([]);
    expect(window.localStorage.getItem("evar-history")).toBeNull();
  });

  it("is empty before anything is finished", () => {
    expect(readHistory()).toEqual([]);
  });

  it("keeps every finished attempt, newest last", () => {
    recordAttempt(entry({ id: "a1" }));
    recordAttempt(entry({ id: "a2", total: 700 }));
    expect(readHistory().map((e) => e.id)).toEqual(["a1", "a2"]);
    expect(readHistory()[1]).toEqual(entry({ id: "a2", total: 700 }));
  });

  it("replaces an attempt recorded again under the same id", () => {
    recordAttempt(entry({ id: "a1", total: 300 }));
    recordAttempt(entry({ id: "a1", total: 450 }));
    expect(readHistory()).toEqual([entry({ id: "a1", total: 450 })]);
  });

  it("keeps the newest 500", () => {
    Array.from({ length: 503 }, (_, i) => recordAttempt(entry({ id: `a${i}` })));
    const history = readHistory();
    expect(history).toHaveLength(500);
    expect(history[0].id).toBe("a3");
    expect(history[499].id).toBe("a502");
  });

  it("reads garbage in storage as an empty history, and writes over it", () => {
    window.localStorage.setItem("evar-history", "{not json");
    expect(readHistory()).toEqual([]);
    window.localStorage.setItem("evar-history", JSON.stringify([{ id: 3 }]));
    expect(readHistory()).toEqual([]);
    recordAttempt(entry());
    expect(readHistory()).toEqual([entry()]);
  });

  it("re-renders a reader when an attempt is recorded, without a new array every read", () => {
    const { result } = renderHook(() => useHistory());
    expect(result.current).toEqual([]);
    act(() => recordAttempt(entry()));
    expect(result.current).toEqual([entry()]);
    expect(readHistory()).not.toBe(result.current);
  });
});

describe("summarize", () => {
  it("gives attempts, mean measurements within tolerance and best points for each level that has any", () => {
    const summary = summarize([
      entry({ id: "1", levelId: "medium", within: 3, total: 400 }),
      entry({ id: "2", levelId: "medium", within: 5, total: 900 }),
      entry({ id: "3", levelId: "hard", within: 2, total: 250 }),
    ]);
    expect(summary).toEqual([
      { levelId: "medium", attempts: 2, meanWithin: 4, bestTotal: 900 },
      { levelId: "hard", attempts: 1, meanWithin: 2, bestTotal: 250 },
    ]);
  });

  it("is empty for an empty history", () => {
    expect(summarize([])).toEqual([]);
  });
});
