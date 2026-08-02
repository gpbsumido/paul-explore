// ---------------------------------------------------------------------------
// Store detail page helpers: tab routing, connection quality, inventory, alerts
// ---------------------------------------------------------------------------

import type {
  InventoryItem,
  Alert,
  AlertSeverity,
  AlertCategory,
  ActivityType,
  StoreStatus,
} from "@/types/operator";

export type TabId =
  | "inventory"
  | "alerts"
  | "activity"
  | "planogram"
  | "sales"
  | "tax";

export type ConnectionQuality = "strong" | "weak" | "poor" | "offline";

export type StockStatus = "healthy" | "low" | "critical" | "out-of-stock";

export type SparklinePoint = { day: string; stock: number };

export type InventorySummary = {
  totalItems: number;
  needsRestock: number;
  fillPercentage: number;
};

export type StoreStatusConfig = {
  label: string;
  dot: string;
  border: string;
  bg: string;
};

export const STATUS_CONFIG: Record<StoreStatus, StoreStatusConfig> = {
  online: {
    label: "Online",
    dot: "bg-success-500",
    border: "",
    bg: "bg-success-500/10",
  },
  degraded: {
    label: "Degraded",
    dot: "bg-warning-500",
    border: "border-warning-400/40",
    bg: "bg-warning-500/10",
  },
  offline: {
    label: "Offline",
    dot: "bg-error-500",
    border: "border-error-400/40",
    bg: "bg-error-500/10",
  },
} as const;

export const TABS: readonly { id: TabId; label: string }[] = [
  { id: "inventory", label: "Inventory" },
  { id: "alerts", label: "Alerts" },
  { id: "activity", label: "Activity" },
  { id: "planogram", label: "Planogram" },
  { id: "sales", label: "Sales" },
  { id: "tax", label: "Tax" },
] as const;

const VALID_TAB_IDS = new Set<string>(TABS.map((t) => t.id));

const WEAK_THRESHOLD_MS = 2 * 60 * 1000;
const POOR_THRESHOLD_MS = 5 * 60 * 1000;
const OFFLINE_THRESHOLD_MS = 10 * 60 * 1000;
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
 * Strong = within 2 min, Weak = 2-5 min, Poor = 5-10 min, Offline = over 10 min.
 */
export function getConnectionQuality(
  lastPing: string,
  now: number = Date.now(),
): ConnectionQuality {
  const elapsed = now - new Date(lastPing).getTime();

  if (elapsed < WEAK_THRESHOLD_MS) return "strong";
  if (elapsed < POOR_THRESHOLD_MS) return "weak";
  if (elapsed < OFFLINE_THRESHOLD_MS) return "poor";
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
  slotLabel: string;
};

export type RefillEntry = {
  slotLabel: string;
  productName: string;
  category: string;
  currentStock: number;
  capacity: number;
};

/**
 * A persisted planogram box: which item occupies it (null when empty) and its
 * sensor state. Shelves have fixed boxes, so an operator can move a product
 * into an empty box, not just swap two occupied spots.
 */
export type PlanogramSlotRecord = {
  itemId: string | null;
  sensorMatch: boolean;
};

/** A planogram box joined with its item, ready to render (empty when vacant). */
export type AssembledSlot = {
  slotLabel: string;
  itemId: string | null;
  empty: boolean;
  productName: string;
  category: string;
  currentStock: number;
  capacity: number;
  sensorMatch: boolean;
};

/** An empty box: no item, sensor reads clean. */
const EMPTY_BOX: PlanogramSlotRecord = { itemId: null, sensorMatch: true };

/**
 * Builds a slot address from a flat item index and shelf width: the shelf
 * letter (A, B, C...) followed by the 1-based position on that shelf. Item 5
 * on shelves of width 4 is "B2".
 */
export function slotLabelFor(index: number, shelfWidth: number): string {
  const shelf = Math.floor(index / shelfWidth);
  const position = (index % shelfWidth) + 1;
  return `${String.fromCharCode(65 + shelf)}${position}`;
}

