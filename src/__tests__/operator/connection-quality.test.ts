import { afterEach, describe, it, expect, vi } from "vitest";
import { getConnectionQuality } from "@/lib/operator-detail";

// ---------------------------------------------------------------------------
// getConnectionQuality — derives signal quality from lastPing timestamp
//
// Four tiers based on sensor reading frequency:
//   strong  = <2 min    (3 bars)
//   weak    = 2-5 min   (2 bars)
//   poor    = 5-10 min  (1 bar)
//   offline = >10 min   (X icon)
//
// The clock is passed in, so a boundary like "exactly 2 minutes" really is
// exactly 2 minutes and not 2 minutes plus however long the test took to run.
// ---------------------------------------------------------------------------

const NOW = Date.parse("2026-08-01T12:00:00Z");
const MINUTE = 60_000;

/** An ISO ping timestamp that is `minutes` before NOW. */
function pingedMinutesAgo(minutes: number): string {
  return new Date(NOW - minutes * MINUTE).toISOString();
}

describe("getConnectionQuality", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'strong' when lastPing is within 2 minutes", () => {
    expect(getConnectionQuality(pingedMinutesAgo(1), NOW)).toBe("strong");
  });

  it("returns 'strong' for a ping that just happened", () => {
    expect(getConnectionQuality(pingedMinutesAgo(0), NOW)).toBe("strong");
  });

  it("returns 'strong' just under the 2 minute mark", () => {
    const justUnder = new Date(NOW - 2 * MINUTE + 1).toISOString();
    expect(getConnectionQuality(justUnder, NOW)).toBe("strong");
  });

  it("returns 'weak' when lastPing is between 2 and 5 minutes ago", () => {
    expect(getConnectionQuality(pingedMinutesAgo(3), NOW)).toBe("weak");
  });

  it("returns 'weak' right at 2 minutes (boundary)", () => {
    expect(getConnectionQuality(pingedMinutesAgo(2), NOW)).toBe("weak");
  });

  it("returns 'poor' when lastPing is between 5 and 10 minutes ago", () => {
    expect(getConnectionQuality(pingedMinutesAgo(7), NOW)).toBe("poor");
  });

  it("returns 'poor' right at 5 minutes (boundary)", () => {
    expect(getConnectionQuality(pingedMinutesAgo(5), NOW)).toBe("poor");
  });

  it("returns 'offline' when lastPing is older than 10 minutes", () => {
    expect(getConnectionQuality(pingedMinutesAgo(15), NOW)).toBe("offline");
  });

  it("returns 'offline' right at 10 minutes (boundary)", () => {
    expect(getConnectionQuality(pingedMinutesAgo(10), NOW)).toBe("offline");
  });

  it("returns 'offline' for a ping from hours ago", () => {
    expect(getConnectionQuality(pingedMinutesAgo(120), NOW)).toBe("offline");
  });

  it("measures against the current time when no clock is passed in", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(getConnectionQuality(pingedMinutesAgo(1))).toBe("strong");
    expect(getConnectionQuality(pingedMinutesAgo(3))).toBe("weak");
    expect(getConnectionQuality(pingedMinutesAgo(30))).toBe("offline");
  });
});
