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

  it("colours online green, degraded amber and offline red", () => {
    const stores: readonly Store[] = [
      buildStore({ id: "s1", status: "online" }),
      buildStore({ id: "s2", status: "degraded" }),
      buildStore({ id: "s3", status: "offline" }),
    ];

    const result = toFleetHealthData(stores);

    expect(result.map((d) => d.fill)).toEqual([
      "var(--color-success-500)",
      "var(--color-warning-500)",
      "var(--color-error-500)",
    ]);
  });

  it("lists statuses in a fixed order whatever order the stores come in", () => {
    const stores: readonly Store[] = [
      buildStore({ id: "s1", status: "offline" }),
      buildStore({ id: "s2", status: "degraded" }),
      buildStore({ id: "s3", status: "online" }),
    ];

    expect(toFleetHealthData(stores).map((d) => d.name)).toEqual([
      "Online",
      "Degraded",
      "Offline",
    ]);
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
  // 2:30 pm local on a mid-summer day, built from local parts so the hour
  // boundaries sit where the function (which works in local time) puts them,
  // and well away from any daylight-saving change.
  const now = new Date(2026, 6, 15, 14, 30);

  /** An alert stamped at the given local time. */
  const alertAt = (when: Date): Alert =>
    buildAlert({ timestamp: when.toISOString() });

  /** The label the chart shows for the hour containing `when`. */
  const hourLabel = (when: Date): string =>
    when.toLocaleTimeString([], { hour: "numeric", hour12: true });

  const counts = (alerts: readonly Alert[]): number[] =>
    toAlertTrendData(alerts, now).map((point) => point.count);

  it("returns 24 data points (one per hour)", () => {
    expect(toAlertTrendData([], now)).toHaveLength(24);
  });

  it("labels the hours oldest to newest, ending on the current hour", () => {
    const expected = Array.from({ length: 24 }, (_, i) =>
      hourLabel(new Date(2026, 6, 15, 14 - 23 + i)),
    );
    expect(toAlertTrendData([], now).map((point) => point.hour)).toEqual(
      expected,
    );
  });

  it("returns all zeros for empty alerts", () => {
    expect(counts([])).toEqual(new Array(24).fill(0));
  });

  it("counts alerts from the current hour in the last bucket", () => {
    const result = counts([
      alertAt(new Date(2026, 6, 15, 14, 5)),
      alertAt(new Date(2026, 6, 15, 14, 55)),
    ]);
    expect(result.slice(0, 23)).toEqual(new Array(23).fill(0));
    expect(result[23]).toBe(2);
  });

  it("puts an alert stamped on the hour into that hour's bucket", () => {
    // 11:00 is three hours before the 2 pm bucket, so 23 - 3 = 20
    const result = counts([alertAt(new Date(2026, 6, 15, 11, 0))]);
    expect(result[20]).toBe(1);
    expect(result.reduce((sum, count) => sum + count, 0)).toBe(1);
  });

  it("keeps an alert from the first hour of the window", () => {
    // 3 pm yesterday is the oldest bucket
    const result = counts([alertAt(new Date(2026, 6, 14, 15, 0))]);
    expect(result[0]).toBe(1);
  });

  it("drops an alert from the hour before the window starts", () => {
    const result = counts([alertAt(new Date(2026, 6, 14, 14, 0))]);
    expect(result.every((count) => count === 0)).toBe(true);
  });

  it("ignores alerts older than 24 hours", () => {
    const result = counts([alertAt(new Date(2026, 6, 14, 12, 0))]);
    expect(result.every((count) => count === 0)).toBe(true);
  });

  it("puts an alert from mid-hour into the bucket for that hour", () => {
    const result = counts([alertAt(new Date(2026, 6, 15, 11, 30))]);
    expect(result[20]).toBe(1);
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

    // 19 characters of the name, then an ellipsis, so it is 20 wide
    expect(result[0].name).toBe("Parking Garage Kios…");
  });

  it("leaves a name of exactly 20 characters alone", () => {
    const name = "Twenty Characters Ok";
    expect(name).toHaveLength(20);
    const result = toInventoryComparisonData(
      [buildStore({ id: "s1", name })],
      new Map(),
    );
    expect(result[0].name).toBe(name);
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
