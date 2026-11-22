import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import TypedHeadline from "./TypedHeadline";

const TEXT = "Nine years building data-heavy web apps";

/** An observer the test can fire, standing in for the heading scrolling into view. */
function stubObserver() {
  const callbacks: IntersectionObserverCallback[] = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        callbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
  return {
    scrollIntoView: () =>
      act(() => callbacks.forEach((callback) => callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver))),
  };
}

function preferReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce && query.includes("reduce"),
    addEventListener() {},
    removeEventListener() {},
  }));
}

/** What a sighted visitor sees: the layer screen readers skip. */
const typedLayer = (container: HTMLElement) => container.querySelector("[data-typed]")?.textContent ?? "";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("the typed headline", () => {
  it("names the heading with the whole sentence from the first render", () => {
    stubObserver();
    preferReducedMotion(false);
    render(<TypedHeadline id="about-title" text={TEXT} />);
    expect(screen.getByRole("heading", { level: 2, name: TEXT })).toHaveAttribute("id", "about-title");
  });

  it("types the sentence out once the heading scrolls into view", () => {
    vi.useFakeTimers();
    const observer = stubObserver();
    preferReducedMotion(false);
    const { container } = render(<TypedHeadline id="about-title" text={TEXT} />);
    observer.scrollIntoView();
    act(() => vi.advanceTimersByTime(300));
    const partway = typedLayer(container);
    expect(partway.length).toBeGreaterThan(0);
    expect(partway.length).toBeLessThan(TEXT.length);
    expect(TEXT.startsWith(partway)).toBe(true);
    act(() => vi.advanceTimersByTime(10_000));
    expect(typedLayer(container)).toBe(TEXT);
  });

  it("shows the whole sentence at once for anyone who prefers less motion", () => {
    stubObserver();
    preferReducedMotion(true);
    const { container } = render(<TypedHeadline id="about-title" text={TEXT} />);
    expect(typedLayer(container)).toBe(TEXT);
  });
});
