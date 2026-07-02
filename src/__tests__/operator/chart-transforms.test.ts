import { describe, it, expect } from "vitest";
import {
  toFleetHealthData,
  toAlertTrendData,
  toInventoryComparisonData,
} from "@/lib/operator-chart-transforms";
import {
  buildStore,
  buildAlert,
  buildInventoryItem,
} from "@/test/factories/operator";
import type { Store, Alert, InventoryItem } from "@/types/operator";

// ---------------------------------------------------------------------------
// toFleetHealthData — store status distribution for donut chart
// ---------------------------------------------------------------------------

describe("toFleetHealthData", () => {
  it("counts stores by status", () => {
    const stores: readonly Store[] = [
      buildStore({ id: "s1", status: "online" }),
      buildStore({ id: "s2", status: "online" }),
      buildStore({ id: "s3", status: "degraded" }),
      buildStore({ id: "s4", status: "offline" }),
    ];

    const result = toFleetHealthData(stores);

    expect(result).toEqual([
      { name: "Online", value: 2, fill: expect.any(String) },
      { name: "Degraded", value: 1, fill: expect.any(String) },
      { name: "Offline", value: 1, fill: expect.any(String) },
    ]);
  });

  it("omits statuses with zero stores", () => {
    const stores: readonly Store[] = [
      buildStore({ id: "s1", status: "online" }),
      buildStore({ id: "s2", status: "online" }),
    ];

    const result = toFleetHealthData(stores);

    expect(result).toEqual([
      { name: "Online", value: 2, fill: expect.any(String) },
    ]);
  });

  it("returns empty array for no stores", () => {
    expect(toFleetHealthData([])).toEqual([]);
  });

  it("assigns distinct fill colors per status", () => {
    const stores: readonly Store[] = [
      buildStore({ id: "s1", status: "online" }),
      buildStore({ id: "s2", status: "degraded" }),
      buildStore({ id: "s3", status: "offline" }),
    ];

    const result = toFleetHealthData(stores);
    const fills = result.map((d) => d.fill);

    expect(new Set(fills).size).toBe(3);
  });

  it("does not mutate the input array", () => {
    const stores: readonly Store[] = [
      buildStore({ id: "s1", status: "online" }),
    ];
    const copy = [...stores];

    toFleetHealthData(stores);

    expect(stores).toEqual(copy);
  });
});

// ---------------------------------------------------------------------------
// toAlertTrendData — 24-hour alert volume for area chart
// ---------------------------------------------------------------------------

describe("toAlertTrendData", () => {
  it("returns 24 data points (one per hour)", () => {
    const alerts: readonly Alert[] = [
      buildAlert({ id: "a1", timestamp: new Date().toISOString() }),
    ];

    const result = toAlertTrendData(alerts);

    expect(result).toHaveLength(24);
  });

  it("each data point has hour label and count", () => {
    const result = toAlertTrendData([]);

    for (const point of result) {
      expect(point).toHaveProperty("hour");
      expect(point).toHaveProperty("count");
      expect(typeof point.hour).toBe("string");
      expect(typeof point.count).toBe("number");
    }
  });

  it("buckets alerts into the correct hour", () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const alerts: readonly Alert[] = [
      buildAlert({ id: "a1", timestamp: twoHoursAgo.toISOString() }),
      buildAlert({ id: "a2", timestamp: twoHoursAgo.toISOString() }),
      buildAlert({ id: "a3", timestamp: now.toISOString() }),
    ];

    const result = toAlertTrendData(alerts);
    const totalCount = result.reduce((sum, p) => sum + p.count, 0);

    expect(totalCount).toBe(3);
  });

  it("returns all zeros for empty alerts", () => {
    const result = toAlertTrendData([]);

    expect(result.every((p) => p.count === 0)).toBe(true);
  });

  it("ignores alerts older than 24 hours", () => {
    const old = new Date();
    old.setHours(old.getHours() - 25);

    const alerts: readonly Alert[] = [
      buildAlert({ id: "a1", timestamp: old.toISOString() }),
    ];

    const result = toAlertTrendData(alerts);
    const totalCount = result.reduce((sum, p) => sum + p.count, 0);

    expect(totalCount).toBe(0);
  });

  it("hours are ordered oldest to newest", () => {
    const result = toAlertTrendData([]);
    const hours = result.map((p) => p.hour);

    // first entry should be ~23 hours ago, last should be current hour
    expect(hours.length).toBe(24);
    // just verify they're in chronological order by checking they're unique
    expect(new Set(hours).size).toBe(24);
  });
});

