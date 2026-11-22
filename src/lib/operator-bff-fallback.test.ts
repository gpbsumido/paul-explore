import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * The BFF prefers the live API and falls back to the in-memory seed when it is
 * unreachable, so the demo behaves the same whether or not portfolio_api is up.
 *
 * That fallback has been load-bearing since the dashboard got a backend, and
 * I planned a test for it in three separate plans without writing one. These
 * are it. Each drives a whole feature through the fallback rather than asserting
 * the try/catch exists, because the thing worth pinning is that the seed can
 * actually satisfy the same contract the API does.
 */
vi.mock("@/lib/operator-client", () => ({
  OperatorApiError: class OperatorApiError extends Error {
    constructor(readonly status: number) {
      super(`operator API responded ${status}`);
      this.name = "OperatorApiError";
    }
  },
  OperatorContractError: class OperatorContractError extends Error {},
  fetchStores: vi.fn(),
  fetchStore: vi.fn(),
  fetchInventory: vi.fn(),
  fetchAlerts: vi.fn(),
  fetchActivity: vi.fn(),
  fetchSales: vi.fn(),
  fetchPlanogram: vi.fn(),
  fetchFleetSummary: vi.fn(),
  fetchSalesAnalytics: vi.fn(),
  postRestock: vi.fn(),
  patchDismiss: vi.fn(),
  patchPlanogram: vi.fn(),
  postRestockSession: vi.fn(),
  fetchRestockSessions: vi.fn(),
  fetchRestockSession: vi.fn(),
  putRestockLine: vi.fn(),
  postCompleteRestock: vi.fn(),
  fetchPromotions: vi.fn(),
  postPromotion: vi.fn(),
  patchEndPromotion: vi.fn(),
  fetchPromotionPerformance: vi.fn(),
  fetchPlannerBenchmarks: vi.fn(),
  fetchProductPerformance: vi.fn(),
  fetchShrinkSummary: vi.fn(),
  fetchSearchIndex: vi.fn(),
  fetchFinance: vi.fn(),
}));

import * as api from "@/lib/operator-client";
import * as seed from "@/lib/operator-data";
import { buildAlert, buildInventoryItem, buildStore } from "@/test/factories/operator";
import type { Alert, InventoryItem } from "@/types/operator";
import { FEE_MODEL } from "@/lib/operator-finance";
import { forgiveUnexpectedOutput } from "@/test/unexpectedOutput";
import {
  applyPlanogramUpdate,
  applyRestockSession,
  createPromotion,
  loadAlerts,
  loadFinance,
  loadFleetShrink,
  loadFleetSummary,
  loadInventory,
  loadPlanogram,
  loadPlannerBenchmarks,
  loadProductPerformance,
  loadPromotionPerformance,
  loadSales,
  loadSearchIndex,
  loadPromotions,
  loadRestockSession,
  loadStores,
  openRestockSession,
  saveRestockLine,
  stopPromotion,
} from "@/lib/operator-bff";

const DOWN = () => Promise.reject(new Error("portfolio_api unreachable"));

beforeEach(() => {
  vi.clearAllMocks();
  // Every call in this file runs with the backend down.
  for (const fn of Object.values(api)) {
    if (typeof fn === "function" && "mockImplementation" in fn) {
      (fn as unknown as { mockImplementation: (f: unknown) => void })
        .mockImplementation(DOWN);
    }
  }
});

afterEach(() => vi.restoreAllMocks());

// Every call in this file runs with the backend down, so nearly every test makes
// the BFF announce that it fell back to the seed. That announcement is the
// behaviour, and it is pinned by the test below; here it is allowed, and
// anything else the BFF logs still fails the test that caused it.
afterEach(() => {
  const announcedFallback = /^\[operator\] \w+ fell back to seed data: /;
  const somethingElse = forgiveUnexpectedOutput().filter(
    (line) => !announcedFallback.test(line),
  );
  expect(somethingElse).toEqual([]);
});

async function firstStoreId(): Promise<string> {
  const stores = await loadStores();
  expect(stores.length).toBeGreaterThan(0);
  return stores[0].id;
}

describe("a fallback says it happened", () => {
  it("names the call that fell back and why, so the page is not mistaken for live data", async () => {
    await loadStores();

    expect(forgiveUnexpectedOutput()).toEqual([
      "[operator] loadStores fell back to seed data: portfolio_api unreachable. The page will render, but it is not showing what the API holds.",
    ]);
  });
});

