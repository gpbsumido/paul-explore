import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";

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

// mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// mock package.json version
vi.mock("../../package.json", () => ({
  version: "0.15.19",
}));

describe("WebVitalsReporter", () => {
  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();
    originalLocation = window.location;
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
