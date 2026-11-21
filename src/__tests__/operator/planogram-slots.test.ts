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

  it("carries each item's product details into its slot", () => {
    const items = [
      buildInventoryItem({
        productName: "Cola",
        category: "beverages",
        currentStock: 3,
        capacity: 12,
      }),
    ];
    expect(generatePlanogramGrid(items, 4)[0][0]).toMatchObject({
      productName: "Cola",
      category: "beverages",
      currentStock: 3,
      capacity: 12,
    });
  });

  it("starts a new shelf after shelfWidth slots, with the last shelf left short", () => {
    const items = Array.from({ length: 6 }, () => buildInventoryItem());
    const grid = generatePlanogramGrid(items, 4);
    expect(grid.map((shelf) => shelf.length)).toEqual([4, 2]);
  });

  it("returns no shelves when there are no items", () => {
    expect(generatePlanogramGrid([], 4)).toEqual([]);
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
// generatePlanogramGrid — sensor flag
//
// About one slot in five reads as a mismatch, picked from the item id so a
// shelf looks the same on every render.
// ---------------------------------------------------------------------------

describe("generatePlanogramGrid sensor flag", () => {
  const items = Array.from({ length: 100 }, (_, i) =>
    buildInventoryItem({ id: `item-${String(i + 1).padStart(3, "0")}` }),
  );

  it("flags a minority of slots as mismatched", () => {
    const flags = generatePlanogramGrid(items, 4).flat();
    const mismatched = flags.filter((slot) => !slot.sensorMatch).length;
    expect(mismatched).toBeGreaterThanOrEqual(10);
    expect(mismatched).toBeLessThanOrEqual(30);
  });

  it("gives the same item the same flag on every render", () => {
    const first = generatePlanogramGrid(items, 4).flat();
    const second = generatePlanogramGrid(items, 4).flat();
    expect(second.map((slot) => slot.sensorMatch)).toEqual(
      first.map((slot) => slot.sensorMatch),
    );
  });
});

// ---------------------------------------------------------------------------
// getRefillList — which slot needs restocking
// ---------------------------------------------------------------------------

describe("getRefillList", () => {
  it("returns every item below the healthy threshold and nothing else", () => {
    const items = [
      buildInventoryItem({
        productName: "Full",
        currentStock: 12,
        capacity: 12,
      }),
      buildInventoryItem({
        productName: "Critical",
        currentStock: 1,
        capacity: 12,
      }),
      buildInventoryItem({
        productName: "Out",
        currentStock: 0,
        capacity: 12,
      }),
      buildInventoryItem({
        productName: "Low",
        currentStock: 5,
        capacity: 12,
      }),
      buildInventoryItem({
        productName: "Just healthy",
        currentStock: 6,
        capacity: 12,
      }),
    ];
    const refill = getRefillList(items, 4);
    expect(refill.map((r) => r.productName).sort()).toEqual([
      "Critical",
      "Low",
      "Out",
    ]);
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
