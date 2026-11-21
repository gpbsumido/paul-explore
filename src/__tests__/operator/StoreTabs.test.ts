import { describe, it, expect } from "vitest";
import { parseTab, TABS } from "@/lib/operator-detail";

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
    expect(parseTab("sales")).toBe("sales");
    expect(parseTab("pricing")).toBe("pricing");
    expect(parseTab("tax")).toBe("tax");
    expect(parseTab("restock-history")).toBe("restock-history");
  });

  it("falls back to 'inventory' for an unknown param", () => {
    expect(parseTab("settings")).toBe("inventory");
    expect(parseTab("ALERTS")).toBe("inventory");
  });

  it("exposes every store-detail tab in the TABS constant", () => {
    const ids = TABS.map((t) => t.id);
    expect(ids).toEqual([
      "inventory",
      "alerts",
      "activity",
      "planogram",
      "sales",
      "pricing",
      "tax",
      "restock-history",
    ]);
  });

  it("labels every tab the way it reads in the tab bar", () => {
    expect(Object.fromEntries(TABS.map((t) => [t.id, t.label]))).toEqual({
      inventory: "Inventory",
      alerts: "Alerts",
      activity: "Activity",
      planogram: "Planogram",
      sales: "Sales",
      pricing: "Pricing",
      tax: "Tax",
      "restock-history": "Restock History",
    });
  });
});
