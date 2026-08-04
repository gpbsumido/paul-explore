import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  storeSchema,
  inventoryItemSchema,
  alertSchema,
  activityEventSchema,
  saleSchema,
  planogramSlotSchema,
  fleetSummaryResponseSchema,
  fleetSalesAnalyticsSchema,
} from "@/lib/operator-schemas";
import { plannerBenchmarksResponseSchema } from "@/lib/operator-planner";
import { productPerformanceResponseSchema } from "@/lib/operator-product-performance";
import { fleetShrinkResponseSchema } from "@/lib/operator-shrink";
import { z } from "zod";

function makeRequest(
  path: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, init);
}

function makeParams<T extends Record<string, string>>(
  values: T,
): { params: Promise<T> } {
  return { params: Promise.resolve(values) };
}

// ---------------------------------------------------------------------------
// GET /api/operator/stores
// ---------------------------------------------------------------------------

/**
 * These tests exist to check what the routes return when the API answers, so a
 * run that quietly used the seed instead proves nothing.
 *
 * That is not hypothetical. The MSW handlers were registered on bare paths,
 * which resolve against the jsdom origin on port 3000 while the BFF calls the
 * API on 3001, so none of them matched. onUnhandledRequest is set to "error"
 * and MSW did refuse the request -- but the BFF catches a failed call and falls
 * back to seeded data by design, so it swallowed the refusal, returned a
 * plausible answer, and every test here passed while validating the seed. It
 * showed up as 40 warnings in a green CI log.
 */
let seedFallbackExpected = false;

/**
 * Call from a test that is deliberately about the fallback -- one that makes
 * the API fail on purpose and asserts the route degrades well.
 */
function expectSeedFallback(): void {
  seedFallbackExpected = true;
}

beforeEach(() => {
  seedFallbackExpected = false;
  vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
    const line = args.map(String).join(" ");
    if (line.includes("fell back to seed data") && !seedFallbackExpected) {
      throw new Error(
        `Fell back to the seed during a route test, so this asserted nothing about the API: ${line}`,
      );
    }
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});


