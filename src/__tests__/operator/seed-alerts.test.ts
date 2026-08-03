import { describe, it, expect } from "vitest";
import { getStores, getInventory, getAlerts } from "@/lib/operator-data";

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
});
