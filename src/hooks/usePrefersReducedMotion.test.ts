import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type Listener = (e: MediaQueryListEvent) => void;

function mockMatchMedia(matches: boolean) {
  const listeners: Listener[] = [];
  const mql = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_: string, l: Listener) => listeners.push(l),
    removeEventListener: (_: string, l: Listener) => {
      const i = listeners.indexOf(l);
      if (i >= 0) listeners.splice(i, 1);
    },
  };
  // Only the reduced-motion query is answered; anything else reads as "no".
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) =>
      query === mql.media
        ? mql
        : { ...mql, matches: false, media: query },
    ),
  );
  return {
    change(next: boolean) {
      mql.matches = next;
      listeners.forEach((l) => l({ matches: next } as MediaQueryListEvent));
    },
    listenerCount: () => listeners.length,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("usePrefersReducedMotion", () => {
  it("reports the preference when it is set", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it("reports false when the reader has expressed no preference", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it("follows the preference changing while the page is open", () => {
    const mql = mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
    act(() => mql.change(true));
    expect(result.current).toBe(true);
  });

  it("stops listening when unmounted", () => {
    const mql = mockMatchMedia(true);
    const { unmount } = renderHook(() => usePrefersReducedMotion());
    expect(mql.listenerCount()).toBe(1);
    unmount();
    expect(mql.listenerCount()).toBe(0);
  });

  it("reads false when the browser has no matchMedia", () => {
    vi.stubGlobal("matchMedia", undefined);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it("renders as no preference on the server, even when the reader has one", () => {
    mockMatchMedia(true);
    function Probe() {
      return createElement("span", null, usePrefersReducedMotion() ? "reduced" : "full motion");
    }
    expect(renderToString(createElement(Probe))).toContain("full motion");
  });
});
