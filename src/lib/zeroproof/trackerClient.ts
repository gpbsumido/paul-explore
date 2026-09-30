// A tiny seam between the ZeroProof UI and the mounted tracker, so a component
// can record an interaction with one import and no prop-drilling. It no-ops
// until ZeroProofTracker has mounted (which only happens after consent), so a
// call from a signed-out or non-consenting visitor is simply dropped.

import type { Tracker } from "./tracker";

let active: Tracker | null = null;
let currentPage = "/zeroproof";

/** ZeroProofTracker registers (and clears) the live tracker here on mount. */
export function setActiveTracker(tracker: Tracker | null): void {
  active = tracker;
}

/** ZeroProofTracker keeps this in step with the current pathname. */
export function setTrackerPage(page: string): void {
  currentPage = page;
}

/** Record a ZeroProof interaction against the current page. */
export function trackZeroProofEvent(name: string, props?: Record<string, unknown>): void {
  active?.track(name, currentPage, props);
}
