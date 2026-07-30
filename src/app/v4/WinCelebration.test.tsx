import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import WinCelebration from "./WinCelebration";

/**
 * Drive useIsMobile by stubbing matchMedia, so a test can render the burst as a
 * phone or as a desktop without touching the hook.
 */
const setViewport = (isMobile: boolean) => {
  window.matchMedia = ((query: string) => ({
    matches: isMobile,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
};

const pieces = (container: HTMLElement): HTMLElement[] =>
  Array.from(
    container.querySelectorAll<HTMLElement>(
      '[data-testid="win-celebration"] > div',
    ),
  );

const renderBurst = () =>
  render(<WinCelebration optionColor="#f43f5e" accent="#38bdf8" style={1} />);

afterEach(cleanup);

describe("WinCelebration", () => {
  it("renders nothing on a phone, where the fall of layers can't hold frame rate", () => {
    setViewport(true);
    const { container } = renderBurst();
    expect(
      container.querySelector('[data-testid="win-celebration"]'),
    ).toBeNull();
  });

  it("falls in full on a roomy screen, foil sheen and all", () => {
    setViewport(false);
    const { container } = renderBurst();
    const rendered = pieces(container);
    expect(rendered.length).toBeGreaterThan(0);
    for (const p of rendered) {
      expect(p.style.backgroundImage).toContain("linear-gradient");
    }
  });

  it("promotes every piece upfront, so the desktop burst doesn't hitch as it starts", () => {
    setViewport(false);
    const { container } = renderBurst();
    const rendered = pieces(container);
    expect(rendered.length).toBeGreaterThan(0);
    for (const p of rendered) {
      expect(p.style.willChange).toBe("transform");
    }
  });
});
