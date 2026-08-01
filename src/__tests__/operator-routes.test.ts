import { describe, it, expect } from "vitest";
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

  it("returns 404 for unknown store id", async () => {
    const { GET } =
      await import("@/app/api/operator/stores/[storeId]/inventory/route");
    const res = await GET(
      makeRequest("/api/operator/stores/nonexistent-999/inventory"),
      makeParams({ storeId: "nonexistent-999" }),
    );
    expect(res.status).toBe(404);
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

  it("returns 404 for unknown store id", async () => {
    const { GET } =
      await import("@/app/api/operator/stores/[storeId]/alerts/route");
    const res = await GET(
      makeRequest("/api/operator/stores/nonexistent-999/alerts"),
      makeParams({ storeId: "nonexistent-999" }),
    );
    expect(res.status).toBe(404);
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

  it("returns 404 for unknown store id", async () => {
    const { GET } =
      await import("@/app/api/operator/stores/[storeId]/sales/route");
    const res = await GET(
      makeRequest("/api/operator/stores/nonexistent-999/sales"),
      makeParams({ storeId: "nonexistent-999" }),
    );
    expect(res.status).toBe(404);
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

  it("returns 404 for unknown store id", async () => {
    const { GET } =
      await import("@/app/api/operator/stores/[storeId]/planogram/route");
    const res = await GET(
      makeRequest("/api/operator/stores/nope-999/planogram"),
      makeParams({ storeId: "nope-999" }),
    );
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/operator/stores/:storeId/planogram", () => {
  it("reorders slots to match the given item-id order", async () => {
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

    const reversed = current.slots
      .map((s: { itemId: string }) => s.itemId)
      .reverse();

    const res = await routeMod.PATCH(
      makeRequest(`/api/operator/stores/${firstId}/planogram`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: reversed }),
      }),
      makeParams({ storeId: firstId }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slots.map((s: { itemId: string }) => s.itemId)).toEqual(
      reversed,
    );
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
