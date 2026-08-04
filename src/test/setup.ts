import "@testing-library/jest-dom";
import "vitest-axe/extend-expect";
import * as axeMatchers from "vitest-axe/matchers";
import { server } from "./server";
import { beforeAll, afterEach, afterAll, expect, vi } from "vitest";

expect.extend(axeMatchers);

// jsdom gaps that component tests rely on. Individual tests can still override
// matchMedia (e.g. to emulate reduced motion) with vi.stubGlobal.
if (typeof window !== "undefined") {
  if (typeof window.matchMedia !== "function") {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  // jsdom has no FontFace API, which tegaki uses to load its handwriting font.
  // Without this every component that renders the chalk backdrop throws.
  if (typeof (globalThis as { FontFace?: unknown }).FontFace === "undefined") {
    class MockFontFace {
      load() {
        return Promise.resolve(this);
      }
    }
    (globalThis as unknown as { FontFace: unknown }).FontFace = MockFontFace;
  }
  if (!document.fonts) {
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { add: vi.fn(), delete: vi.fn(), ready: Promise.resolve() },
    });
  }

  class MockObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  window.IntersectionObserver ??=
    MockObserver as unknown as typeof IntersectionObserver;
  window.ResizeObserver ??= MockObserver as unknown as typeof ResizeObserver;
}

/**
 * jsdom implements no canvas, and logs "Not implemented" on every getContext
 * call. The landing page pre-renders sprites, so a full run buried 45 identical
 * lines in the output.
 *
 * That noise is not harmless. Dozens of unmatched network mocks -- and the
 * silent fallbacks they caused -- sat in this same output for days, because
 * nobody reads a log that is mostly known chatter.
 *
 * Returning null directly is honest rather than a mute button: it is what a
 * browser without 2d support returns, the sprite builders now handle it by
 * degrading to an empty canvas, and every test therefore exercises that path
 * instead of relying on jsdom to throw somewhere out of sight.
 */
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = () => null;
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
