import { describe, it, expect } from "vitest";
import { parseTab, TABS, getConnectionQuality } from "@/lib/operator-detail";

// ---------------------------------------------------------------------------
// parseTab — resolves a URL search param into a valid tab ID
// ---------------------------------------------------------------------------

describe("parseTab", () => {
  it("returns 'inventory' when the param is null", () => {
    expect(parseTab(null)).toBe("inventory");
  });

  it("returns 'inventory' when the param is an empty string", () => {
    expect(parseTab("")).toBe("inventory");
  });

  it("returns the param when it matches a known tab", () => {
    expect(parseTab("alerts")).toBe("alerts");
    expect(parseTab("activity")).toBe("activity");
    expect(parseTab("planogram")).toBe("planogram");
    expect(parseTab("inventory")).toBe("inventory");
  });

  it("falls back to 'inventory' for an unknown param", () => {
    expect(parseTab("settings")).toBe("inventory");
    expect(parseTab("ALERTS")).toBe("inventory");
  });

  it("exposes all four tabs in the TABS constant", () => {
    const ids = TABS.map((t) => t.id);
    expect(ids).toEqual(["inventory", "alerts", "activity", "planogram"]);
  });

  it("gives every tab a human-readable label", () => {
    for (const tab of TABS) {
      expect(tab.label).toBeTruthy();
      expect(typeof tab.label).toBe("string");
    }
  });
});

// ---------------------------------------------------------------------------
// getConnectionQuality — derives signal quality from lastPing timestamp
// ---------------------------------------------------------------------------

describe("getConnectionQuality", () => {
  it("returns 'strong' when lastPing is within 2 minutes", () => {
    const recent = new Date(Date.now() - 60_000).toISOString();
    expect(getConnectionQuality(recent)).toBe("strong");
  });

  it("returns 'weak' when lastPing is between 2 and 5 minutes ago", () => {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60_000).toISOString();
    expect(getConnectionQuality(threeMinutesAgo)).toBe("weak");
  });

  it("returns 'offline' when lastPing is older than 10 minutes", () => {
    const fifteenMinAgo = new Date(Date.now() - 15 * 60_000).toISOString();
    expect(getConnectionQuality(fifteenMinAgo)).toBe("offline");
  });

  it("returns 'strong' for a ping that just happened", () => {
    const now = new Date().toISOString();
    expect(getConnectionQuality(now)).toBe("strong");
  });

  it("returns 'offline' for a ping from hours ago", () => {
    const hoursAgo = new Date(Date.now() - 2 * 60 * 60_000).toISOString();
    expect(getConnectionQuality(hoursAgo)).toBe("offline");
  });

  it("returns 'weak' right at 2 minutes (not strong)", () => {
    const exactlyTwoMin = new Date(Date.now() - 2 * 60_000).toISOString();
    expect(getConnectionQuality(exactlyTwoMin)).toBe("weak");
  });

  it("returns 'poor' right at 5 minutes (not weak)", () => {
    const exactlyFiveMin = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(getConnectionQuality(exactlyFiveMin)).toBe("poor");
  });
});
