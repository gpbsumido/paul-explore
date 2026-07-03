import { describe, it, expect, beforeAll } from "vitest";
import { server } from "@/test/server";
import { operatorHandlers } from "@/test/handlers/operator";
import {
  storeSchema,
  inventoryItemSchema,
  alertSchema,
  activityEventSchema,
  fleetSummaryResponseSchema,
} from "@/lib/operator-schemas";
import { z } from "zod";

beforeAll(() => {
  server.use(...operatorHandlers);
});

// ---------------------------------------------------------------------------
// GET /api/operator/stores — fleet list
// ---------------------------------------------------------------------------

describe("GET /api/operator/stores", () => {
  it("returns an array of stores", async () => {
    const res = await fetch("/api/operator/stores");
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.stores)).toBe(true);
    expect(body.stores.length).toBeGreaterThan(0);
  });

  it("returns stores that pass schema validation", async () => {
    const res = await fetch("/api/operator/stores");
    const body = await res.json();
    const result = z.array(storeSchema).safeParse(body.stores);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// GET /api/operator/stores/:id — store detail
// ---------------------------------------------------------------------------

describe("GET /api/operator/stores/:id", () => {
  it("returns a single store by id", async () => {
    const listRes = await fetch("/api/operator/stores");
    const { stores } = await listRes.json();
    const firstId = stores[0].id;

    const res = await fetch(`/api/operator/stores/${firstId}`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.store.id).toBe(firstId);
    expect(() => storeSchema.parse(body.store)).not.toThrow();
  });

  it("returns 404 for unknown store id", async () => {
    const res = await fetch("/api/operator/stores/nonexistent-999");
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GET /api/operator/stores/:id/inventory — inventory list
// ---------------------------------------------------------------------------

describe("GET /api/operator/stores/:id/inventory", () => {
  it("returns inventory items for a store", async () => {
    const listRes = await fetch("/api/operator/stores");
    const { stores } = await listRes.json();
    const firstId = stores[0].id;

    const res = await fetch(`/api/operator/stores/${firstId}/inventory`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
  });

  it("returns items that pass schema validation", async () => {
    const listRes = await fetch("/api/operator/stores");
    const { stores } = await listRes.json();
    const firstId = stores[0].id;

    const res = await fetch(`/api/operator/stores/${firstId}/inventory`);
    const body = await res.json();
    const result = z.array(inventoryItemSchema).safeParse(body.items);
    expect(result.success).toBe(true);
  });

  it("returns items linked to the requested store", async () => {
    const listRes = await fetch("/api/operator/stores");
    const { stores } = await listRes.json();
    const firstId = stores[0].id;

    const res = await fetch(`/api/operator/stores/${firstId}/inventory`);
    const body = await res.json();
    for (const item of body.items) {
      expect(item.storeId).toBe(firstId);
    }
  });

  it("returns 404 for unknown store id", async () => {
    const res = await fetch("/api/operator/stores/nonexistent-999/inventory");
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GET /api/operator/stores/:id/alerts — alerts for a store
// ---------------------------------------------------------------------------

describe("GET /api/operator/stores/:id/alerts", () => {
  it("returns alerts for a store", async () => {
    const listRes = await fetch("/api/operator/stores");
    const { stores } = await listRes.json();
    const firstId = stores[0].id;

    const res = await fetch(`/api/operator/stores/${firstId}/alerts`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.alerts)).toBe(true);
  });

  it("returns alerts that pass schema validation", async () => {
    const listRes = await fetch("/api/operator/stores");
    const { stores } = await listRes.json();
    const firstId = stores[0].id;

    const res = await fetch(`/api/operator/stores/${firstId}/alerts`);
    const body = await res.json();
    const result = z.array(alertSchema).safeParse(body.alerts);
    expect(result.success).toBe(true);
  });

  it("returns alerts linked to the requested store", async () => {
    const listRes = await fetch("/api/operator/stores");
    const { stores } = await listRes.json();
    const firstId = stores[0].id;

    const res = await fetch(`/api/operator/stores/${firstId}/alerts`);
    const body = await res.json();
    for (const alert of body.alerts) {
      expect(alert.storeId).toBe(firstId);
    }
  });

  it("returns 404 for unknown store id", async () => {
    const res = await fetch("/api/operator/stores/nonexistent-999/alerts");
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/operator/alerts/:id/dismiss — dismiss an alert
// ---------------------------------------------------------------------------

describe("PATCH /api/operator/alerts/:id/dismiss", () => {
  it("dismisses an alert and returns it acknowledged", async () => {
    const listRes = await fetch("/api/operator/stores");
    const { stores } = await listRes.json();
    const firstId = stores[0].id;

    const alertsRes = await fetch(`/api/operator/stores/${firstId}/alerts`);
    const { alerts } = await alertsRes.json();
    const unacked = alerts.find(
      (a: { acknowledged: boolean }) => !a.acknowledged,
    );
    if (!unacked) return;

    const res = await fetch(`/api/operator/alerts/${unacked.id}/dismiss`, {
      method: "PATCH",
    });
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.alert.id).toBe(unacked.id);
    expect(body.alert.acknowledged).toBe(true);
  });

  it("returns 404 for unknown alert id", async () => {
    const res = await fetch("/api/operator/alerts/nonexistent-999/dismiss", {
      method: "PATCH",
    });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// POST /api/operator/stores/:id/restock — mark items restocked
// ---------------------------------------------------------------------------

describe("POST /api/operator/stores/:id/restock", () => {
  it("restocks items and returns updated inventory + activity event", async () => {
    const listRes = await fetch("/api/operator/stores");
    const { stores } = await listRes.json();
    const firstId = stores[0].id;

    const invRes = await fetch(`/api/operator/stores/${firstId}/inventory`);
    const { items } = await invRes.json();
    const itemIds = items.slice(0, 2).map((i: { id: string }) => i.id);

    const res = await fetch(`/api/operator/stores/${firstId}/restock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds }),
    });
    expect(res.ok).toBe(true);
    const body = await res.json();

    expect(Array.isArray(body.items)).toBe(true);
    for (const item of body.items) {
      expect(item.currentStock).toBe(item.capacity);
    }

    expect(body.activity).toBeDefined();
    expect(() => activityEventSchema.parse(body.activity)).not.toThrow();
    expect(body.activity.type).toBe("restock");
    expect(body.activity.storeId).toBe(firstId);
  });

  it("returns 404 for unknown store id", async () => {
    const res = await fetch("/api/operator/stores/nonexistent-999/restock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds: ["item-001"] }),
    });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GET /api/operator/fleet-summary — aggregated dashboard data
// ---------------------------------------------------------------------------

describe("GET /api/operator/fleet-summary", () => {
  it("returns a response that passes schema validation", async () => {
    const res = await fetch("/api/operator/fleet-summary");
    expect(res.ok).toBe(true);
    const body = await res.json();
    const result = fleetSummaryResponseSchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it("returns one summary per store", async () => {
    const storesRes = await fetch("/api/operator/stores");
    const { stores } = await storesRes.json();

    const res = await fetch("/api/operator/fleet-summary");
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
    const res = await fetch("/api/operator/fleet-summary");
    const body = await res.json();
    expect(body.alertTrend).toHaveLength(24);
  });
});

// ---------------------------------------------------------------------------
// Degraded store behavior
// ---------------------------------------------------------------------------

describe("degraded store simulation", () => {
  it("includes at least one store that is not online", async () => {
    const res = await fetch("/api/operator/stores");
    const { stores } = await res.json();
    const nonOnline = stores.filter(
      (s: { status: string }) => s.status !== "online",
    );
    expect(nonOnline.length).toBeGreaterThanOrEqual(1);
  });
});
