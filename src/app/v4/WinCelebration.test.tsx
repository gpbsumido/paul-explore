import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import WinCelebration, { type FallStyle } from "./WinCelebration";
import { CONFETTI_COUNT } from "./winPieces";

/**
 * Drive useIsMobile by stubbing matchMedia, so a test can render the burst as a
 * phone or as a desktop without touching the hook.
 */
const setViewport = (isMobile: boolean) => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: isMobile,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
};

const pieces = (container: HTMLElement): HTMLElement[] =>
  Array.from(
    container.querySelectorAll<HTMLElement>(
      '[data-testid="win-celebration"] > div',
    ),
  );

const renderBurst = (style: FallStyle = 1) =>
  render(
    <WinCelebration optionColor="#f43f5e" accent="#38bdf8" style={style} />,
  );

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

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

  it("is hidden from assistive tech and never catches a click", () => {
    setViewport(false);
    const { container } = renderBurst();
    const layer = container.querySelector('[data-testid="win-celebration"]');
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer).toHaveClass("pointer-events-none");
  });

  it("drops a full burst of confetti", () => {
    setViewport(false);
    const { container } = renderBurst();
    expect(pieces(container)).toHaveLength(CONFETTI_COUNT);
  });

  it("leads with the landed option's colour and the category accent", () => {
    setViewport(false);
    const { container } = renderBurst();
    const colours = new Set(pieces(container).map((p) => p.style.backgroundColor));
    // jsdom hands colours back as rgb().
    expect(colours).toContain("rgb(244, 63, 94)");
    expect(colours).toContain("rgb(56, 189, 248)");
  });

  it.each([1, 2, 3, 4] as const)(
    "falls in style %i when asked to, on every piece",
    (style) => {
      setViewport(false);
      const { container } = renderBurst(style);
      const rendered = pieces(container);
      expect(rendered.length).toBeGreaterThan(0);
      for (const p of rendered) {
        expect(p.style.animation).toContain(`v4-win-confetti-${style} `);
      }
    },
  );
});
