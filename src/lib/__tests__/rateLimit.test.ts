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

    it("allows requests up to the exact limit", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("1.1.1.1", "exact-limit", 5, 60_000);
      }
      const last = checkRateLimit("1.1.1.1", "exact-limit", 5, 60_000);
      expect(last.allowed).toBe(false);
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

    it("includes a resetAt timestamp in the future", () => {
      for (let i = 0; i < 2; i++) {
        checkRateLimit("4.4.4.4", "reset-at", 2, 60_000);
      }
      const over = checkRateLimit("4.4.4.4", "reset-at", 2, 60_000);
      expect(over.resetAt).toBeGreaterThan(Date.now());
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
