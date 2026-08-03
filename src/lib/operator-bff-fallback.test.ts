import { describe, it, expect, vi, beforeEach } from "vitest";

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
  OperatorApiError: class extends Error {},
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
}));

import * as api from "@/lib/operator-client";
import {
  applyRestockSession,
  createPromotion,
  loadPromotionPerformance,
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

async function firstStoreId(): Promise<string> {
  const stores = await loadStores();
  expect(stores.length).toBeGreaterThan(0);
  return stores[0].id;
}

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

  it("returns undefined for a session the seed has never heard of", async () => {
    expect(await loadRestockSession("session-nope")).toBeUndefined();
    expect(await applyRestockSession("session-nope", null)).toBeUndefined();
  });
});

describe("promotions with the API down", () => {
  it("schedules, lists and ends a promotion against the seed", async () => {
    const storeId = await firstStoreId();

    const created = await createPromotion(storeId, {
      productName: null,
      percent: 15,
      startsAt: "2026-07-01T00:00:00.000Z",
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
      startsAt: "2026-07-01T00:00:00.000Z",
      endsAt: "2026-07-11T00:00:00.000Z",
    });

    const performance = await loadPromotionPerformance(created!.id);
    expect(performance).toBeDefined();
    expect(performance?.window.units).toBeGreaterThanOrEqual(0);
    // The caveat travels with the numbers, same as it does from the API.
    expect(performance?.note).toMatch(/not a claim that the promotion caused/i);
  });

  it("returns undefined for an unknown promotion rather than inventing one", async () => {
    expect(await stopPromotion("promo-nope")).toBeUndefined();
    expect(await loadPromotionPerformance("promo-nope")).toBeUndefined();
  });
});

describe("reads with the API down", () => {
  it("still serves the fleet from the seed", async () => {
    const stores = await loadStores();
    expect(stores.length).toBeGreaterThan(0);
    expect(stores[0]).toHaveProperty("province");
  });
});
