import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import type { MetricType } from "web-vitals";

// mock web-vitals before importing the component
const mockOnCLS = vi.fn();
const mockOnFCP = vi.fn();
const mockOnINP = vi.fn();
const mockOnLCP = vi.fn();
const mockOnTTFB = vi.fn();

vi.mock("web-vitals", () => ({
  onCLS: mockOnCLS,
  onFCP: mockOnFCP,
  onINP: mockOnINP,
  onLCP: mockOnLCP,
  onTTFB: mockOnTTFB,
}));

// mock next/navigation with a pathname the tests can move between renders,
// the way a client-side navigation does
const { pathname } = vi.hoisted(() => ({ pathname: { current: "/" } }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

// mock package.json version
vi.mock("../../package.json", () => ({
  version: "0.15.19",
}));

describe("WebVitalsReporter", () => {
  let originalLocation: Location;
  const sendBeacon = vi.fn(() => true);

  beforeEach(() => {
    vi.clearAllMocks();
    pathname.current = "/";
    originalLocation = window.location;
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeacon,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  function setHostname(hostname: string) {
    Object.defineProperty(window, "location", {
      value: { ...window.location, hostname },
      writable: true,
    });
  }

  function aMetric(name: string): MetricType {
    return {
      name,
      value: 1234,
      rating: "good",
      navigationType: "navigate",
    } as unknown as MetricType;
  }

  /** The page each beacon was stamped with, in the order they were sent. */
  async function reportedPages(): Promise<string[]> {
    const bodies = sendBeacon.mock.calls.map(
      (call) => (call as unknown as [string, Blob])[1],
    );
    const parsed = await Promise.all(bodies.map((body) => body.text()));
    return parsed.map((json) => JSON.parse(json).page);
  }

  /**
   * Renders on `startPath`, grabs the callback the component handed to the
   * given observer, then navigates to `endPath` before firing it. That gap is
   * exactly the real-world case: the observer fires long after the load it
   * describes, by which point the user has clicked through somewhere else.
   */
  async function fireAfterNavigating(
    observer: typeof mockOnFCP,
    metricName: string,
  ) {
    setHostname("paul-explore.vercel.app");
    const { default: WebVitalsReporter } = await import("./WebVitalsReporter");

    const { rerender } = render(<WebVitalsReporter />);
    const report = observer.mock.calls[0][0] as (m: MetricType) => void;

    pathname.current = "/thoughts";
    rerender(<WebVitalsReporter />);

    report(aMetric(metricName));
  }

  describe("load metrics", () => {
    // FCP, LCP and TTFB describe the initial document load. LCP in particular
    // only flushes on first interaction, which is usually a click on a nav
    // link, so reading the pathname when it fires credits the wrong page.
    it("reports FCP against the page that was loading, not the current one", async () => {
      await fireAfterNavigating(mockOnFCP, "FCP");

      expect(await reportedPages()).toEqual(["/"]);
    });

    it("reports LCP against the page that was loading, not the current one", async () => {
      await fireAfterNavigating(mockOnLCP, "LCP");

      expect(await reportedPages()).toEqual(["/"]);
    });

    it("reports TTFB against the page that was loading, not the current one", async () => {
      await fireAfterNavigating(mockOnTTFB, "TTFB");

      expect(await reportedPages()).toEqual(["/"]);
    });
  });

  describe("interaction metrics", () => {
    // INP and CLS are genuinely scoped to whatever view the user is on now,
    // so these must keep following the navigation.
    it("reports INP against the page the user is on when it fires", async () => {
      await fireAfterNavigating(mockOnINP, "INP");

      expect(await reportedPages()).toEqual(["/thoughts"]);
    });

    it("reports CLS against the page the user is on when it fires", async () => {
      await fireAfterNavigating(mockOnCLS, "CLS");

      expect(await reportedPages()).toEqual(["/thoughts"]);
    });
  });

  it("registers all five vitals observers in production", async () => {
    setHostname("paul-explore.vercel.app");
    const { default: WebVitalsReporter } = await import("./WebVitalsReporter");

    render(<WebVitalsReporter />);

    expect(mockOnCLS).toHaveBeenCalledTimes(1);
    expect(mockOnFCP).toHaveBeenCalledTimes(1);
    expect(mockOnINP).toHaveBeenCalledTimes(1);
    expect(mockOnLCP).toHaveBeenCalledTimes(1);
    expect(mockOnTTFB).toHaveBeenCalledTimes(1);
  });

  it("registers observers once across a navigation", async () => {
    setHostname("paul-explore.vercel.app");
    const { default: WebVitalsReporter } = await import("./WebVitalsReporter");

    const { rerender } = render(<WebVitalsReporter />);
    pathname.current = "/thoughts";
    rerender(<WebVitalsReporter />);

    expect(mockOnLCP).toHaveBeenCalledTimes(1);
  });

  it("does NOT register observers on localhost", async () => {
    setHostname("localhost");
    const { default: WebVitalsReporter } = await import("./WebVitalsReporter");

    render(<WebVitalsReporter />);

    expect(mockOnCLS).not.toHaveBeenCalled();
    expect(mockOnFCP).not.toHaveBeenCalled();
    expect(mockOnINP).not.toHaveBeenCalled();
    expect(mockOnLCP).not.toHaveBeenCalled();
    expect(mockOnTTFB).not.toHaveBeenCalled();
  });

  it("does NOT register observers on 127.0.0.1", async () => {
    setHostname("127.0.0.1");
    const { default: WebVitalsReporter } = await import("./WebVitalsReporter");

    render(<WebVitalsReporter />);

    expect(mockOnCLS).not.toHaveBeenCalled();
  });
});