describe("GET /api/operator/stores", () => {
  it("returns a list of stores that pass schema validation", async () => {
    const { GET } = await import("@/app/api/operator/stores/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.stores)).toBe(true);
    expect(body.stores.length).toBeGreaterThan(0);
    const result = z.array(storeSchema).safeParse(body.stores);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// GET /api/operator/stores/:storeId
// ---------------------------------------------------------------------------

describe("GET /api/operator/stores/:storeId", () => {
  it("returns a single store by id", async () => {
    const { GET: listGET } = await import("@/app/api/operator/stores/route");
    const listRes = await listGET();
    const { stores } = await listRes.json();
    const firstId = stores[0].id;

    const { GET } = await import("@/app/api/operator/stores/[storeId]/route");
    const res = await GET(
      makeRequest(`/api/operator/stores/${firstId}`),
      makeParams({ storeId: firstId }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.store.id).toBe(firstId);
    expect(() => storeSchema.parse(body.store)).not.toThrow();
  });

  it("returns 404 for unknown store id", async () => {
    expectSeedFallback();
    const { GET } = await import("@/app/api/operator/stores/[storeId]/route");
    const res = await GET(
      makeRequest("/api/operator/stores/nonexistent-999"),
      makeParams({ storeId: "nonexistent-999" }),
    );
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GET /api/operator/stores/:storeId/inventory
// ---------------------------------------------------------------------------

describe("GET /api/operator/stores/:storeId/inventory", () => {
  it("returns inventory items linked to the store", async () => {
    const { GET: listGET } = await import("@/app/api/operator/stores/route");
    const listRes = await listGET();
    const { stores } = await listRes.json();
    const firstId = stores[0].id;

    const { GET } =
      await import("@/app/api/operator/stores/[storeId]/inventory/route");
    const res = await GET(
      makeRequest(`/api/operator/stores/${firstId}/inventory`),
      makeParams({ storeId: firstId }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    const result = z.array(inventoryItemSchema).safeParse(body.items);
    expect(result.success).toBe(true);
    for (const item of body.items) {
      expect(item.storeId).toBe(firstId);
    }
  });

  it("says it could not load rather than claiming the store is empty", async () => {
    expectSeedFallback();
    const { GET } =
      await import("@/app/api/operator/stores/[storeId]/inventory/route");
    const res = await GET(
      makeRequest("/api/operator/stores/nonexistent-999/inventory"),
      makeParams({ storeId: "nonexistent-999" }),
    );
    // Changed contract, on purpose. This used to answer 200 with an empty list,
    // which is a claim that the store has no inventory. When the API is
    // unreachable and the seed has never heard of this store, the honest answer
    // is that we do not know: an empty tab looked identical to a real outage.
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/could not load/i);
  });
});

// ---------------------------------------------------------------------------
// GET /api/operator/stores/:storeId/alerts
// ---------------------------------------------------------------------------

describe("GET /api/operator/stores/:storeId/alerts", () => {
  it("returns alerts linked to the store", async () => {
    const { GET: listGET } = await import("@/app/api/operator/stores/route");
    const listRes = await listGET();
    const { stores } = await listRes.json();
    const firstId = stores[0].id;

    const { GET } =
      await import("@/app/api/operator/stores/[storeId]/alerts/route");
    const res = await GET(
      makeRequest(`/api/operator/stores/${firstId}/alerts`),
      makeParams({ storeId: firstId }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.alerts)).toBe(true);
    const result = z.array(alertSchema).safeParse(body.alerts);
    expect(result.success).toBe(true);
    for (const alert of body.alerts) {
      expect(alert.storeId).toBe(firstId);
    }
  });

  it("says it could not load rather than claiming the store is empty", async () => {
    expectSeedFallback();
    const { GET } =
      await import("@/app/api/operator/stores/[storeId]/alerts/route");
    const res = await GET(
      makeRequest("/api/operator/stores/nonexistent-999/alerts"),
      makeParams({ storeId: "nonexistent-999" }),
    );
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/could not load/i);
  });
});

// ---------------------------------------------------------------------------
// GET /api/operator/stores/:storeId/sales
// ---------------------------------------------------------------------------

describe("GET /api/operator/stores/:storeId/sales", () => {
  it("returns sales linked to the store", async () => {
    const { GET: listGET } = await import("@/app/api/operator/stores/route");
    const listRes = await listGET();
    const { stores } = await listRes.json();
    const firstId = stores[0].id;

    const { GET } =
      await import("@/app/api/operator/stores/[storeId]/sales/route");
    const res = await GET(
      makeRequest(`/api/operator/stores/${firstId}/sales`),
      makeParams({ storeId: firstId }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.sales)).toBe(true);
    expect(body.sales.length).toBeGreaterThan(0);
    const result = z.array(saleSchema).safeParse(body.sales);
    expect(result.success).toBe(true);
    for (const sale of body.sales) {
      expect(sale.storeId).toBe(firstId);
    }
  });

  it("says it could not load rather than claiming the store is empty", async () => {
    expectSeedFallback();
    const { GET } =
      await import("@/app/api/operator/stores/[storeId]/sales/route");
    const res = await GET(
      makeRequest("/api/operator/stores/nonexistent-999/sales"),
      makeParams({ storeId: "nonexistent-999" }),
    );
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/could not load/i);
  });
});

// ---------------------------------------------------------------------------
// GET /api/operator/sales-analytics
// ---------------------------------------------------------------------------

describe("GET /api/operator/sales-analytics", () => {
  it("returns a valid fleet analytics payload defaulting to month", async () => {
    const { GET } = await import("@/app/api/operator/sales-analytics/route");
    const res = await GET(makeRequest("/api/operator/sales-analytics"));
    expect(res.status).toBe(200);
    const body = await res.json();
    const parsed = fleetSalesAnalyticsSchema.safeParse(body);
    expect(parsed.success).toBe(true);
    expect(body.granularity).toBe("month");
    expect(body.buckets).toHaveLength(12);
    expect(body.byStore.length).toBeGreaterThan(0);
  });

  it("honours the granularity query param", async () => {
    const { GET } = await import("@/app/api/operator/sales-analytics/route");
    const res = await GET(
      makeRequest("/api/operator/sales-analytics?granularity=year"),
    );
    const body = await res.json();
    expect(body.granularity).toBe("year");
    expect(body.buckets).toHaveLength(5);
  });

  it("falls back to month for an invalid granularity", async () => {
    const { GET } = await import("@/app/api/operator/sales-analytics/route");
    const res = await GET(
      makeRequest("/api/operator/sales-analytics?granularity=decade"),
    );
    const body = await res.json();
    expect(body.granularity).toBe("month");
  });
});

// ---------------------------------------------------------------------------
// GET + PATCH /api/operator/stores/:storeId/planogram
// ---------------------------------------------------------------------------

describe("GET /api/operator/stores/:storeId/planogram", () => {
  it("returns the store's planogram slots", async () => {
    const { GET: listGET } = await import("@/app/api/operator/stores/route");
    const { stores } = await (await listGET()).json();
    const firstId = stores[0].id;

    const { GET } =
      await import("@/app/api/operator/stores/[storeId]/planogram/route");
    const res = await GET(
      makeRequest(`/api/operator/stores/${firstId}/planogram`),
      makeParams({ storeId: firstId }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    const result = z.array(planogramSlotSchema).safeParse(body.slots);
    expect(result.success).toBe(true);
    expect(body.slots.length).toBeGreaterThan(0);
  });

  it("says it could not load rather than claiming the store is empty", async () => {
    expectSeedFallback();
    const { GET } =
      await import("@/app/api/operator/stores/[storeId]/planogram/route");
    const res = await GET(
      makeRequest("/api/operator/stores/nope-999/planogram"),
      makeParams({ storeId: "nope-999" }),
    );
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/could not load/i);
  });
});

describe("PATCH /api/operator/stores/:storeId/planogram", () => {
  it("stores a new box arrangement", async () => {
    const { GET: listGET } = await import("@/app/api/operator/stores/route");
    const { stores } = await (await listGET()).json();
    const firstId = stores[0].id;

    const routeMod =
      await import("@/app/api/operator/stores/[storeId]/planogram/route");
    const current = await (
      await routeMod.GET(
        makeRequest(`/api/operator/stores/${firstId}/planogram`),
        makeParams({ storeId: firstId }),
      )
    ).json();

    const reversed = [...current.slots].reverse();

    const res = await routeMod.PATCH(
      makeRequest(`/api/operator/stores/${firstId}/planogram`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxes: reversed }),
      }),
      makeParams({ storeId: firstId }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slots).toEqual(reversed);
    // includes at least one empty box from the padded shelves
    expect(
      body.slots.some((s: { itemId: string | null }) => s.itemId === null),
    ).toBe(true);
  });

  it("re-syncs a slot's sensor when given a resyncItemId", async () => {
    const { GET: listGET } = await import("@/app/api/operator/stores/route");
    const { stores } = await (await listGET()).json();
    const firstId = stores[0].id;

    const routeMod =
      await import("@/app/api/operator/stores/[storeId]/planogram/route");
    const current = await (
      await routeMod.GET(
        makeRequest(`/api/operator/stores/${firstId}/planogram`),
        makeParams({ storeId: firstId }),
      )
    ).json();

    const mismatched = current.slots.find(
      (s: { sensorMatch: boolean }) => !s.sensorMatch,
    );
    expect(mismatched).toBeDefined();

    const res = await routeMod.PATCH(
      makeRequest(`/api/operator/stores/${firstId}/planogram`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resyncItemId: mismatched.itemId }),
      }),
      makeParams({ storeId: firstId }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    const updated = body.slots.find(
      (s: { itemId: string }) => s.itemId === mismatched.itemId,
    );
    expect(updated.sensorMatch).toBe(true);
  });

  it("returns 404 for unknown store id", async () => {
    expectSeedFallback();
    const { PATCH } =
      await import("@/app/api/operator/stores/[storeId]/planogram/route");
    const res = await PATCH(
      makeRequest("/api/operator/stores/nope-999/planogram", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resyncItemId: "x" }),
      }),
      makeParams({ storeId: "nope-999" }),
    );
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/operator/alerts/:alertId/dismiss
// ---------------------------------------------------------------------------

describe("PATCH /api/operator/alerts/:alertId/dismiss", () => {
  it("dismisses an alert and returns it acknowledged", async () => {
    const { GET: listGET } = await import("@/app/api/operator/stores/route");
    const listRes = await listGET();
    const { stores } = await listRes.json();
    const firstId = stores[0].id;

    const { GET: alertsGET } =
      await import("@/app/api/operator/stores/[storeId]/alerts/route");
    const alertsRes = await alertsGET(
      makeRequest(`/api/operator/stores/${firstId}/alerts`),
      makeParams({ storeId: firstId }),
    );
    const { alerts } = await alertsRes.json();
    const target = alerts[0];

    const { PATCH } =
      await import("@/app/api/operator/alerts/[alertId]/dismiss/route");
    const res = await PATCH(
      makeRequest(`/api/operator/alerts/${target.id}/dismiss`, {
        method: "PATCH",
      }),
      makeParams({ alertId: target.id }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alert.id).toBe(target.id);
    expect(body.alert.acknowledged).toBe(true);
  });

  it("returns 404 for unknown alert id", async () => {
    const { PATCH } =
      await import("@/app/api/operator/alerts/[alertId]/dismiss/route");
    const res = await PATCH(
      makeRequest("/api/operator/alerts/nonexistent-999/dismiss", {
        method: "PATCH",
      }),
      makeParams({ alertId: "nonexistent-999" }),
    );
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// POST /api/operator/stores/:storeId/restock
// ---------------------------------------------------------------------------

describe("POST /api/operator/stores/:storeId/restock", () => {
  it("restocks items to full capacity and returns activity event", async () => {
    const { GET: listGET } = await import("@/app/api/operator/stores/route");
    const listRes = await listGET();
    const { stores } = await listRes.json();
    const firstId = stores[0].id;

    const { GET: invGET } =
      await import("@/app/api/operator/stores/[storeId]/inventory/route");
    const invRes = await invGET(
      makeRequest(`/api/operator/stores/${firstId}/inventory`),
      makeParams({ storeId: firstId }),
    );
    const { items } = await invRes.json();
    const itemIds = items.slice(0, 2).map((i: { id: string }) => i.id);

    const { POST } =
      await import("@/app/api/operator/stores/[storeId]/restock/route");
    const res = await POST(
      makeRequest(`/api/operator/stores/${firstId}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds }),
      }),
      makeParams({ storeId: firstId }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    for (const item of body.items) {
      expect(item.currentStock).toBe(item.capacity);
    }
    expect(() => activityEventSchema.parse(body.activity)).not.toThrow();
    expect(body.activity.type).toBe("restock");
    expect(body.activity.storeId).toBe(firstId);
  });

  it("returns 400 for invalid body", async () => {
    const { GET: listGET } = await import("@/app/api/operator/stores/route");
    const listRes = await listGET();
    const { stores } = await listRes.json();
    const firstId = stores[0].id;

    const { POST } =
      await import("@/app/api/operator/stores/[storeId]/restock/route");
    const res = await POST(
      makeRequest(`/api/operator/stores/${firstId}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wrong: "field" }),
      }),
      makeParams({ storeId: firstId }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown store id", async () => {
    expectSeedFallback();
    const { POST } =
      await import("@/app/api/operator/stores/[storeId]/restock/route");
    const res = await POST(
      makeRequest("/api/operator/stores/nonexistent-999/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: ["item-001"] }),
      }),
      makeParams({ storeId: "nonexistent-999" }),
    );
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GET /api/operator/planner/benchmarks
// ---------------------------------------------------------------------------

describe("GET /api/operator/planner/benchmarks", () => {
  it("returns fleet-derived benchmarks that pass schema validation", async () => {
    const { GET } = await import("@/app/api/operator/planner/benchmarks/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    const result = plannerBenchmarksResponseSchema.safeParse(body);
    expect(result.success).toBe(true);
    // The seed fleet has sales, so it learns a real basket price.
    expect(body.benchmarks).not.toBeNull();
    expect(body.benchmarks.avgItemPrice).toBeGreaterThan(0);
    expect(body.benchmarks.sampleSize).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// GET /api/operator/product-performance
// ---------------------------------------------------------------------------

describe("GET /api/operator/product-performance", () => {
  it("returns a schema-valid fleet performance payload", async () => {
    const { GET } = await import("@/app/api/operator/product-performance/route");
    const res = await GET(makeRequest("/api/operator/product-performance?range=30d"));
    expect(res.status).toBe(200);
    const body = await res.json();
    const result = productPerformanceResponseSchema.safeParse(body);
    expect(result.success).toBe(true);
    expect(body.days).toBe(30);
    expect(body.products.length).toBeGreaterThan(0);
  });

  it("defaults to a 30-day window for an unknown range", async () => {
    const { GET } = await import("@/app/api/operator/product-performance/route");
    const res = await GET(makeRequest("/api/operator/product-performance?range=decade"));
    const body = await res.json();
    expect(body.days).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// GET /api/operator/shrink-summary
// ---------------------------------------------------------------------------

describe("GET /api/operator/shrink-summary", () => {
  it("returns a schema-valid fleet shrink payload with seeded count history", async () => {
    const { GET } = await import("@/app/api/operator/shrink-summary/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    const result = fleetShrinkResponseSchema.safeParse(body);
    expect(result.success).toBe(true);
    // The seed ships completed restock counts, so there is shrink to report.
    expect(body.stores.length).toBeGreaterThan(0);
    expect(body.totals.countedLines).toBeGreaterThan(0);
    expect(body.totals.unexplainedUnits).toBeGreaterThan(0);
  });

  it("ranks stores worst-first by unexplained shrink value", async () => {
    const { GET } = await import("@/app/api/operator/shrink-summary/route");
    const body = await (await GET()).json();
    const values = body.stores.map(
      (s: { unexplainedValue: number }) => s.unexplainedValue,
    );
    const sorted = [...values].sort((a, b) => b - a);
    expect(values).toEqual(sorted);
  });
});

// ---------------------------------------------------------------------------
// GET /api/operator/fleet-summary
// ---------------------------------------------------------------------------

describe("GET /api/operator/fleet-summary", () => {
  it("returns a response that passes schema validation", async () => {
    const { GET } = await import("@/app/api/operator/fleet-summary/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    const result = fleetSummaryResponseSchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it("returns one summary per store", async () => {
    const { GET: listGET } = await import("@/app/api/operator/stores/route");
    const listRes = await listGET();
    const { stores } = await listRes.json();

    const { GET } = await import("@/app/api/operator/fleet-summary/route");
    const res = await GET();
    const body = await res.json();

    expect(body.summaries.length).toBe(stores.length);
    const summaryIds = body.summaries.map(
      (s: { storeId: string }) => s.storeId,
    );
    for (const store of stores) {
      expect(summaryIds).toContain(store.id);
    }
  });

  it("returns 24 hourly alert trend buckets", async () => {
    const { GET } = await import("@/app/api/operator/fleet-summary/route");
    const res = await GET();
    const body = await res.json();
    expect(body.alertTrend).toHaveLength(24);
  });

  it("returns fleet stats with non-negative values", async () => {
    const { GET } = await import("@/app/api/operator/fleet-summary/route");
    const res = await GET();
    const body = await res.json();
    expect(body.fleetStats.criticalAlerts).toBeGreaterThanOrEqual(0);
    expect(body.fleetStats.warningAlerts).toBeGreaterThanOrEqual(0);
    expect(body.fleetStats.lowStockItems).toBeGreaterThanOrEqual(0);
    expect(body.fleetStats.avgInventoryHealth).toBeGreaterThanOrEqual(0);
    expect(body.fleetStats.avgInventoryHealth).toBeLessThanOrEqual(100);
  });
});
