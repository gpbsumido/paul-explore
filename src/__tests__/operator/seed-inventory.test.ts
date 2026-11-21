import { describe, it, expect } from "vitest";

import { buildInventoryList, resetFactoryCounter } from "@/test/factories/operator";

describe("buildInventoryList", () => {
  it("gives a store one slot per distinct product", () => {
    resetFactoryCounter();
    const items = buildInventoryList("store-001", 6);
    const names = items.map((i) => i.productName);

    // A shelf showing the same sandwich three times reads as a bug, and it made
    // the pricing table look broken.
    expect(new Set(names).size).toBe(names.length);
  });

  it("only repeats a product once it runs out of distinct ones", () => {
    resetFactoryCounter();
    const items = buildInventoryList("store-001", 40);
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.productName, (counts.get(item.productName) ?? 0) + 1);
    }

    const tallies = [...counts.values()];
    // Evenly spread rather than piling repeats onto one product.
    expect(Math.max(...tallies) - Math.min(...tallies)).toBeLessThanOrEqual(1);
  });

  it("keeps each item's price and capacity matched to its product", () => {
    resetFactoryCounter();
    const items = buildInventoryList("store-001", 4);

    expect(
      items.map((i) => [i.productName, i.price, i.capacity]),
    ).toEqual([
      ["Coca-Cola 355ml", 2.5, 12],
      ["Sparkling Water 500ml", 1.75, 15],
      ["Turkey Club Sandwich", 6.99, 8],
      ["Greek Yogurt Cup", 3.25, 10],
    ]);
  });

  it("never stocks a slot above its capacity", () => {
    resetFactoryCounter();
    for (const item of buildInventoryList("store-001", 24)) {
      expect(item.currentStock).toBeGreaterThanOrEqual(0);
      expect(item.currentStock).toBeLessThanOrEqual(item.capacity);
    }
  });

  it("puts every slot in the store it was built for", () => {
    resetFactoryCounter();
    const items = buildInventoryList("store-042", 3);
    expect(items.map((i) => i.storeId)).toEqual([
      "store-042",
      "store-042",
      "store-042",
    ]);
  });
});
