import { describe, it, expect } from "vitest";
import { generatePlanogramGrid, getRefillList } from "@/lib/operator-detail";
import { buildInventoryItem } from "@/test/factories/operator";

// ---------------------------------------------------------------------------
// generatePlanogramGrid — slot addressing
// ---------------------------------------------------------------------------

describe("generatePlanogramGrid slot labels", () => {
  it("labels slots by shelf letter and 1-based position", () => {
    const items = Array.from({ length: 6 }, () => buildInventoryItem());
    const grid = generatePlanogramGrid(items, 4);
    expect(grid[0][0].slotLabel).toBe("A1");
    expect(grid[0][3].slotLabel).toBe("A4");
    expect(grid[1][0].slotLabel).toBe("B1");
    expect(grid[1][1].slotLabel).toBe("B2");
  });

  it("keeps one label per item across the whole grid", () => {
    const items = Array.from({ length: 10 }, () => buildInventoryItem());
    const grid = generatePlanogramGrid(items, 4);
    const labels = grid.flat().map((slot) => slot.slotLabel);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toHaveLength(10);
  });
});

// ---------------------------------------------------------------------------
// getRefillList — which slot needs restocking
// ---------------------------------------------------------------------------

describe("getRefillList", () => {
  it("returns only items below the healthy threshold", () => {
    const items = [
      buildInventoryItem({ currentStock: 12, capacity: 12 }), // healthy
      buildInventoryItem({ currentStock: 1, capacity: 12 }), // critical
      buildInventoryItem({ currentStock: 0, capacity: 12 }), // out-of-stock
    ];
    const refill = getRefillList(items, 4);
    expect(refill).toHaveLength(2);
  });

  it("attaches the slot label to each refill entry", () => {
    const items = [
      buildInventoryItem({ currentStock: 12, capacity: 12 }), // A1 healthy
      buildInventoryItem({ currentStock: 1, capacity: 12 }), // A2 critical
    ];
    const refill = getRefillList(items, 4);
    expect(refill[0].slotLabel).toBe("A2");
    expect(refill[0].productName).toBe(items[1].productName);
  });

  it("orders the most urgent (lowest fill) first", () => {
    const items = [
      buildInventoryItem({ currentStock: 4, capacity: 12 }), // 33%
      buildInventoryItem({ currentStock: 0, capacity: 12 }), // 0%
      buildInventoryItem({ currentStock: 2, capacity: 12 }), // 17%
    ];
    const refill = getRefillList(items, 4);
    expect(refill.map((r) => r.currentStock)).toEqual([0, 2, 4]);
  });

  it("returns an empty list when everything is stocked", () => {
    const items = [
      buildInventoryItem({ currentStock: 12, capacity: 12 }),
      buildInventoryItem({ currentStock: 10, capacity: 12 }),
    ];
    expect(getRefillList(items, 4)).toEqual([]);
  });
});
