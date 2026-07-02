import type {
  Store,
  Alert,
  InventoryItem,
  StoreStatus,
} from "@/types/operator";

// ---------------------------------------------------------------------------
// Fleet health donut chart
// ---------------------------------------------------------------------------

type FleetHealthDatum = {
  readonly name: string;
  readonly value: number;
  readonly fill: string;
};

const STATUS_COLORS: Record<StoreStatus, string> = {
  online: "var(--color-success-500)",
  degraded: "var(--color-warning-500)",
  offline: "var(--color-error-500)",
};

const STATUS_LABELS: Record<StoreStatus, string> = {
  online: "Online",
  degraded: "Degraded",
  offline: "Offline",
};

const STATUS_ORDER: readonly StoreStatus[] = [
  "online",
  "degraded",
  "offline",
] as const;

/**
 * Transforms a store list into donut chart data showing the distribution
 * of store statuses. Omits statuses with zero stores.
 */
export function toFleetHealthData(
  stores: readonly Store[],
): readonly FleetHealthDatum[] {
  const counts = new Map<StoreStatus, number>();

  for (const store of stores) {
    counts.set(store.status, (counts.get(store.status) ?? 0) + 1);
  }

  return STATUS_ORDER.filter((status) => (counts.get(status) ?? 0) > 0).map(
    (status) => ({
      name: STATUS_LABELS[status],
      value: counts.get(status)!,
      fill: STATUS_COLORS[status],
    }),
  );
}

// ---------------------------------------------------------------------------
// Alert trend area chart
// ---------------------------------------------------------------------------

type AlertTrendDatum = {
  readonly hour: string;
  readonly count: number;
};

/**
 * Buckets alerts into 24 one-hour slots ending at the current hour.
 * Alerts older than 24 hours are ignored. Returns oldest-first order.
 */
export function toAlertTrendData(
  alerts: readonly Alert[],
): readonly AlertTrendDatum[] {
  const now = new Date();
  const buckets = new Array<number>(24).fill(0);

  const currentHourStart = new Date(now);
  currentHourStart.setMinutes(0, 0, 0);

  for (const alert of alerts) {
    const alertTime = new Date(alert.timestamp);
    const diffMs = currentHourStart.getTime() - alertTime.getTime();
    const hoursAgo = Math.floor(diffMs / (60 * 60 * 1000));

    if (hoursAgo < 0) {
      // alert is in the current hour (ahead of hour start)
      buckets[23] += 1;
    } else if (hoursAgo < 24) {
      buckets[23 - hoursAgo] += 1;
    }
    // alerts older than 24h are ignored
  }

  return buckets.map((count, i) => {
    const hourDate = new Date(
      currentHourStart.getTime() - (23 - i) * 60 * 60 * 1000,
    );
    const label = hourDate.toLocaleTimeString([], {
      hour: "numeric",
      hour12: true,
    });
    return { hour: label, count };
  });
}

// ---------------------------------------------------------------------------
// Inventory comparison bar chart
// ---------------------------------------------------------------------------

type InventoryComparisonDatum = {
  readonly name: string;
  readonly health: number;
};

const MAX_NAME_LENGTH = 20;

/**
 * Computes average inventory health (0-100) per store for a bar chart.
 * Zero-capacity items contribute 0 to the average. Long store names
 * are truncated for chart label readability.
 */
export function toInventoryComparisonData(
  stores: readonly Store[],
  inventoryByStore: ReadonlyMap<string, readonly InventoryItem[]>,
): readonly InventoryComparisonDatum[] {
  return stores.map((store) => {
    const items = inventoryByStore.get(store.id);
    const name =
      store.name.length > MAX_NAME_LENGTH
        ? store.name.slice(0, MAX_NAME_LENGTH - 1) + "…"
        : store.name;

    if (!items || items.length === 0) {
      return { name, health: 0 };
    }

    const totalRatio = items.reduce((sum, item) => {
      const ratio = item.capacity > 0 ? item.currentStock / item.capacity : 0;
      return sum + ratio;
    }, 0);

    return {
      name,
      health: Math.round((totalRatio / items.length) * 100),
    };
  });
}
