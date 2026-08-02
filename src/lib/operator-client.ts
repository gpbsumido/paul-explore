// Client for the portfolio_api operator endpoints. The operator dashboard is a
// public demo, so these are unauthenticated reads and writes. Responses are
// validated against the same Zod schemas the UI uses, so a drifting API
// surfaces as a clear error the BFF can fall back on instead of bad UI state.

import { z } from "zod";
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
import type {
  Store,
  InventoryItem,
  Alert,
  ActivityEvent,
  Sale,
  PlanogramSlot,
  FleetSummaryResponse,
} from "@/types/operator";
import { API_URL } from "@/lib/backendFetch";

const BASE = `${API_URL}/api/operator`;

/**
 * The API answered with a non-2xx status. Distinct from a thrown fetch (the API
 * being unreachable) so the BFF can fall back to the seed only when the service
 * is truly down.
 */
export class OperatorApiError extends Error {
  constructor(readonly status: number) {
    super(`operator API responded ${status}`);
    this.name = "OperatorApiError";
  }
}

async function getJson<T>(
  path: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new OperatorApiError(res.status);
  return schema.parse(await res.json());
}

async function sendJson<T>(
  path: string,
  method: "POST" | "PATCH",
  body: unknown,
  schema: z.ZodType<T>,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new OperatorApiError(res.status);
  return schema.parse(await res.json());
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

const storesPayload = z.object({ stores: z.array(storeSchema) });
const storePayload = z.object({ store: storeSchema });
const inventoryPayload = z.object({ items: z.array(inventoryItemSchema) });
const alertsPayload = z.object({ alerts: z.array(alertSchema) });
const activityPayload = z.object({ events: z.array(activityEventSchema) });
const salesPayload = z.object({ sales: z.array(saleSchema) });
const planogramPayload = z.object({ slots: z.array(planogramSlotSchema) });

export async function fetchStores(): Promise<Store[]> {
  return (await getJson("/stores", storesPayload)).stores;
}

export async function fetchStore(storeId: string): Promise<Store> {
  return (await getJson(`/stores/${storeId}`, storePayload)).store;
}

export async function fetchInventory(
  storeId: string,
): Promise<InventoryItem[]> {
  return (await getJson(`/stores/${storeId}/inventory`, inventoryPayload)).items;
}

export async function fetchAlerts(storeId: string): Promise<Alert[]> {
  return (await getJson(`/stores/${storeId}/alerts`, alertsPayload)).alerts;
}

export async function fetchActivity(
  storeId: string,
): Promise<ActivityEvent[]> {
  return (await getJson(`/stores/${storeId}/activity`, activityPayload)).events;
}

export async function fetchSales(storeId: string): Promise<Sale[]> {
  return (await getJson(`/stores/${storeId}/sales`, salesPayload)).sales;
}

export async function fetchPlanogram(
  storeId: string,
): Promise<PlanogramSlot[]> {
  return (await getJson(`/stores/${storeId}/planogram`, planogramPayload)).slots;
}

export async function fetchFleetSummary(): Promise<FleetSummaryResponse> {
  return getJson("/fleet-summary", fleetSummaryResponseSchema);
}

export async function fetchSalesAnalytics(
  granularity: string,
): Promise<z.infer<typeof fleetSalesAnalyticsSchema>> {
  return getJson(
    `/sales-analytics?granularity=${granularity}`,
    fleetSalesAnalyticsSchema,
  );
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

const restockPayload = z.object({
  items: z.array(inventoryItemSchema),
  activity: activityEventSchema,
});
const dismissPayload = z.object({ alert: alertSchema });

export async function postRestock(
  storeId: string,
  itemIds: string[],
): Promise<z.infer<typeof restockPayload>> {
  return sendJson(
    `/stores/${storeId}/restock`,
    "POST",
    { itemIds },
    restockPayload,
  );
}

export async function patchDismiss(alertId: string): Promise<Alert> {
  return (
    await sendJson(`/alerts/${alertId}/dismiss`, "PATCH", {}, dismissPayload)
  ).alert;
}

export async function patchPlanogram(
  storeId: string,
  body: { boxes: PlanogramSlot[] } | { resyncItemId: string },
): Promise<PlanogramSlot[]> {
  return (
    await sendJson(
      `/stores/${storeId}/planogram`,
      "PATCH",
      body,
      planogramPayload,
    )
  ).slots;
}