describe("restock sessions with the API down", () => {
  it("runs a whole session end to end against the seed", async () => {
    const storeId = await firstStoreId();

    const session = await openRestockSession(storeId);
    expect(session?.completedAt).toBeNull();

    const line = await saveRestockLine(session!.id, "item-1", {
      expectedQty: 8,
      countedQty: 5,
      added: 4,
      removed: 2,
      removalReason: "expired",
    });
    // The seed derives the same count status the API would.
    expect(line).toMatchObject({ countedQty: 5, countStatus: "correction" });

    const detail = await loadRestockSession(session!.id);
    expect(detail?.lines).toHaveLength(1);
  });

  it("applies the session to inventory and closes it", async () => {
    const storeId = await firstStoreId();
    const session = await openRestockSession(storeId);

    const applied = await applyRestockSession(session!.id, "walked the shelf");
    expect(applied?.session.completedAt).not.toBeNull();
    expect(applied?.session.notes).toBe("walked the shelf");
    expect(applied?.activity.type).toBe("restock");
  });

  it("returns undefined when completing a session the seed has never heard of", async () => {
    expect(await applyRestockSession("session-nope", null)).toBeUndefined();
  });
});

/**
 * A real restock session lives in the API, so the seed can't know about it.
 * Reading one used to fall back to the seed on any failure, find nothing, and
 * report the session as gone, and the resume hook then forgot it. Only the API
 * saying 404 means gone; anything else is "couldn't check".
 */
describe("reading a session the seed can't answer for", () => {
  it("rejects when the API is down rather than calling the session gone", async () => {
    await expect(loadRestockSession("session-from-api")).rejects.toThrow(
      /unreachable/,
    );
  });

  it("rejects when the API errors", async () => {
    vi.mocked(api.fetchRestockSession).mockRejectedValue(
      new api.OperatorApiError(500),
    );

    await expect(loadRestockSession("session-from-api")).rejects.toMatchObject({
      status: 500,
    });
  });

  it("is undefined when the API says the session doesn't exist", async () => {
    vi.mocked(api.fetchRestockSession).mockRejectedValue(
      new api.OperatorApiError(404),
    );

    expect(await loadRestockSession("session-from-api")).toBeUndefined();
  });

  it("rejects for a promotion the seed doesn't hold", async () => {
    await expect(loadPromotionPerformance("promo-from-api")).rejects.toThrow(
      /unreachable/,
    );
  });

  it("is undefined when the API says the promotion doesn't exist", async () => {
    vi.mocked(api.fetchPromotionPerformance).mockRejectedValue(
      new api.OperatorApiError(404),
    );

    expect(await loadPromotionPerformance("promo-from-api")).toBeUndefined();
  });
});

describe("promotions with the API down", () => {
  it("schedules, lists and ends a promotion against the seed", async () => {
    const storeId = await firstStoreId();

    const created = await createPromotion(storeId, {
      productName: null,
      percent: 15,
      startsAt: "2026-06-01T00:00:00.000Z",
      endsAt: null,
    });
    expect(created).toMatchObject({ percent: 15, status: "active" });

    const listed = await loadPromotions(storeId);
    expect(listed.map((p) => p.id)).toContain(created!.id);

    const ended = await stopPromotion(created!.id);
    expect(ended?.status).toBe("ended");
  });

  it("measures a promotion from the seed's own sales", async () => {
    const storeId = await firstStoreId();
    const created = await createPromotion(storeId, {
      productName: null,
      percent: 20,
      startsAt: "2026-06-01T00:00:00.000Z",
      endsAt: "2026-06-11T00:00:00.000Z",
    });

    const performance = await loadPromotionPerformance(created!.id);
    expect(performance).toBeDefined();
    expect(performance?.window.units).toBeGreaterThanOrEqual(0);
    // The caveat travels with the numbers, same as it does from the API.
    expect(performance?.note).toMatch(/not a claim that the promotion caused/i);
  });

  it("returns undefined when ending an unknown promotion rather than inventing one", async () => {
    expect(await stopPromotion("promo-nope")).toBeUndefined();
  });
});

describe("reads with the API down", () => {
  it("still serves the fleet from the seed", async () => {
    const stores = await loadStores();
    expect(stores.length).toBeGreaterThan(0);
    expect(stores[0]).toHaveProperty("province");
  });
});

/**
 * The seed's own stock levels are random, so a summary test against it can't
 * hit a boundary or be sure a severity is present. These pin a tiny fleet
 * instead and ask the fallback to summarise exactly that.
 */
