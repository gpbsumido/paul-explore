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

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const storeSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
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
