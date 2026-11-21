import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkRateLimit } from "../rateLimit";

/**
 * Rate limiter behavior tests.
 *
 * The store is module-level state so we reset time with fake timers to keep
 * tests isolated without reaching into the module internals.
 */
describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when under the limit", () => {
    it("allows the first request", () => {
      const result = checkRateLimit("1.2.3.4", "test", 5, 60_000);
      expect(result.allowed).toBe(true);
    });

    it("returns remaining count decremented by one", () => {
      const result = checkRateLimit("10.0.0.1", "remaining-test", 10, 60_000);
      expect(result.remaining).toBe(9);
    });

    it("allows requests up to the exact limit, and blocks the one after", () => {
      const results = Array.from({ length: 6 }, () =>
        checkRateLimit("1.1.1.1", "exact-limit", 5, 60_000),
      );
      expect(results.map((r) => r.allowed)).toEqual([true, true, true, true, true, false]);
    });

    it("counts the remaining requests down one at a time", () => {
      const remaining = Array.from({ length: 4 }, () =>
        checkRateLimit("10.0.0.2", "countdown", 3, 60_000).remaining,
      );
      expect(remaining).toEqual([2, 1, 0, 0]);
    });
  });

  describe("when over the limit", () => {
    it("blocks the (limit + 1)th request", () => {
      for (let i = 0; i < 3; i++) {
        checkRateLimit("2.2.2.2", "block-test", 3, 60_000);
      }
      const over = checkRateLimit("2.2.2.2", "block-test", 3, 60_000);
      expect(over.allowed).toBe(false);
    });

    it("returns remaining of 0 when blocked", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("3.3.3.3", "remaining-zero", 5, 60_000);
      }
      const over = checkRateLimit("3.3.3.3", "remaining-zero", 5, 60_000);
      expect(over.remaining).toBe(0);
    });

    it("reports when the window ends, one window after the first request", () => {
      for (let i = 0; i < 2; i++) {
        checkRateLimit("4.4.4.4", "reset-at", 2, 60_000);
      }
      const over = checkRateLimit("4.4.4.4", "reset-at", 2, 60_000);
      expect(over.resetAt).toBe(Date.now() + 60_000);
    });

    it("keeps the window fixed instead of sliding it forward on every request", () => {
      const first = checkRateLimit("4.4.4.5", "fixed-window", 2, 60_000);
      vi.advanceTimersByTime(20_000);
      const second = checkRateLimit("4.4.4.5", "fixed-window", 2, 60_000);
      expect(second.resetAt).toBe(first.resetAt);
    });
  });

  describe("window isolation", () => {
    it("resets the count after the window expires", () => {
      for (let i = 0; i < 3; i++) {
        checkRateLimit("5.5.5.5", "window-reset", 3, 60_000);
      }
      // advance past the window
      vi.advanceTimersByTime(61_000);

      const afterReset = checkRateLimit("5.5.5.5", "window-reset", 3, 60_000);
      expect(afterReset.allowed).toBe(true);
    });

    it("does not reset the count before the window expires", () => {
      for (let i = 0; i < 3; i++) {
        checkRateLimit("6.6.6.6", "no-early-reset", 3, 60_000);
      }
      vi.advanceTimersByTime(30_000); // half the window

      const stillBlocked = checkRateLimit(
        "6.6.6.6",
        "no-early-reset",
        3,
        60_000,
      );
      expect(stillBlocked.allowed).toBe(false);
    });
  });

  describe("window edges", () => {
    // A short window, so the sweep that clears expired entries (at most once a
    // minute) can't be what resets the count.
    it("starts a fresh window the moment the old one ends", () => {
      for (let i = 0; i < 3; i++) {
        checkRateLimit("5.5.5.6", "edge-at-end", 3, 10_000);
      }
      vi.advanceTimersByTime(10_000);

      const result = checkRateLimit("5.5.5.6", "edge-at-end", 3, 10_000);

      expect(result).toMatchObject({ allowed: true, remaining: 2 });
    });

    it("is still blocked one millisecond before the window ends", () => {
      for (let i = 0; i < 3; i++) {
        checkRateLimit("5.5.5.7", "edge-before-end", 3, 10_000);
      }
      vi.advanceTimersByTime(9_999);

      expect(checkRateLimit("5.5.5.7", "edge-before-end", 3, 10_000).allowed).toBe(false);
    });
  });

  describe("bucket isolation", () => {
    it("counts different IPs independently within the same bucket", () => {
      for (let i = 0; i < 2; i++) {
        checkRateLimit("7.7.7.7", "ip-isolation", 2, 60_000);
      }
      // different IP should start fresh
      const different = checkRateLimit("8.8.8.8", "ip-isolation", 2, 60_000);
      expect(different.allowed).toBe(true);
    });

    it("counts different buckets independently for the same IP", () => {
      for (let i = 0; i < 2; i++) {
        checkRateLimit("9.9.9.9", "bucket-a", 2, 60_000);
      }
      const blocked = checkRateLimit("9.9.9.9", "bucket-a", 2, 60_000);
      expect(blocked.allowed).toBe(false);

      // same IP, different bucket — should be allowed
      const different = checkRateLimit("9.9.9.9", "bucket-b", 2, 60_000);
      expect(different.allowed).toBe(true);
    });
  });
});
