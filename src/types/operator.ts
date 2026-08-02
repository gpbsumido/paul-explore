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
  saleSchema,
  planogramSlotSchema,
  removalReasonSchema,
  restockLineSchema,
  restockSessionSchema,
  provinceCodeSchema,
  storeSummarySchema,
  alertTrendBucketSchema,
  fleetSummaryResponseSchema,
} from "@/lib/operator-schemas";

export type StoreStatus = z.infer<typeof storeStatusSchema>;
export type AlertSeverity = z.infer<typeof alertSeveritySchema>;
export type AlertCategory = z.infer<typeof alertCategorySchema>;
export type ActivityType = z.infer<typeof activityTypeSchema>;
export type ProvinceCode = z.infer<typeof provinceCodeSchema>;

export type Store = z.infer<typeof storeSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type Alert = z.infer<typeof alertSchema>;
export type ActivityEvent = z.infer<typeof activityEventSchema>;
export type Sale = z.infer<typeof saleSchema>;
export type PlanogramSlot = z.infer<typeof planogramSlotSchema>;
export type RestockSession = z.infer<typeof restockSessionSchema>;
export type RestockLine = z.infer<typeof restockLineSchema>;
export type RemovalReason = z.infer<typeof removalReasonSchema>;

export type StoreSummary = z.infer<typeof storeSummarySchema>;
export type AlertTrendBucket = z.infer<typeof alertTrendBucketSchema>;
export type FleetSummaryResponse = z.infer<typeof fleetSummaryResponseSchema>;
