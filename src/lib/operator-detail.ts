// ---------------------------------------------------------------------------
// Store detail page helpers: tab routing, connection quality, inventory, alerts
// ---------------------------------------------------------------------------

import type {
  InventoryItem,
  Alert,
  AlertSeverity,
  ActivityType,
} from "@/types/operator";

export type TabId = "inventory" | "alerts" | "activity" | "planogram";

export type ConnectionQuality = "strong" | "weak" | "offline";

export type StockStatus = "healthy" | "low" | "critical" | "out-of-stock";

export type SparklinePoint = { day: string; stock: number };

export type InventorySummary = {
  totalItems: number;
  needsRestock: number;
  fillPercentage: number;
};

export const TABS: readonly { id: TabId; label: string }[] = [
  { id: "inventory", label: "Inventory" },
  { id: "alerts", label: "Alerts" },
  { id: "activity", label: "Activity" },
  { id: "planogram", label: "Planogram" },
] as const;

const VALID_TAB_IDS = new Set<string>(TABS.map((t) => t.id));

const WEAK_THRESHOLD_MS = 2 * 60 * 1000;
const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;
const CRITICAL_THRESHOLD = 0.2;
const LOW_THRESHOLD = 0.5;

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/**
 * Resolves a URL search param value into a valid tab ID.
 * Falls back to "inventory" when the param is null, empty, or unrecognized.
 */
export function parseTab(param: string | null): TabId {
  if (param && VALID_TAB_IDS.has(param)) {
    return param as TabId;
  }
  return "inventory";
}

/**
 * Derives sensor connection quality from the lastPing ISO timestamp.
 * Strong = within 2 minutes, Weak = 2-5 minutes, Offline = over 5 minutes.
 */
export function getConnectionQuality(lastPing: string): ConnectionQuality {
  const elapsed = Date.now() - new Date(lastPing).getTime();

  if (elapsed < WEAK_THRESHOLD_MS) return "strong";
  if (elapsed < OFFLINE_THRESHOLD_MS) return "weak";
  return "offline";
}

/**
 * Categorizes stock level into a status label based on fill ratio.
 * Out-of-stock = 0, Critical = below 20%, Low = below 50%, Healthy = 50%+.
 */
export function categorizeStock(
  currentStock: number,
  capacity: number,
): StockStatus {
  if (currentStock === 0) return "out-of-stock";
  const ratio = currentStock / capacity;
  if (ratio < CRITICAL_THRESHOLD) return "critical";
  if (ratio < LOW_THRESHOLD) return "low";
  return "healthy";
}

/**
 * Aggregates inventory stats: total items, count needing restock (critical or
 * out-of-stock), and average fill percentage across all items.
 */
export function computeInventorySummary(
  items: readonly InventoryItem[],
): InventorySummary {
  if (items.length === 0) {
    return { totalItems: 0, needsRestock: 0, fillPercentage: 0 };
  }

  let needsRestock = 0;
  let totalRatio = 0;

  for (const item of items) {
    const status = categorizeStock(item.currentStock, item.capacity);
    if (status === "critical" || status === "out-of-stock") {
      needsRestock += 1;
    }
    totalRatio += item.capacity > 0 ? item.currentStock / item.capacity : 0;
  }

  return {
    totalItems: items.length,
    needsRestock,
    fillPercentage: Math.round((totalRatio / items.length) * 100),
  };
}

/**
 * Generates a deterministic 7-day simulated stock trend for sparkline display.
 * Uses a simple seeded hash from the item ID so the same item always produces
 * the same chart. The last data point always matches the current stock.
 */
export function generateSparklineData(
  currentStock: number,
  capacity: number,
  seed: string,
): readonly SparklinePoint[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }

  const points: SparklinePoint[] = [];
  for (let i = 0; i < 7; i++) {
    if (i === 6) {
      points.push({ day: DAY_LABELS[i], stock: currentStock });
    } else {
      hash = (hash * 16807 + 1) | 0;
      const noise = (Math.abs(hash) % 100) / 100;
      const stock = Math.round(noise * capacity);
      points.push({
        day: DAY_LABELS[i],
        stock: Math.max(0, Math.min(capacity, stock)),
      });
    }
  }

  return points;
}

// ---------------------------------------------------------------------------
// Alert helpers
// ---------------------------------------------------------------------------

const SEVERITY_PRIORITY: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export type AlertSeverityFilter = AlertSeverity | "all";

/**
 * Sorts alerts by severity (critical first, then warning, then info).
 * Stable sort preserves relative order within the same severity tier.
 */
export function sortAlertsBySeverity(
  alerts: readonly Alert[],
): readonly Alert[] {
  return [...alerts].sort(
    (a, b) => SEVERITY_PRIORITY[a.severity] - SEVERITY_PRIORITY[b.severity],
  );
}

/**
 * Filters alerts to only unacknowledged ones, optionally narrowed by severity.
 * Pass "all" to get every unacknowledged alert regardless of severity.
 */
export function filterAlertsBySeverity(
  alerts: readonly Alert[],
  severity: AlertSeverityFilter,
): readonly Alert[] {
  return alerts.filter(
    (a) => !a.acknowledged && (severity === "all" || a.severity === severity),
  );
}

/**
 * Counts unacknowledged (active) alerts in a list.
 */
export function countActiveAlerts(alerts: readonly Alert[]): number {
  return alerts.filter((a) => !a.acknowledged).length;
}

// ---------------------------------------------------------------------------
// Activity helpers
// ---------------------------------------------------------------------------

export type ActivityTypeConfig = {
  label: string;
  color: string;
};

export const ACTIVITY_TYPE_CONFIGS: Record<ActivityType, ActivityTypeConfig> = {
  restock: { label: "Restock", color: "text-success-500" },
  maintenance: { label: "Maintenance", color: "text-primary-500" },
  "alert-acknowledged": { label: "Alert Dismissed", color: "text-warning-500" },
  "status-change": { label: "Status Change", color: "text-muted" },
  "price-update": { label: "Price Update", color: "text-violet-500" },
};

/**
 * Returns display config (label + color class) for an activity event type.
 */
export function getActivityTypeConfig(type: ActivityType): ActivityTypeConfig {
  return ACTIVITY_TYPE_CONFIGS[type];
}

// ---------------------------------------------------------------------------
// Planogram helpers
// ---------------------------------------------------------------------------

export type PlanogramSlot = {
  productName: string;
  category: string;
  currentStock: number;
  capacity: number;
  sensorMatch: boolean;
};

/**
 * Generates a simplified planogram grid from inventory items. Items are laid
 * out left-to-right across shelves of the given width. Each slot includes a
 * deterministic sensorMatch flag derived from the item ID so the visual is
 * stable across renders.
 */
export function generatePlanogramGrid(
  items: readonly InventoryItem[],
  shelfWidth: number = 4,
): readonly (readonly PlanogramSlot[])[] {
  if (items.length === 0) return [];

  const slots: PlanogramSlot[] = items.map((item) => {
    let hash = 0;
    for (let i = 0; i < item.id.length; i++) {
      hash = (hash * 31 + item.id.charCodeAt(i)) | 0;
    }
    const sensorMatch = Math.abs(hash) % 5 !== 0;

    return {
      productName: item.productName,
      category: item.category,
      currentStock: item.currentStock,
      capacity: item.capacity,
      sensorMatch,
    };
  });

  const shelves: PlanogramSlot[][] = [];
  for (let i = 0; i < slots.length; i += shelfWidth) {
    shelves.push(slots.slice(i, i + shelfWidth));
  }

  return shelves;
}
