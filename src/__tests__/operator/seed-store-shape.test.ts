import { describe, it, expect, beforeEach } from "vitest";

import { getStores, openRestockSession, listPromotions } from "@/lib/operator-data";
import {
  applyRestock,
  openRestockSession as bffOpenSession,
} from "@/lib/operator-bff";

const GLOBAL_KEY = "__operatorDataStore";

/**
 * The seed lives on globalThis so every route handler in one dev server shares
 * a copy. That also means it survives hot reloads and branch switches, so a
 * store created before a collection existed would keep coming back without it.
 * It surfaced as writes 500ing while reads worked fine, which is a confusing
 * way to find out your cache is a version behind.
 */
describe("the seed store heals a stale shape", () => {
  beforeEach(() => {
    delete (globalThis as unknown as Record<string, unknown>)[GLOBAL_KEY];
  });

  it("re-initialises when a collection added later is missing", () => {
    // What a hot reload leaves behind: the old shape, no restock collections.
    (globalThis as unknown as Record<string, unknown>)[GLOBAL_KEY] = {
      stores: [{ id: "store-001" }],
      inventoryByStore: new Map(),
      alertsByStore: new Map(),
      activityByStore: new Map(),
      salesByStore: new Map(),
      planogramByStore: new Map(),
      allAlerts: new Map(),
    };

    expect(() => openRestockSession("store-001")).not.toThrow();
    expect(getStores().length).toBeGreaterThan(0);
  });

  it("re-initialises when the promotions collection is missing", () => {
    (globalThis as unknown as Record<string, unknown>)[GLOBAL_KEY] = {
      stores: [{ id: "store-001" }],
      inventoryByStore: new Map(),
      alertsByStore: new Map(),
      activityByStore: new Map(),
      salesByStore: new Map(),
      planogramByStore: new Map(),
      allAlerts: new Map(),
      restockSessions: new Map(),
      restockLines: new Map(),
    };

    expect(() => listPromotions("store-001")).not.toThrow();
  });

  it("keeps a healthy store rather than reseeding on every read", () => {
    getStores();
    const store = (globalThis as unknown as Record<string, unknown>)[GLOBAL_KEY];
    getStores();

    // getStores maps to freshen last-ping, so the array is new each call by
    // design; what must not change is the underlying store.
    expect(
      (globalThis as unknown as Record<string, unknown>)[GLOBAL_KEY],
    ).toBe(store);
  });
});

describe("the whole write path heals, not just the seed helper", () => {
  beforeEach(() => {
    delete (globalThis as unknown as Record<string, unknown>)[GLOBAL_KEY];
  });

  /**
   * This is the path the failing button actually took: BFF route to
   * operator-bff to the seed, with the API unreachable. It returned a 500
   * because the cached store predated the restock collections.
   */
  it("opens a session through the BFF against a stale store", async () => {
    (globalThis as unknown as Record<string, unknown>)[GLOBAL_KEY] = {
      stores: [{ id: "store-001" }],
      inventoryByStore: new Map(),
      alertsByStore: new Map(),
      activityByStore: new Map(),
      salesByStore: new Map(),
      planogramByStore: new Map(),
      allAlerts: new Map(),
    };

    const stores = getStores();
    const session = await bffOpenSession(stores[0].id);
    expect(session?.storeId).toBe(stores[0].id);
  });

  it("restocks to capacity through the BFF against a stale store", async () => {
    (globalThis as unknown as Record<string, unknown>)[GLOBAL_KEY] = {
      stores: [{ id: "store-001" }],
      allAlerts: new Map(),
    };

    const stores = getStores();
    const result = await applyRestock(stores[0].id, []);
    expect(result).toBeDefined();
  });
});