/**
 * Deterministic sensor-match flag for a slot, seeded from the item id so the
 * same item always starts in the same state. Roughly one slot in five reads as
 * a mismatch until an operator re-syncs it.
 */
export function deriveSensorMatch(itemId: string): boolean {
  let hash = 0;
  for (let i = 0; i < itemId.length; i++) {
    hash = (hash * 31 + itemId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 5 !== 0;
}

/**
 * Generates a simplified planogram grid from inventory items. Items are laid
 * out left-to-right across shelves of the given width. Each slot carries its
 * address (slotLabel) so an operator knows which spot it is, plus a
 * deterministic sensorMatch flag derived from the item ID so the visual is
 * stable across renders.
 */
export function generatePlanogramGrid(
  items: readonly InventoryItem[],
  shelfWidth: number = 4,
): readonly (readonly PlanogramSlot[])[] {
  if (items.length === 0) return [];

  const slots: PlanogramSlot[] = items.map((item, index) => ({
    productName: item.productName,
    category: item.category,
    currentStock: item.currentStock,
    capacity: item.capacity,
    sensorMatch: deriveSensorMatch(item.id),
    slotLabel: slotLabelFor(index, shelfWidth),
  }));

  const shelves: PlanogramSlot[][] = [];
  for (let i = 0; i < slots.length; i += shelfWidth) {
    shelves.push(slots.slice(i, i + shelfWidth));
  }

  return shelves;
}

/**
 * Returns the slots that need restocking (anything below healthy fill), each
 * tagged with its slot address, ordered most-urgent first (lowest fill ratio).
 * This is the operator's refill run: which spot, which product, how empty.
 */
export function getRefillList(
  items: readonly InventoryItem[],
  shelfWidth: number = 4,
): readonly RefillEntry[] {
  return items
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item }) =>
        categorizeStock(item.currentStock, item.capacity) !== "healthy",
    )
    .sort(
      (a, b) =>
        a.item.currentStock / a.item.capacity -
        b.item.currentStock / b.item.capacity,
    )
    .map(({ item, index }) => ({
      slotLabel: slotLabelFor(index, shelfWidth),
      productName: item.productName,
      category: item.category,
      currentStock: item.currentStock,
      capacity: item.capacity,
    }));
}

/**
 * Moves the contents of box `from` into box `to`. If the target box is empty
 * the source is vacated; if it is occupied the two boxes swap contents. Both
 * indices are clamped and the input is never mutated. This is how an operator
 * places a product into an empty box, not just swaps two full ones.
 */
export function moveToBox(
  boxes: readonly PlanogramSlotRecord[],
  from: number,
  to: number,
): PlanogramSlotRecord[] {
  const next = boxes.map((b) => ({ ...b }));
  if (next.length === 0) return next;
  const clampedFrom = Math.max(0, Math.min(from, next.length - 1));
  const clampedTo = Math.max(0, Math.min(to, next.length - 1));
  if (clampedFrom === clampedTo) return next;

  const moving = next[clampedFrom];
  const target = next[clampedTo];
  next[clampedTo] = moving;
  next[clampedFrom] = target.itemId === null ? { ...EMPTY_BOX } : target;
  return next;
}

/**
 * Joins the persisted boxes and sensor flags with the current inventory to
 * produce a render-ready shelf grid. Every box keeps its position and address;
 * empty boxes (and boxes whose item has left inventory) render as vacant.
 */
export function assemblePlanogram(
  boxes: readonly PlanogramSlotRecord[],
  itemsById: ReadonlyMap<string, InventoryItem>,
  shelfWidth: number = 4,
): readonly (readonly AssembledSlot[])[] {
  const assembled: AssembledSlot[] = boxes.map((box, index) => {
    const item = box.itemId ? itemsById.get(box.itemId) : undefined;
    const slotLabel = slotLabelFor(index, shelfWidth);
    if (!item) {
      return {
        slotLabel,
        itemId: null,
        empty: true,
        productName: "",
        category: "",
        currentStock: 0,
        capacity: 0,
        sensorMatch: true,
      };
    }
    return {
      slotLabel,
      itemId: item.id,
      empty: false,
      productName: item.productName,
      category: item.category,
      currentStock: item.currentStock,
      capacity: item.capacity,
      sensorMatch: box.sensorMatch,
    };
  });

  const shelves: AssembledSlot[][] = [];
  for (let i = 0; i < assembled.length; i += shelfWidth) {
    shelves.push(assembled.slice(i, i + shelfWidth));
  }
  return shelves;
}

