import type { z } from "zod";
import type {
  storeStatusSchema,
  alertSeveritySchema,
  alertCategorySchema,
  activityTypeSchema,
  storeSchema,
  inventoryItemSchema,
  alertSchema,
  activityEventSchema,
  storeSummarySchema,
  fleetStatsSchema,
  alertTrendBucketSchema,
  fleetSummaryResponseSchema,
} from "@/lib/operator-schemas";

export type StoreStatus = z.infer<typeof storeStatusSchema>;
export type AlertSeverity = z.infer<typeof alertSeveritySchema>;
export type AlertCategory = z.infer<typeof alertCategorySchema>;
export type ActivityType = z.infer<typeof activityTypeSchema>;

export type Store = z.infer<typeof storeSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type Alert = z.infer<typeof alertSchema>;
export type ActivityEvent = z.infer<typeof activityEventSchema>;

export type StoreSummary = z.infer<typeof storeSummarySchema>;
export type FleetStats = z.infer<typeof fleetStatsSchema>;
export type AlertTrendBucket = z.infer<typeof alertTrendBucketSchema>;
export type FleetSummaryResponse = z.infer<typeof fleetSummaryResponseSchema>;