describe("the fleet summary with the API down", () => {
  const fleet = [buildStore({ id: "store-a" }), buildStore({ id: "store-b" })];

  function seedHolds(
    alertsByStore: Record<string, Alert[]>,
    inventoryByStore: Record<string, InventoryItem[]>,
  ) {
    vi.spyOn(seed, "getStores").mockReturnValue(fleet);
    vi.spyOn(seed, "getAlerts").mockImplementation((id) => alertsByStore[id]);
    vi.spyOn(seed, "getInventory").mockImplementation((id) => inventoryByStore[id]);
  }

  it("counts only the alerts nobody has dismissed, split by severity", async () => {
    seedHolds(
      {
        "store-a": [
          buildAlert({ storeId: "store-a", severity: "critical" }),
          buildAlert({ storeId: "store-a", severity: "critical", acknowledged: true }),
          buildAlert({ storeId: "store-a", severity: "info" }),
        ],
        "store-b": [
          buildAlert({ storeId: "store-b", severity: "warning" }),
          buildAlert({ storeId: "store-b", severity: "warning" }),
        ],
      },
      {},
    );

    const { summaries, fleetStats } = await loadFleetSummary();

    expect(fleetStats).toMatchObject({ criticalAlerts: 1, warningAlerts: 2 });
    expect(summaries).toMatchObject([
      { storeId: "store-a", alertCount: 2, hasCritical: true, hasWarning: false },
      { storeId: "store-b", alertCount: 2, hasCritical: false, hasWarning: true },
    ]);
  });

  it("ignores a critical alert once it is dismissed", async () => {
    seedHolds(
      {
        "store-a": [buildAlert({ storeId: "store-a", severity: "critical", acknowledged: true })],
        "store-b": [],
      },
      {},
    );

    const { summaries, fleetStats } = await loadFleetSummary();

    expect(fleetStats.criticalAlerts).toBe(0);
    expect(summaries[0]).toMatchObject({ alertCount: 0, hasCritical: false });
  });

  it("calls an item low stock only when it is under 20% full, and averages the fill", async () => {
    seedHolds(
      { "store-a": [], "store-b": [] },
      {
        "store-a": [
          buildInventoryItem({ storeId: "store-a", currentStock: 1, capacity: 10 }),
          buildInventoryItem({ storeId: "store-a", currentStock: 2, capacity: 10 }),
        ],
        "store-b": [buildInventoryItem({ storeId: "store-b", currentStock: 10, capacity: 10 })],
      },
    );

    const { summaries, fleetStats } = await loadFleetSummary();

    expect(fleetStats.lowStockItems).toBe(1);
    expect(summaries.map((row) => row.inventoryHealth)).toEqual([15, 100]);
    expect(fleetStats.avgInventoryHealth).toBe(Math.round(((0.1 + 0.2 + 1) / 3) * 100));
  });
});

describe("a store the seed never invented, with the API down", () => {
  it.each([
    ["inventory", () => loadInventory("a-real-uuid")],
    ["alerts", () => loadAlerts("a-real-uuid")],
    ["sales", () => loadSales("a-real-uuid")],
    ["the planogram", () => loadPlanogram("a-real-uuid")],
  ])("refuses to answer %s with an empty list", async (_what, read) => {
    await expect(read()).rejects.toMatchObject({ name: "OperatorUnavailableError" });
  });

  it("serves a seeded store's own inventory", async () => {
    const storeId = await firstStoreId();

    expect(await loadInventory(storeId)).toEqual(seed.getInventory(storeId));
  });
});

describe("planogram writes with the API down", () => {
  it("stores the boxes the client sent", async () => {
    const storeId = await firstStoreId();
    const [first, ...rest] = await loadPlanogram(storeId);
    const flipped = [{ ...first, sensorMatch: !first.sensorMatch }, ...rest];

    const saved = await applyPlanogramUpdate(storeId, { boxes: flipped });

    expect(saved?.[0].sensorMatch).toBe(!first.sensorMatch);
    expect((await loadPlanogram(storeId))[0].sensorMatch).toBe(!first.sensorMatch);
  });

  it("clears a slot's sensor mismatch on resync", async () => {
    const storeId = await firstStoreId();
    const mismatched = (await loadPlanogram(storeId)).find(
      (slot) => !slot.sensorMatch && slot.itemId !== null,
    );
    if (!mismatched?.itemId) throw new Error("the seed should hold a mismatched slot");
    const { itemId } = mismatched;

    const saved = await applyPlanogramUpdate(storeId, { resyncItemId: itemId });

    expect(saved?.find((slot) => slot.itemId === itemId)?.sensorMatch).toBe(true);
  });
});

