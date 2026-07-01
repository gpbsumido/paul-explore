import { describe, it, expect } from "vitest";
import {
  getFreshnessLevel,
  isStaleData,
  isSensorOffline,
} from "@/lib/operator-freshness";

// ---------------------------------------------------------------------------
// getFreshnessLevel — maps elapsed time to a visual tier
// ---------------------------------------------------------------------------

describe("getFreshnessLevel", () => {
  const now = Date.now();

  it("returns 'fresh' when lastPing is less than 2 minutes old", () => {
    const oneMinAgo = new Date(now - 60_000).toISOString();
    expect(getFreshnessLevel(oneMinAgo, now)).toBe("fresh");
  });

  it("returns 'fresh' for a ping that just happened", () => {
    const justNow = new Date(now).toISOString();
    expect(getFreshnessLevel(justNow, now)).toBe("fresh");
  });

  it("returns 'aging' when lastPing is between 2 and 10 minutes old", () => {
    const fiveMinAgo = new Date(now - 5 * 60_000).toISOString();
    expect(getFreshnessLevel(fiveMinAgo, now)).toBe("aging");
  });

  it("returns 'aging' right at 2 minutes (boundary)", () => {
    const twoMinAgo = new Date(now - 2 * 60_000).toISOString();
    expect(getFreshnessLevel(twoMinAgo, now)).toBe("aging");
  });

  it("returns 'stale' when lastPing is older than 10 minutes", () => {
    const fifteenMinAgo = new Date(now - 15 * 60_000).toISOString();
    expect(getFreshnessLevel(fifteenMinAgo, now)).toBe("stale");
  });

  it("returns 'stale' right at 10 minutes (boundary)", () => {
    const tenMinAgo = new Date(now - 10 * 60_000).toISOString();
    expect(getFreshnessLevel(tenMinAgo, now)).toBe("stale");
  });

  it("returns 'stale' for a ping from hours ago", () => {
    const hoursAgo = new Date(now - 3 * 60 * 60_000).toISOString();
    expect(getFreshnessLevel(hoursAgo, now)).toBe("stale");
  });

  it("returns 'aging' just before 10 minutes", () => {
    const nineMin59s = new Date(now - (10 * 60_000 - 1_000)).toISOString();
    expect(getFreshnessLevel(nineMin59s, now)).toBe("aging");
  });
});

// ---------------------------------------------------------------------------
// isStaleData — boolean check for the 10-minute stale threshold
// ---------------------------------------------------------------------------

describe("isStaleData", () => {
  const now = Date.now();

  it("returns false when data is less than 10 minutes old", () => {
    const fiveMinAgo = new Date(now - 5 * 60_000).toISOString();
    expect(isStaleData(fiveMinAgo, now)).toBe(false);
  });

  it("returns true when data is exactly 10 minutes old", () => {
    const tenMinAgo = new Date(now - 10 * 60_000).toISOString();
    expect(isStaleData(tenMinAgo, now)).toBe(true);
  });

  it("returns true when data is older than 10 minutes", () => {
    const twentyMinAgo = new Date(now - 20 * 60_000).toISOString();
    expect(isStaleData(twentyMinAgo, now)).toBe(true);
  });

  it("returns false for fresh data", () => {
    const justNow = new Date(now).toISOString();
    expect(isStaleData(justNow, now)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isSensorOffline — boolean check for the 30-minute offline threshold
// ---------------------------------------------------------------------------

describe("isSensorOffline", () => {
  const now = Date.now();

  it("returns false when sensor reported less than 30 minutes ago", () => {
    const tenMinAgo = new Date(now - 10 * 60_000).toISOString();
    expect(isSensorOffline(tenMinAgo, now)).toBe(false);
  });

  it("returns false just before 30 minutes", () => {
    const justUnder = new Date(now - (30 * 60_000 - 1_000)).toISOString();
    expect(isSensorOffline(justUnder, now)).toBe(false);
  });

  it("returns true at exactly 30 minutes", () => {
    const thirtyMinAgo = new Date(now - 30 * 60_000).toISOString();
    expect(isSensorOffline(thirtyMinAgo, now)).toBe(true);
  });

  it("returns true when sensor reported over 30 minutes ago", () => {
    const hourAgo = new Date(now - 60 * 60_000).toISOString();
    expect(isSensorOffline(hourAgo, now)).toBe(true);
  });

  it("returns false for recent data", () => {
    const justNow = new Date(now).toISOString();
    expect(isSensorOffline(justNow, now)).toBe(false);
  });
});
