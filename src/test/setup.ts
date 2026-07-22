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

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
