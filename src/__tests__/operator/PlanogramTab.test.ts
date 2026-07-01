import { describe, it, expect } from "vitest";
import { generatePlanogramGrid } from "@/lib/operator-detail";
import { buildInventoryItem } from "@/test/factories/operator";

// ---------------------------------------------------------------------------
// generatePlanogramGrid — produces a shelf grid from inventory items
// ---------------------------------------------------------------------------

describe("generatePlanogramGrid", () => {
  it("distributes items across shelves of the specified width", () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      buildInventoryItem({ id: `item-${i}` }),
    );
    const grid = generatePlanogramGrid(items, 3);

    // 5 items with width 3 = 2 shelves (3 + 2)
    expect(grid).toHaveLength(2);
    expect(grid[0]).toHaveLength(3);
    expect(grid[1]).toHaveLength(2);
  });

  it("creates a single shelf when items fit within width", () => {
    const items = [
      buildInventoryItem({ id: "item-0" }),
      buildInventoryItem({ id: "item-1" }),
    ];
    const grid = generatePlanogramGrid(items, 4);

    expect(grid).toHaveLength(1);
    expect(grid[0]).toHaveLength(2);
  });

  it("returns an empty grid for empty inventory", () => {
    const grid = generatePlanogramGrid([], 3);
    expect(grid).toHaveLength(0);
  });

  it("each slot contains the product name and stock info", () => {
    const item = buildInventoryItem({
      id: "item-test",
      productName: "Coca-Cola 355ml",
      currentStock: 8,
      capacity: 12,
    });
    const grid = generatePlanogramGrid([item], 4);
    const slot = grid[0][0];

    expect(slot.productName).toBe("Coca-Cola 355ml");
    expect(slot.currentStock).toBe(8);
    expect(slot.capacity).toBe(12);
  });

  it("generates a deterministic sensorMatch from the item id", () => {
    const item = buildInventoryItem({ id: "item-stable" });
    const gridA = generatePlanogramGrid([item], 4);
    const gridB = generatePlanogramGrid([item], 4);

    expect(gridA[0][0].sensorMatch).toBe(gridB[0][0].sensorMatch);
  });

  it("produces some mismatches in a large enough set", () => {
    const items = Array.from({ length: 20 }, (_, i) =>
      buildInventoryItem({ id: `item-${i}` }),
    );
    const grid = generatePlanogramGrid(items, 5);
    const allSlots = grid.flat();

    const matches = allSlots.filter((s) => s.sensorMatch).length;
    const mismatches = allSlots.filter((s) => !s.sensorMatch).length;

    // with 20 items and a hash-based approach, we expect at least 1 of each
    expect(matches).toBeGreaterThan(0);
    expect(mismatches).toBeGreaterThan(0);
  });

  it("uses the default shelf width of 4 when not specified", () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      buildInventoryItem({ id: `item-${i}` }),
    );
    const grid = generatePlanogramGrid(items);

    // 5 items with default width 4 = 2 shelves (4 + 1)
    expect(grid).toHaveLength(2);
    expect(grid[0]).toHaveLength(4);
    expect(grid[1]).toHaveLength(1);
  });

  it("includes the item category in each slot", () => {
    const item = buildInventoryItem({
      id: "item-cat",
      category: "beverages",
    });
    const grid = generatePlanogramGrid([item], 4);
    expect(grid[0][0].category).toBe("beverages");
  });
});
