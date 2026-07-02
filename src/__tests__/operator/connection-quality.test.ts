import { describe, it, expect } from "vitest";
import { getConnectionQuality } from "@/lib/operator-detail";

// ---------------------------------------------------------------------------
// getConnectionQuality — derives signal quality from lastPing timestamp
//
// Four tiers based on sensor reading frequency:
//   strong  = <2 min    (3 bars)
//   weak    = 2-5 min   (2 bars)
//   poor    = 5-10 min  (1 bar)
//   offline = >10 min   (X icon)
// ---------------------------------------------------------------------------

describe("getConnectionQuality", () => {
  it("returns 'strong' when lastPing is within 2 minutes", () => {
    const recent = new Date(Date.now() - 60_000).toISOString();
    expect(getConnectionQuality(recent)).toBe("strong");
  });

  it("returns 'strong' for a ping that just happened", () => {
    const now = new Date().toISOString();
    expect(getConnectionQuality(now)).toBe("strong");
  });

  it("returns 'weak' when lastPing is between 2 and 5 minutes ago", () => {
    const threeMinAgo = new Date(Date.now() - 3 * 60_000).toISOString();
    expect(getConnectionQuality(threeMinAgo)).toBe("weak");
  });

  it("returns 'weak' right at 2 minutes (boundary)", () => {
    const twoMinAgo = new Date(Date.now() - 2 * 60_000).toISOString();
    expect(getConnectionQuality(twoMinAgo)).toBe("weak");
  });

  it("returns 'poor' when lastPing is between 5 and 10 minutes ago", () => {
    const sevenMinAgo = new Date(Date.now() - 7 * 60_000).toISOString();
    expect(getConnectionQuality(sevenMinAgo)).toBe("poor");
  });

  it("returns 'poor' right at 5 minutes (boundary)", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(getConnectionQuality(fiveMinAgo)).toBe("poor");
  });

  it("returns 'offline' when lastPing is older than 10 minutes", () => {
    const fifteenMinAgo = new Date(Date.now() - 15 * 60_000).toISOString();
    expect(getConnectionQuality(fifteenMinAgo)).toBe("offline");
  });

  it("returns 'offline' right at 10 minutes (boundary)", () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60_000).toISOString();
    expect(getConnectionQuality(tenMinAgo)).toBe("offline");
  });

  it("returns 'offline' for a ping from hours ago", () => {
    const hoursAgo = new Date(Date.now() - 2 * 60 * 60_000).toISOString();
    expect(getConnectionQuality(hoursAgo)).toBe("offline");
  });
});
