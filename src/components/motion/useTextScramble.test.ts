import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { scrambleFrame, useTextScramble } from "./useTextScramble";

// Reduced motion comes from a context provider, so the honest way to flip it in
// a hook test is to stub the provider module. vi.hoisted keeps the flag
// reachable from the hoisted factory without resetting the module registry,
// which would pull in a second React copy and break every hook call.
const mocks = vi.hoisted(() => ({ reduced: false }));
vi.mock("@/app/providers", () => ({
  useHubReducedMotion: () => mocks.reduced,
}));

beforeEach(() => {
  mocks.reduced = false;
});

const CHARSET = "ABC";

/**
 * The decode effect splits into a pure frame builder and a rAF loop that walks
 * the reveal count. The frame builder is where the rules live, so it carries
 * most of the coverage.
 */
describe("scrambleFrame", () => {
  it("keeps the revealed prefix exactly as written", () => {
    const frame = scrambleFrame({
      text: "hello",
      revealed: 3,
      charset: CHARSET,
      random: () => 0,
    });
    expect(frame.slice(0, 3)).toBe("hel");
  });

  it("draws unrevealed characters only from the charset", () => {
    const frame = scrambleFrame({
      text: "hello",
      revealed: 0,
      charset: CHARSET,
      random: () => 0.5,
    });
    for (const char of frame) {
      expect(CHARSET).toContain(char);
    }
  });

  it("never scrambles whitespace", () => {
    const frame = scrambleFrame({
      text: "a b\tc",
      revealed: 0,
      charset: CHARSET,
      random: () => 0.5,
    });
    expect(frame[1]).toBe(" ");
    expect(frame[3]).toBe("\t");
  });

  it("preserves the source length", () => {
    const text = "design language";
    const frame = scrambleFrame({
      text,
      revealed: 4,
      charset: CHARSET,
      random: () => 0.9,
    });
    expect(frame).toHaveLength(text.length);
  });

  it("returns the source text once everything is revealed", () => {
    const frame = scrambleFrame({
      text: "hello",
      revealed: 5,
      charset: CHARSET,
      random: () => 0.5,
    });
    expect(frame).toBe("hello");
  });

  it("settles left to right, so a larger reveal count is a longer prefix", () => {
    const early = scrambleFrame({
      text: "verdigris",
      revealed: 2,
      charset: CHARSET,
      random: () => 0.5,
    });
    const later = scrambleFrame({
      text: "verdigris",
      revealed: 5,
      charset: CHARSET,
      random: () => 0.5,
    });
    expect(early.startsWith("ve")).toBe(true);
    expect(later.startsWith("verdi")).toBe(true);
  });
});

describe("useTextScramble", () => {
  it("settles on the source text", async () => {
    const { result } = renderHook(() =>
      useTextScramble({ text: "ember", trigger: "mount", speedMs: 1 }),
    );

    await waitFor(() => expect(result.current.display).toBe("ember"));
  });

  it("returns the final text immediately under reduced motion", () => {
    mocks.reduced = true;

    const { result } = renderHook(() =>
      useTextScramble({ text: "ember", trigger: "mount", speedMs: 1000 }),
    );

    expect(result.current.display).toBe("ember");
    expect(result.current.isScrambling).toBe(false);
  });

  it("does not start on its own when the trigger is inView", () => {
    const { result } = renderHook(() =>
      useTextScramble({ text: "ember", trigger: "inView", speedMs: 1 }),
    );

    expect(result.current.isScrambling).toBe(false);
  });
});
