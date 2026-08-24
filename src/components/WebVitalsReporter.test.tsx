import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import WebVitalsReporter from "./WebVitalsReporter";

/**
 * The reporter beacons Core Web Vitals to /api/vitals. The one behaviour worth
 * pinning: a page that loaded in the background (a tab opened behind others, a
 * prerender) produces load timings a user never waited through — LCP/FCP/TTFB
 * of many minutes — and those are what were dragging the dashboard's percentile
 * into the Poor band. So load metrics from a hidden load are dropped, while the
 * interaction-scoped ones (CLS, INP) are always sent.
 */

// Capture the callbacks the reporter registers, so the test can fire them.
const handlers: Record<string, (m: unknown) => void> = {};
vi.mock("web-vitals", () => ({
  onFCP: (cb: (m: unknown) => void) => (handlers.FCP = cb),
  onLCP: (cb: (m: unknown) => void) => (handlers.LCP = cb),
  onTTFB: (cb: (m: unknown) => void) => (handlers.TTFB = cb),
  onCLS: (cb: (m: unknown) => void) => (handlers.CLS = cb),
  onINP: (cb: (m: unknown) => void) => (handlers.INP = cb),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/graphql" }));

const beacon = vi.fn(() => true);

function setEnv(visibilityState: "visible" | "hidden") {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { hostname: "paulsumido.com" },
  });
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => visibilityState,
  });
  Object.defineProperty(navigator, "sendBeacon", {
    configurable: true,
    value: beacon,
  });
}

const metric = (name: string) => ({
  name,
  value: 1200,
  rating: "good",
  navigationType: "navigate",
});

beforeEach(() => {
  beacon.mockClear();
  for (const k of Object.keys(handlers)) delete handlers[k];
});
afterEach(() => vi.clearAllMocks());

describe("WebVitalsReporter", () => {
  it("does not send LCP/FCP/TTFB when the page loaded hidden", () => {
    setEnv("hidden");
    render(<WebVitalsReporter />);

    handlers.LCP?.(metric("LCP"));
    handlers.FCP?.(metric("FCP"));
    handlers.TTFB?.(metric("TTFB"));

    expect(beacon).not.toHaveBeenCalled();
  });

  it("sends load metrics for a normal foreground load", () => {
    setEnv("visible");
    render(<WebVitalsReporter />);

    handlers.LCP?.(metric("LCP"));

    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon).toHaveBeenCalledWith("/api/vitals", expect.any(Blob));
  });

  it("still sends CLS even when the page loaded hidden", () => {
    setEnv("hidden");
    render(<WebVitalsReporter />);

    handlers.CLS?.(metric("CLS"));

    expect(beacon).toHaveBeenCalledTimes(1);
  });
});
