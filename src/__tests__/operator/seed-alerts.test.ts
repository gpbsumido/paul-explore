import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { getStores, getInventory, getAlerts } from "@/lib/operator-data";

const GLOBAL_KEY = "__operatorDataStore";

/**
 * Re-seeds the demo store with Math.random answering from a fixed function, so
 * the shelves (and so the alerts) are the same on every run instead of whatever
 * the dice gave this time.
 */
function seedWith(random: () => number): void {
  delete (globalThis as unknown as Record<string, unknown>)[GLOBAL_KEY];
  vi.spyOn(Math, "random").mockImplementation(random);
}

/** A small repeatable pseudo-random sequence (mulberry32). */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  delete (globalThis as unknown as Record<string, unknown>)[GLOBAL_KEY];
});

/**
 * An alert is a claim about a store. These pin that it can never contradict the
 * row it describes.
 *
 * The bug: the seed picked a random message from a fixed list, so
 * "Turkey Club Sandwich out of stock" appeared on stores with a full shelf of
 * them, and on stores that do not stock the product at all. The API's seed was
 * fixed for exactly this and the frontend's own seed was not -- which is the
 * copy that serves the demo whenever the backend is asleep, so it is the copy
 * most people actually see.
 */
describe("seeded alerts against the inventory they describe", () => {
  beforeEach(() => {
    seedWith(seededRandom(20260820));
  });

  it("only names products the store actually stocks", () => {
    for (const store of getStores()) {
      const stocked = new Set(
        (getInventory(store.id) ?? []).map((i) => i.productName),
      );
      for (const alert of getAlerts(store.id) ?? []) {
        if (alert.category !== "low-stock") continue;
        const named = [...stocked].some((name) =>
          alert.message.includes(name),
        );
        expect(
          named,
          `"${alert.message}" on ${store.name}, which stocks ${[...stocked].join(", ")}`,
        ).toBe(true);
      }
    }
  });

  it("never reports a product out of stock while it has stock", () => {
    for (const store of getStores()) {
      const inventory = getInventory(store.id) ?? [];
      for (const alert of getAlerts(store.id) ?? []) {
        if (!alert.message.includes("out of stock")) continue;
        const item = inventory.find((i) => alert.message.includes(i.productName));
        expect(item, `no such product for "${alert.message}"`).toBeDefined();
        expect(
          item!.currentStock,
          `${item!.productName} is reported out of stock but holds ${item!.currentStock}`,
        ).toBe(0);
      }
    }
  });

  it("only warns about temperature when the store is actually over threshold", () => {
    for (const store of getStores()) {
      for (const alert of getAlerts(store.id) ?? []) {
        if (alert.category !== "temperature-warning") continue;
        expect(
          store.temperature,
          `${store.name} warns about temperature while reading ${store.temperature}`,
        ).toBeGreaterThan(7);
      }
    }
  });

  it("still produces some alerts, so the tab is not empty", () => {
    const total = getStores().reduce(
      (n, s) => n + (getAlerts(s.id)?.length ?? 0),
      0,
    );
    expect(total).toBeGreaterThan(0);
  });

  it("raises the temperature warning for the store that is over threshold", () => {
    const warned = getStores().filter((store) =>
      (getAlerts(store.id) ?? []).some(
        (alert) => alert.category === "temperature-warning",
      ),
    );
    // exactly the degraded store, which the seed pins at 8.4 degrees
    expect(warned.map((store) => store.temperature)).toEqual([8.4]);
  });
});

describe("seeded alerts for known shelves", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("raises a critical out-of-stock alert for every empty slot", () => {
    seedWith(() => 0);
    for (const store of getStores()) {
      const outOfStock = (getAlerts(store.id) ?? []).filter(
        (alert) => alert.category === "low-stock",
      );
      const names = (getInventory(store.id) ?? []).map(
        (item) => item.productName,
      );
      expect(outOfStock.map((alert) => alert.message).sort()).toEqual(
        names.map((name) => `${name} out of stock`).sort(),
      );
      expect(outOfStock.every((alert) => alert.severity === "critical")).toBe(
        true,
      );
    }
  });

  it("raises a below-20% warning for a slot that is low but not empty", () => {
    seedWith(() => 0.1);
    for (const store of getStores()) {
      const lowStock = getAlerts(store.id)?.filter(
        (alert) => alert.category === "low-stock",
      );
      for (const item of getInventory(store.id) ?? []) {
        const alert = lowStock?.find((a) => a.message.includes(item.productName));
        if (item.currentStock === 0) {
          expect(alert).toMatchObject({
            severity: "critical",
            message: `${item.productName} out of stock`,
          });
        } else {
          expect(item.currentStock / item.capacity).toBeLessThan(0.2);
          expect(alert).toMatchObject({
            severity: "warning",
            message: `${item.productName} stock below 20%`,
          });
        }
      }
    }
  });

  it("raises no stock alert for slots at a quarter full or more", () => {
    seedWith(() => 0.3);
    for (const store of getStores()) {
      for (const item of getInventory(store.id) ?? []) {
        expect(item.currentStock / item.capacity).toBeGreaterThanOrEqual(0.2);
      }
      const categories = (getAlerts(store.id) ?? []).map((a) => a.category);
      expect(categories).not.toContain("low-stock");
    }
  });

  it("raises no stock alert for a full shelf", () => {
    seedWith(() => 0.999);
    for (const store of getStores()) {
      const categories = (getAlerts(store.id) ?? []).map((a) => a.category);
      expect(categories).not.toContain("low-stock");
    }
  });

  it("always adds the door-ajar info alert to a store", () => {
    seedWith(() => 0.999);
    for (const store of getStores()) {
      expect(getAlerts(store.id)).toContainEqual(
        expect.objectContaining({
          category: "door-ajar",
          severity: "info",
          message: "Door open for more than 60 seconds",
        }),
      );
    }
  });
});
