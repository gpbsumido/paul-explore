import { afterEach, describe, expect, it, vi } from "vitest";
import { setActiveTracker, setTrackerPage, trackZeroProofEvent } from "./trackerClient";
import type { Tracker } from "./tracker";

const fakeTracker = () => {
  const track = vi.fn();
  return { tracker: { track, flush: vi.fn(), pending: () => [] } as Tracker, track };
};

afterEach(() => setActiveTracker(null));

describe("trackZeroProofEvent", () => {
  it("no-ops when no tracker is mounted (unconsented visitor)", () => {
    expect(() => trackZeroProofEvent("cta_click")).not.toThrow();
  });

  it("forwards to the active tracker against the current page", () => {
    const { tracker, track } = fakeTracker();
    setActiveTracker(tracker);
    setTrackerPage("/zeroproof/leagues");

    trackZeroProofEvent("cta_click", { cta: "compare" });

    expect(track).toHaveBeenCalledWith("cta_click", "/zeroproof/leagues", { cta: "compare" });
  });
});
