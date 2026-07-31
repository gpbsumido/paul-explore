import { describe, it, expect } from "vitest";
import { moveSlot, assemblePlanogram } from "@/lib/operator-detail";
import { buildInventoryItem } from "@/test/factories/operator";
import type { InventoryItem } from "@/types/operator";

// ---------------------------------------------------------------------------
// moveSlot — reorder an ordered list of slot occupants
// ---------------------------------------------------------------------------

describe("moveSlot", () => {
  it("moves an item forward", () => {
    expect(moveSlot(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
  });

  it("moves an item backward", () => {
    expect(moveSlot(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("returns an unchanged copy when from equals to", () => {
    const order = ["a", "b", "c"];
    const result = moveSlot(order, 1, 1);
    expect(result).toEqual(["a", "b", "c"]);
    expect(result).not.toBe(order);
  });

  it("clamps a target index past the end to the last position", () => {
    expect(moveSlot(["a", "b", "c"], 0, 9)).toEqual(["b", "c", "a"]);
  });

  it("clamps a negative target index to the first position", () => {
    expect(moveSlot(["a", "b", "c"], 2, -3)).toEqual(["c", "a", "b"]);
  });

  it("does not mutate the input array", () => {
    const order = ["a", "b", "c"];
    moveSlot(order, 0, 2);
    expect(order).toEqual(["a", "b", "c"]);
  });
});

// ---------------------------------------------------------------------------
// assemblePlanogram — join persisted slot order + flags with inventory
// ---------------------------------------------------------------------------

function itemsMap(items: readonly InventoryItem[]): Map<string, InventoryItem> {
  return new Map(items.map((i) => [i.id, i]));
}

describe("assemblePlanogram", () => {
  it("lays occupants out in slot order with addresses", () => {
    const items = [
      buildInventoryItem({ id: "item-a" }),
      buildInventoryItem({ id: "item-b" }),
      buildInventoryItem({ id: "item-c" }),
    ];
    const slots = [
      { itemId: "item-b", sensorMatch: true },
      { itemId: "item-a", sensorMatch: true },
      { itemId: "item-c", sensorMatch: true },
    ];
    const grid = assemblePlanogram(slots, itemsMap(items), 4);
    expect(grid[0][0].slotLabel).toBe("A1");
    expect(grid[0][0].itemId).toBe("item-b");
    expect(grid[0][1].itemId).toBe("item-a");
  });

  it("carries sensorMatch from the slot record, not from the item", () => {
    const items = [buildInventoryItem({ id: "item-a" })];
    const slots = [{ itemId: "item-a", sensorMatch: false }];
    const grid = assemblePlanogram(slots, itemsMap(items), 4);
    expect(grid[0][0].sensorMatch).toBe(false);
  });

  it("joins product details from the inventory map", () => {
    const items = [
      buildInventoryItem({
        id: "item-a",
        productName: "Cola",
        currentStock: 3,
        capacity: 12,
      }),
    ];
    const slots = [{ itemId: "item-a", sensorMatch: true }];
    const slot = assemblePlanogram(slots, itemsMap(items), 4)[0][0];
    expect(slot.productName).toBe("Cola");
    expect(slot.currentStock).toBe(3);
    expect(slot.capacity).toBe(12);
  });

  it("skips slots whose item is no longer in inventory", () => {
    const items = [buildInventoryItem({ id: "item-a" })];
    const slots = [
      { itemId: "item-a", sensorMatch: true },
      { itemId: "item-gone", sensorMatch: true },
    ];
    const grid = assemblePlanogram(slots, itemsMap(items), 4);
    expect(grid.flat()).toHaveLength(1);
  });

  it("returns an empty grid for no slots", () => {
    expect(assemblePlanogram([], itemsMap([]), 4)).toEqual([]);
  });
});
