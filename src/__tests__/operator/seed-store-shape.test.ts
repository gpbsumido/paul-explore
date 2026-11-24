import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type MockInstance,
} from "vitest";

import { REFUSED_CONNECTIONS } from "@/test/factories/fetchFailures";
import { getStores, openRestockSession, listPromotions } from "@/lib/operator-data";
import {
  applyRestock,
  openRestockSession as bffOpenSession,
} from "@/lib/operator-bff";

const GLOBAL_KEY = "__operatorDataStore";

/** Plants a cached seed store on globalThis, the way a hot reload leaves one. */
function plantStore(shape: Record<string, unknown>): void {
  (globalThis as unknown as Record<string, unknown>)[GLOBAL_KEY] = shape;
}

/** What is cached on globalThis right now. */
function cachedStore(): unknown {
  return (globalThis as unknown as Record<string, unknown>)[GLOBAL_KEY];
}

/** The old shape: every collection except the ones added later. */
function staleStoreWithoutRestock(): Record<string, unknown> {
  return {
    stores: [{ id: "store-001" }],
    inventoryByStore: new Map(),
    alertsByStore: new Map(),
    activityByStore: new Map(),
    salesByStore: new Map(),
    planogramByStore: new Map(),
    allAlerts: new Map(),
  };
}

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
    plantStore(staleStoreWithoutRestock());

    const session = openRestockSession("store-001");

    expect(session?.storeId).toBe("store-001");
    // the stale store only knew one store, the healed seed has the whole fleet
    expect(getStores().length).toBeGreaterThan(1);
  });

  it("re-initialises when the promotions collection is missing", () => {
    plantStore({
      ...staleStoreWithoutRestock(),
      restockSessions: new Map(),
      restockLines: new Map(),
    });

    expect(Array.isArray(listPromotions("store-001"))).toBe(true);
    expect(getStores().length).toBeGreaterThan(1);
  });

  it.each([
    "stores",
    "inventoryByStore",
    "alertsByStore",
    "activityByStore",
    "salesByStore",
    "planogramByStore",
    "allAlerts",
    "restockSessions",
    "restockLines",
    "promotions",
  ])("re-initialises when only %s is missing", (collection) => {
    getStores();
    const healthy = cachedStore() as Record<string, unknown>;
    const missingOne = { ...healthy };
    delete missingOne[collection];
    plantStore(missingOne);

    getStores();

    expect(cachedStore()).not.toBe(missingOne);
    expect((cachedStore() as Record<string, unknown>)[collection]).toBeDefined();
  });

  it("keeps a healthy store rather than reseeding on every read", () => {
    getStores();
    const store = cachedStore();
    getStores();

    // getStores maps to freshen last-ping, so the array is new each call by
    // design; what must not change is the underlying store.
    expect(cachedStore()).toBe(store);
  });
});

describe("the whole write path heals, not just the seed helper", () => {
  beforeEach(() => {
    delete (globalThis as unknown as Record<string, unknown>)[GLOBAL_KEY];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  /**
   * The BFF only reaches the seed when the API call fails, so each test takes
   * the API down first and checks the fallback notice was logged. Without that
   * the MSW handler answers and the stale seed is never touched.
   *
   * Down means refused. The BFF only falls back when the connection was never
   * made, and MSW's network error carries no cause to say so.
   */
  function takeApiDown(): MockInstance {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(REFUSED_CONNECTIONS[0].error));
    return vi.spyOn(console, "warn").mockImplementation(() => {});
  }

  /**
   * This is the path the failing button actually took: BFF route to
   * operator-bff to the seed, with the API unreachable. It returned a 500
   * because the cached store predated the restock collections.
   */
  it("opens a session through the BFF against a stale store", async () => {
    const warn = takeApiDown();
    plantStore(staleStoreWithoutRestock());

    const session = await bffOpenSession("store-001");

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("openRestockSession fell back to seed data"),
    );
    expect(session?.storeId).toBe("store-001");
  });

  it("restocks to capacity through the BFF against a stale store", async () => {
    const warn = takeApiDown();
    plantStore({ stores: [{ id: "store-001" }], allAlerts: new Map() });

    const result = await applyRestock("store-001", []);

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("applyRestock fell back to seed data"),
    );
    expect(result?.activity.type).toBe("restock");
    expect(result?.items).toEqual([]);
  });
});