describe("fleet rollups with the API down", () => {
  it("lists every store and each product name once in the search index", async () => {
    const index = await loadSearchIndex();

    const names = index.products.map((product) => product.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names.length).toBeGreaterThan(0);
    expect(index.stores.map((store) => store.id)).toEqual(
      seed.getStores().map((store) => store.id),
    );
  });

  it("leaves a restock session nobody has finished out of the shrink figures", async () => {
    const storeId = await firstStoreId();
    const before = await loadFleetShrink();
    const session = await openRestockSession(storeId);
    const [item] = seed.getInventory(storeId) ?? [];
    await saveRestockLine(session!.id, item.id, {
      expectedQty: 10,
      countedQty: 0,
      added: 0,
      removed: 0,
      removalReason: null,
    });

    const whileOpen = await loadFleetShrink();
    expect(whileOpen).toEqual(before);

    await applyRestockSession(session!.id, null);
    const afterClosing = await loadFleetShrink();
    expect(afterClosing.totals.unexplainedUnits).toBe(before.totals.unexplainedUnits + 10);
  });

  it("reports the fee model alongside the weekly payouts", async () => {
    const finance = await loadFinance();

    expect(finance.fees).toEqual(FEE_MODEL);
    expect(finance.weeks.length).toBeGreaterThan(0);
  });

  it("builds fleet benchmarks and product performance from the seed's sales", async () => {
    const benchmarks = await loadPlannerBenchmarks();
    const week = await loadProductPerformance("7d");
    const quarter = await loadProductPerformance("90d");

    expect(benchmarks).not.toBeNull();
    const units = (rows: typeof week) => rows.reduce((total, row) => total + row.unitsSold, 0);
    expect(units(quarter)).toBeGreaterThan(units(week));
  });
});

describe("a rejected write is a misconfiguration, not an outage", () => {
  /**
   * The whole point of the seed fallback is surviving the backend being asleep.
   * A 401 is not that: it means the service token is missing or mismatched, and
   * falling back would make the write look like it worked while persisting
   * nothing. That is the exact thing this dashboard exists to not do.
   */
  it("refuses to fall back when the API rejects the token", async () => {
    const storeId = await firstStoreId();
    vi.mocked(api.postRestockSession).mockRejectedValue(
      new api.OperatorApiError(401),
    );

    await expect(openRestockSession(storeId)).rejects.toMatchObject({
      status: 401,
    });
    const tokenWarnings = forgiveUnexpectedOutput().filter((line) =>
      line.includes("OPERATOR_SERVICE_TOKEN"),
    );
    expect(tokenWarnings).toHaveLength(1);
  });

  it("says what to check rather than failing silently", async () => {
    const storeId = await firstStoreId();
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(api.postPromotion).mockRejectedValue(
      new api.OperatorApiError(403),
    );

    await expect(
      createPromotion(storeId, {
        productName: null,
        percent: 10,
        startsAt: "2026-06-01T00:00:00.000Z",
        endsAt: null,
      }),
    ).rejects.toBeDefined();

    expect(logged.mock.calls[0][0]).toMatch(/OPERATOR_SERVICE_TOKEN/);
    logged.mockRestore();
  });

  it("still falls back when the API is genuinely unreachable", async () => {
    const storeId = await firstStoreId();
    vi.mocked(api.postRestockSession).mockRejectedValue(
      new Error("ECONNREFUSED"),
    );

    const session = await openRestockSession(storeId);
    expect(session?.storeId).toBe(storeId);
  });
});

describe("a token mismatch is reported, not disguised", () => {
  it("treats a 403 the same as a 401", async () => {
    const storeId = await firstStoreId();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(api.postRestockSession).mockRejectedValue(
      new api.OperatorApiError(403),
    );

    await expect(openRestockSession(storeId)).rejects.toMatchObject({
      name: "OperatorServiceTokenError",
      status: 403,
    });
  });

  it("throws a typed error naming the variable to fix", async () => {
    const storeId = await firstStoreId();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(api.postRestockSession).mockRejectedValue(
      new api.OperatorApiError(401),
    );

    await expect(openRestockSession(storeId)).rejects.toMatchObject({
      name: "OperatorServiceTokenError",
      message: expect.stringContaining("OPERATOR_SERVICE_TOKEN"),
    });
  });
});
