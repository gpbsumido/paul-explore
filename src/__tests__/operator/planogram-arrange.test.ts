import { describe, it, expect } from "vitest";
import { moveToBox, assemblePlanogram } from "@/lib/operator-detail";
import type { PlanogramSlotRecord } from "@/lib/operator-detail";
import { buildInventoryItem } from "@/test/factories/operator";
import type { InventoryItem } from "@/types/operator";

const A: PlanogramSlotRecord = { itemId: "item-a", sensorMatch: true };
const B: PlanogramSlotRecord = { itemId: "item-b", sensorMatch: false };
const EMPTY: PlanogramSlotRecord = { itemId: null, sensorMatch: true };

// ---------------------------------------------------------------------------
// moveToBox — place a box's contents into another box
// ---------------------------------------------------------------------------

describe("moveToBox", () => {
  it("moves contents into an empty box and vacates the source", () => {
    const result = moveToBox([A, EMPTY], 0, 1);
    expect(result[1]).toEqual(A);
    expect(result[0]).toEqual({ itemId: null, sensorMatch: true });
  });

  it("swaps contents when the target box is occupied", () => {
    const result = moveToBox([A, B], 0, 1);
    expect(result[0]).toEqual(B);
    expect(result[1]).toEqual(A);
  });

  it("returns an unchanged copy when source and target are the same", () => {
    const boxes = [A, B];
    const result = moveToBox(boxes, 1, 1);
    expect(result).toEqual([A, B]);
    expect(result).not.toBe(boxes);
  });

  it("clamps out-of-range indices", () => {
    const result = moveToBox([A, EMPTY, EMPTY], 0, 9);
    expect(result[2]).toEqual(A);
    expect(result[0]).toEqual({ itemId: null, sensorMatch: true });
  });

  it("does not mutate the input", () => {
    const boxes = [A, EMPTY];
    moveToBox(boxes, 0, 1);
    expect(boxes).toEqual([A, EMPTY]);
  });
});

// ---------------------------------------------------------------------------
// assemblePlanogram — join persisted boxes (some empty) with inventory
// ---------------------------------------------------------------------------

function itemsMap(items: readonly InventoryItem[]): Map<string, InventoryItem> {
  return new Map(items.map((i) => [i.id, i]));
}

describe("assemblePlanogram", () => {
  it("renders occupied and empty boxes in order with addresses", () => {
    const items = [
      buildInventoryItem({ id: "item-a" }),
      buildInventoryItem({ id: "item-b" }),
    ];
    const boxes: PlanogramSlotRecord[] = [
      { itemId: "item-a", sensorMatch: true },
      { itemId: null, sensorMatch: true },
      { itemId: "item-b", sensorMatch: true },
    ];
    const grid = assemblePlanogram(boxes, itemsMap(items), 4);
    expect(grid[0][0].slotLabel).toBe("A1");
    expect(grid[0][0].itemId).toBe("item-a");
    expect(grid[0][0].empty).toBe(false);
    expect(grid[0][1].slotLabel).toBe("A2");
    expect(grid[0][1].empty).toBe(true);
    expect(grid[0][1].itemId).toBeNull();
    expect(grid[0][2].itemId).toBe("item-b");
  });

  it("carries sensorMatch from the box record", () => {
    const items = [buildInventoryItem({ id: "item-a" })];
    const boxes = [{ itemId: "item-a", sensorMatch: false }];
    const grid = assemblePlanogram(boxes, itemsMap(items), 4);
    expect(grid[0][0].sensorMatch).toBe(false);
  });

  it("joins product details for occupied boxes", () => {
    const items = [
      buildInventoryItem({
        id: "item-a",
        productName: "Cola",
        currentStock: 3,
        capacity: 12,
      }),
    ];
    const slot = assemblePlanogram(
      [{ itemId: "item-a", sensorMatch: true }],
      itemsMap(items),
      4,
    )[0][0];
    expect(slot.productName).toBe("Cola");
    expect(slot.currentStock).toBe(3);
    expect(slot.capacity).toBe(12);
  });

  it("renders a box whose item has left inventory as empty", () => {
    const items = [buildInventoryItem({ id: "item-a" })];
    const boxes = [
      { itemId: "item-a", sensorMatch: true },
      { itemId: "item-gone", sensorMatch: true },
    ];
    const grid = assemblePlanogram(boxes, itemsMap(items), 4);
    expect(grid.flat()).toHaveLength(2);
    expect(grid[0][1].empty).toBe(true);
  });

  it("returns an empty grid for no boxes", () => {
    expect(assemblePlanogram([], itemsMap([]), 4)).toEqual([]);
  });
});