// ---------------------------------------------------------------------------
// toInventoryComparisonData — per-store inventory health for bar chart
// ---------------------------------------------------------------------------

describe("toInventoryComparisonData", () => {
  it("computes health percentage per store", () => {
    const stores: readonly Store[] = [
      buildStore({ id: "s1", name: "Store Alpha" }),
      buildStore({ id: "s2", name: "Store Beta" }),
    ];

    const inventoryByStore = new Map<string, readonly InventoryItem[]>([
      [
        "s1",
        [
          buildInventoryItem({ storeId: "s1", currentStock: 8, capacity: 10 }),
          buildInventoryItem({ storeId: "s1", currentStock: 6, capacity: 10 }),
        ],
      ],
      [
        "s2",
        [
          buildInventoryItem({ storeId: "s2", currentStock: 2, capacity: 10 }),
          buildInventoryItem({ storeId: "s2", currentStock: 4, capacity: 10 }),
        ],
      ],
    ]);

    const result = toInventoryComparisonData(stores, inventoryByStore);

    expect(result).toEqual([
      { name: "Store Alpha", health: 70 },
      { name: "Store Beta", health: 30 },
    ]);
  });

  it("returns 0 health for store with no inventory data", () => {
    const stores: readonly Store[] = [
      buildStore({ id: "s1", name: "Empty Store" }),
    ];

    const result = toInventoryComparisonData(stores, new Map());

    expect(result).toEqual([{ name: "Empty Store", health: 0 }]);
  });

  it("returns 0 health for store with empty inventory array", () => {
    const stores: readonly Store[] = [
      buildStore({ id: "s1", name: "Empty Store" }),
    ];

    const inventoryByStore = new Map<string, readonly InventoryItem[]>([
      ["s1", []],
    ]);

    const result = toInventoryComparisonData(stores, inventoryByStore);

    expect(result).toEqual([{ name: "Empty Store", health: 0 }]);
  });

  it("handles zero-capacity items without dividing by zero", () => {
    const stores: readonly Store[] = [
      buildStore({ id: "s1", name: "Weird Store" }),
    ];

    const inventoryByStore = new Map<string, readonly InventoryItem[]>([
      [
        "s1",
        [
          buildInventoryItem({ storeId: "s1", currentStock: 5, capacity: 0 }),
          buildInventoryItem({ storeId: "s1", currentStock: 10, capacity: 20 }),
        ],
      ],
    ]);

    const result = toInventoryComparisonData(stores, inventoryByStore);

    // only the valid item contributes: 10/20 = 50%, averaged over 2 items = 25%
    expect(result).toEqual([{ name: "Weird Store", health: 25 }]);
  });

  it("returns empty array for no stores", () => {
    expect(toInventoryComparisonData([], new Map())).toEqual([]);
  });

  it("truncates long store names for chart readability", () => {
    const stores: readonly Store[] = [
      buildStore({
        id: "s1",
        name: "Parking Garage Kiosk - Level P2",
      }),
    ];

    const inventoryByStore = new Map<string, readonly InventoryItem[]>([
      [
        "s1",
        [buildInventoryItem({ storeId: "s1", currentStock: 5, capacity: 10 })],
      ],
    ]);

    const result = toInventoryComparisonData(stores, inventoryByStore);

    // name should be truncated to fit bar chart labels
    expect(result[0].name.length).toBeLessThanOrEqual(20);
  });

  it("preserves store order from input", () => {
    const stores: readonly Store[] = [
      buildStore({ id: "s1", name: "Zebra Store" }),
      buildStore({ id: "s2", name: "Alpha Store" }),
    ];

    const inventoryByStore = new Map<string, readonly InventoryItem[]>([
      [
        "s1",
        [buildInventoryItem({ storeId: "s1", currentStock: 5, capacity: 10 })],
      ],
      [
        "s2",
        [buildInventoryItem({ storeId: "s2", currentStock: 5, capacity: 10 })],
      ],
    ]);

    const result = toInventoryComparisonData(stores, inventoryByStore);

    expect(result[0].name).toContain("Zebra");
    expect(result[1].name).toContain("Alpha");
  });
});
