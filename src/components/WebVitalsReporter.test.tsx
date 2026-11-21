import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { version } from "../../package.json";
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
const currentPath = vi.hoisted(() => ({ value: "/graphql" }));
vi.mock("next/navigation", () => ({ usePathname: () => currentPath.value }));

const beacon = vi.fn((_url: string, _data: Blob) => true);

function setEnv(
  visibilityState: "visible" | "hidden",
  hostname = "paulsumido.com",
) {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { hostname },
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

/** The JSON the reporter put in the beacon's body. */
async function sentPayload(callIndex = 0): Promise<Record<string, unknown>> {
  const blob = beacon.mock.calls[callIndex][1];
  return JSON.parse(await blob.text());
}

beforeEach(() => {
  currentPath.value = "/graphql";
  delete (window as Window & { __pageStartedVisible?: boolean }).__pageStartedVisible;
  beacon.mockClear();
  for (const k of Object.keys(handlers)) delete handlers[k];
});
afterEach(() => vi.clearAllMocks());

describe("WebVitalsReporter", () => {
  it("does not send LCP/FCP/TTFB when the page loaded hidden", () => {
    setEnv("hidden");
    render(<WebVitalsReporter />);

    // The collectors must exist, or "nothing was sent" proves nothing.
    expect(Object.keys(handlers).sort()).toEqual(
      ["CLS", "FCP", "INP", "LCP", "TTFB"],
    );
    handlers.LCP(metric("LCP"));
    handlers.FCP(metric("FCP"));
    handlers.TTFB(metric("TTFB"));

    expect(beacon).not.toHaveBeenCalled();
  });

  it("drops load metrics when a background tab becomes visible before hydration", () => {
    setEnv("visible");
    Object.defineProperty(window, "__pageStartedVisible", {
      configurable: true,
      value: false,
    });
    render(<WebVitalsReporter />);

    expect(Object.keys(handlers).sort()).toEqual(
      ["CLS", "FCP", "INP", "LCP", "TTFB"],
    );
    handlers.FCP(metric("FCP"));
    handlers.LCP(metric("LCP"));
    handlers.TTFB(metric("TTFB"));

    expect(beacon).not.toHaveBeenCalled();
  });

  it("sends load metrics for a normal foreground load", () => {
    setEnv("visible");
    render(<WebVitalsReporter />);

    handlers.LCP(metric("LCP"));

    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon).toHaveBeenCalledWith("/api/vitals", expect.any(Blob));
  });

  it("sends the metric with its page, rating, navigation type and app version", async () => {
    setEnv("visible");
    render(<WebVitalsReporter />);

    handlers.LCP(metric("LCP"));

    expect(await sentPayload()).toEqual({
      metric: "LCP",
      value: 1200,
      rating: "good",
      page: "/graphql",
      nav_type: "navigate",
      app_version: version,
    });
  });

  it("credits a load metric to the page that loaded, not the one navigated to since", async () => {
    setEnv("visible");
    const { rerender } = render(<WebVitalsReporter />);

    currentPath.value = "/calendar";
    rerender(<WebVitalsReporter />);
    handlers.LCP(metric("LCP"));
    handlers.CLS(metric("CLS"));

    expect((await sentPayload(0)).page).toBe("/graphql");
    expect((await sentPayload(1)).page).toBe("/calendar");
  });

  it("sends nothing from localhost", () => {
    setEnv("visible", "localhost");
    render(<WebVitalsReporter />);

    expect(Object.keys(handlers)).toEqual([]);
    expect(beacon).not.toHaveBeenCalled();
  });

  it("falls back to a keepalive fetch when sendBeacon is unavailable", () => {
    setEnv("visible");
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: undefined,
    });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));
    render(<WebVitalsReporter />);

    handlers.CLS(metric("CLS"));

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/vitals",
      expect.objectContaining({ method: "POST", keepalive: true }),
    );
    fetchSpy.mockRestore();
  });

  it("still sends CLS even when the page loaded hidden", () => {
    setEnv("hidden");
    render(<WebVitalsReporter />);

    handlers.CLS(metric("CLS"));

    expect(beacon).toHaveBeenCalledTimes(1);
  });
});