// ---------------------------------------------------------------------------
// Quick action helpers
// ---------------------------------------------------------------------------

/**
 * Returns IDs of inventory items below the healthy threshold (50% fill).
 * These are the items that "Mark All Restocked" would restock.
 */
export function getLowStockItemIds(
  items: readonly InventoryItem[],
): readonly string[] {
  return items
    .filter((item) => {
      const status = categorizeStock(item.currentStock, item.capacity);
      return status !== "healthy";
    })
    .map((item) => item.id);
}

/**
 * Returns non-critical, unacknowledged alerts that can be bulk-dismissed.
 * Critical alerts are excluded because they require individual attention.
 */
export function getDismissableAlerts(
  alerts: readonly Alert[],
): readonly Alert[] {
  return alerts.filter((a) => !a.acknowledged && a.severity !== "critical");
}

/**
 * Label for the "Acknowledge All" quick action. Bulk-ack only applies to
 * non-critical alerts, so when the only active alerts are critical the button
 * is disabled but says "Critical only" rather than falsely claiming there are
 * no alerts. It only reads "No Alerts" when nothing is active.
 */
export function acknowledgeAllLabel(alerts: readonly Alert[]): string {
  const dismissable = getDismissableAlerts(alerts).length;
  if (dismissable > 0) return `Acknowledge All (${dismissable})`;
  return countActiveAlerts(alerts) > 0 ? "Critical only" : "No Alerts";
}

// ---------------------------------------------------------------------------
// Alert history & analytics
// ---------------------------------------------------------------------------

export type AlertSummary = {
  active: number;
  resolved: number;
  bySeverity: Record<AlertSeverity, number>;
  topCategories: { category: AlertCategory; count: number }[];
};

/**
 * Rolls an alert list (active + resolved) into a summary: how many are still
 * active vs resolved, the active alerts broken down by severity, and which
 * categories show up most across the whole history.
 */
export function summarizeAlerts(alerts: readonly Alert[]): AlertSummary {
  let active = 0;
  let resolved = 0;
  const bySeverity: Record<AlertSeverity, number> = {
    info: 0,
    warning: 0,
    critical: 0,
  };
  const byCategory = new Map<AlertCategory, number>();

  for (const alert of alerts) {
    if (alert.acknowledged) {
      resolved += 1;
    } else {
      active += 1;
      bySeverity[alert.severity] += 1;
    }
    byCategory.set(alert.category, (byCategory.get(alert.category) ?? 0) + 1);
  }

  const topCategories = [...byCategory.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return { active, resolved, bySeverity, topCategories };
}

export type AlertDayBucket = { day: string; count: number };

const WEEKDAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

/**
 * Counts alerts raised per day over the last `days` calendar days (UTC),
 * oldest bucket first, each labelled with its weekday. Alerts outside the
 * window are ignored. A simple trend so operators can see whether alerts are
 * rising or falling.
 */
export function alertsByDay(
  alerts: readonly Alert[],
  now: Date = new Date(),
  days: number = 7,
): AlertDayBucket[] {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const todayIndex = Math.floor(now.getTime() / MS_PER_DAY);
  const counts = new Array<number>(days).fill(0);

  for (const alert of alerts) {
    const dayIndex = Math.floor(
      new Date(alert.timestamp).getTime() / MS_PER_DAY,
    );
    const offset = days - 1 - (todayIndex - dayIndex);
    if (offset >= 0 && offset < days) counts[offset] += 1;
  }

  return counts.map((count, offset) => {
    const dayMs = (todayIndex - (days - 1 - offset)) * MS_PER_DAY;
    return { day: WEEKDAY_LABELS[new Date(dayMs).getUTCDay()], count };
  });
}
