import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSourcePrefs } from "./useSourcePrefs";

const KEY = "research-source-prefs";

/**
 * The prefs were read once and cached for the life of the page, so turning a
 * journal off in one tab left every other open tab searching it, and clearing
 * site data didn't show until a reload.
 */
describe("useSourcePrefs", () => {
  it("follows a change made in another tab", () => {
    const { result } = renderHook(() => useSourcePrefs());
    const stored = JSON.stringify({ ...result.current.prefs, ignoredJournals: ["nejm"] });

    act(() => {
      window.localStorage.setItem(KEY, stored);
      window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: stored }));
    });

    expect(result.current.prefs.ignoredJournals).toEqual(["nejm"]);
  });

  it("falls back to the defaults on a value it can't read", () => {
    window.localStorage.setItem(KEY, "{not json");
    const { result } = renderHook(() => useSourcePrefs());

    expect(result.current.prefs.ignoredJournals).toEqual([]);
  });
});
