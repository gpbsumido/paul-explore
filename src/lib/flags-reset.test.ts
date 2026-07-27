import { describe, it, expect } from "vitest";
import { msUntilNextReset, formatResetCountdown } from "./flags-reset";

/** A fixed UTC instant helper for deterministic tests. */
const at = (iso: string): Date => new Date(iso);

describe("msUntilNextReset", () => {
  it("counts down to the next 6-hour UTC boundary", () => {
    // 01:00 UTC -> next reset is 06:00 UTC, 5h away.
    expect(msUntilNextReset(at("2026-07-27T01:00:00Z"))).toBe(5 * 3600_000);
  });

  it("rolls to the following day when past the last boundary", () => {
    // 19:30 UTC -> next reset is 00:00 UTC tomorrow, 4h30m away.
    expect(msUntilNextReset(at("2026-07-27T19:30:00Z"))).toBe(
      4 * 3600_000 + 30 * 60_000,
    );
  });

  it("returns a full 6 hours when sitting exactly on a boundary", () => {
    expect(msUntilNextReset(at("2026-07-27T12:00:00Z"))).toBe(6 * 3600_000);
  });
});

describe("formatResetCountdown", () => {
  it("shows hours and minutes when over an hour away", () => {
    expect(formatResetCountdown(2 * 3600_000 + 14 * 60_000)).toBe("2h 14m");
  });

  it("shows minutes only when under an hour", () => {
    expect(formatResetCountdown(43 * 60_000)).toBe("43m");
  });

  it("rounds up to the current minute so it never reads 0m early", () => {
    expect(formatResetCountdown(90_000)).toBe("2m");
  });

  it("collapses to a friendly label under a minute", () => {
    expect(formatResetCountdown(20_000)).toBe("under a minute");
  });
});
