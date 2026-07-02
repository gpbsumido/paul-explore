import { describe, it, expect } from "vitest";
import {
  getLowStockItemIds,
  getDismissableAlerts,
} from "@/lib/operator-detail";
import { buildInventoryItem, buildAlert } from "@/test/factories/operator";

// ---------------------------------------------------------------------------
// getLowStockItemIds — finds items that need restocking
// ---------------------------------------------------------------------------

describe("getLowStockItemIds", () => {
  it("returns ids of items with stock below 50% capacity", () => {
    const items = [
      buildInventoryItem({ id: "low-1", currentStock: 2, capacity: 12 }),
      buildInventoryItem({ id: "healthy-1", currentStock: 10, capacity: 12 }),
      buildInventoryItem({ id: "empty-1", currentStock: 0, capacity: 12 }),
    ];
    const ids = getLowStockItemIds(items);
    expect(ids).toContain("low-1");
    expect(ids).toContain("empty-1");
    expect(ids).not.toContain("healthy-1");
  });

  it("returns empty array when all items are healthy", () => {
    const items = [
      buildInventoryItem({ currentStock: 10, capacity: 12 }),
      buildInventoryItem({ currentStock: 8, capacity: 12 }),
    ];
    expect(getLowStockItemIds(items)).toEqual([]);
  });

  it("returns empty array for empty inventory", () => {
    expect(getLowStockItemIds([])).toEqual([]);
  });

  it("includes critical and out-of-stock items", () => {
    const items = [
      buildInventoryItem({ id: "crit", currentStock: 1, capacity: 12 }),
      buildInventoryItem({ id: "oos", currentStock: 0, capacity: 12 }),
    ];
    const ids = getLowStockItemIds(items);
    expect(ids).toContain("crit");
    expect(ids).toContain("oos");
  });

  it("does not include items at exactly 50% (healthy threshold)", () => {
    const items = [
      buildInventoryItem({ id: "border", currentStock: 6, capacity: 12 }),
    ];
    expect(getLowStockItemIds(items)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getDismissableAlerts — finds non-critical, unacknowledged alerts
// ---------------------------------------------------------------------------

describe("getDismissableAlerts", () => {
  it("returns non-critical unacknowledged alerts", () => {
    const alerts = [
      buildAlert({ id: "w1", severity: "warning", acknowledged: false }),
      buildAlert({ id: "i1", severity: "info", acknowledged: false }),
      buildAlert({ id: "c1", severity: "critical", acknowledged: false }),
    ];
    const dismissable = getDismissableAlerts(alerts);
    expect(dismissable.map((a) => a.id)).toContain("w1");
    expect(dismissable.map((a) => a.id)).toContain("i1");
    expect(dismissable.map((a) => a.id)).not.toContain("c1");
  });

  it("excludes already acknowledged alerts", () => {
    const alerts = [
      buildAlert({ id: "w1", severity: "warning", acknowledged: true }),
      buildAlert({ id: "w2", severity: "warning", acknowledged: false }),
    ];
    const dismissable = getDismissableAlerts(alerts);
    expect(dismissable.map((a) => a.id)).toEqual(["w2"]);
  });

  it("returns empty array when all alerts are critical", () => {
    const alerts = [
      buildAlert({ severity: "critical", acknowledged: false }),
      buildAlert({ severity: "critical", acknowledged: false }),
    ];
    expect(getDismissableAlerts(alerts)).toEqual([]);
  });

  it("returns empty array for empty alert list", () => {
    expect(getDismissableAlerts([])).toEqual([]);
  });

  it("returns empty array when all alerts are acknowledged", () => {
    const alerts = [
      buildAlert({ severity: "warning", acknowledged: true }),
      buildAlert({ severity: "info", acknowledged: true }),
    ];
    expect(getDismissableAlerts(alerts)).toEqual([]);
  });
});
