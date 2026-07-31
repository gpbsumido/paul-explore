import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const storeStatusSchema = z.enum(["online", "degraded", "offline"]);

export const alertSeveritySchema = z.enum(["info", "warning", "critical"]);

export const alertCategorySchema = z.enum([
  "sensor-offline",
  "low-stock",
  "temperature-warning",
  "door-ajar",
  "power-issue",
]);

export const activityTypeSchema = z.enum([
  "restock",
  "maintenance",
  "alert-acknowledged",
  "status-change",
  "price-update",
]);

/**
 * Two-letter codes for every Canadian province and territory. Operators are
 * assumed to be in Canada, so a store's province drives its sales tax.
 */
export const provinceCodeSchema = z.enum([
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "NT",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
]);

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const storeSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  province: provinceCodeSchema,
  status: storeStatusSchema,
  temperature: z.number(),
  lastPing: z.string().datetime(),
  uptime: z.number().min(0).max(100),
  revenue24h: z.number(),
});

// ---------------------------------------------------------------------------
// InventoryItem
// ---------------------------------------------------------------------------

export const inventoryItemSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  productName: z.string(),
  category: z.string(),
  currentStock: z.number().int().min(0),
  capacity: z.number().int().min(1),
  price: z.number().min(0),
  lastRestocked: z.string().datetime(),
});

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------

export const alertSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  severity: alertSeveritySchema,
  category: alertCategorySchema,
  message: z.string(),
  timestamp: z.string().datetime(),
  acknowledged: z.boolean(),
});

// ---------------------------------------------------------------------------
// ActivityEvent
// ---------------------------------------------------------------------------

export const activityEventSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  type: activityTypeSchema,
  description: z.string(),
  timestamp: z.string().datetime(),
  actor: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Sale (a single completed transaction at a store)
// ---------------------------------------------------------------------------

export const saleSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  productName: z.string(),
  category: z.string(),
  unitPrice: z.number().min(0),
  quantity: z.number().int().min(1),
  total: z.number().min(0),
  timestamp: z.string().datetime(),
});

// ---------------------------------------------------------------------------
// Planogram (persisted shelf layout: which item occupies each slot + sensor)
// ---------------------------------------------------------------------------

export const planogramSlotSchema = z.object({
  itemId: z.string(),
  sensorMatch: z.boolean(),
});

// ---------------------------------------------------------------------------
// Fleet summary (aggregated per-store data for the dashboard)
// ---------------------------------------------------------------------------

export const storeSummarySchema = z.object({
  storeId: z.string(),
  alertCount: z.number().int().min(0),
  inventoryHealth: z.number().int().min(0).max(100),
  hasCritical: z.boolean(),
  hasWarning: z.boolean(),
});

export const fleetStatsSchema = z.object({
  criticalAlerts: z.number().int().min(0),
  warningAlerts: z.number().int().min(0),
  lowStockItems: z.number().int().min(0),
  avgInventoryHealth: z.number().int().min(0).max(100),
});

export const alertTrendBucketSchema = z.object({
  hour: z.string(),
  count: z.number().int().min(0),
});

export const fleetSummaryResponseSchema = z.object({
  summaries: z.array(storeSummarySchema),
  fleetStats: fleetStatsSchema,
  alertTrend: z.array(alertTrendBucketSchema),
});

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

export const restockBodySchema = z.object({
  itemIds: z.array(z.string()).min(1),
});

/**
 * A planogram update is either a reorder (the new slot order, by item id) or a
 * single-slot sensor re-sync (the item to mark as matching again).
 */
export const planogramUpdateSchema = z.union([
  z.object({ order: z.array(z.string()).min(1) }),
  z.object({ resyncItemId: z.string() }),
]);
