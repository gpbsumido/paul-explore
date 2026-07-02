import { describe, it, expect } from "vitest";
import {
  storeStatusSchema,
  alertSeveritySchema,
  alertCategorySchema,
  storeSchema,
  inventoryItemSchema,
  alertSchema,
  activityEventSchema,
} from "@/lib/operator-schemas";
import {
  buildStore,
  buildStoreList,
  buildInventoryItem,
  buildInventoryList,
  buildAlert,
  buildAlertList,
  buildActivityEvent,
  buildActivityList,
  resetFactoryCounter,
} from "@/test/factories/operator";

// ---------------------------------------------------------------------------
// StoreStatus
// ---------------------------------------------------------------------------

describe("storeStatusSchema", () => {
  it("accepts valid statuses", () => {
    expect(storeStatusSchema.parse("online")).toBe("online");
    expect(storeStatusSchema.parse("degraded")).toBe("degraded");
    expect(storeStatusSchema.parse("offline")).toBe("offline");
  });

  it("rejects invalid status", () => {
    expect(() => storeStatusSchema.parse("broken")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// AlertSeverity
// ---------------------------------------------------------------------------

describe("alertSeveritySchema", () => {
  it("accepts valid severities", () => {
    expect(alertSeveritySchema.parse("info")).toBe("info");
    expect(alertSeveritySchema.parse("warning")).toBe("warning");
    expect(alertSeveritySchema.parse("critical")).toBe("critical");
  });

  it("rejects invalid severity", () => {
    expect(() => alertSeveritySchema.parse("fatal")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// AlertCategory
// ---------------------------------------------------------------------------

describe("alertCategorySchema", () => {
  it("accepts valid categories", () => {
    expect(alertCategorySchema.parse("sensor-offline")).toBe("sensor-offline");
    expect(alertCategorySchema.parse("low-stock")).toBe("low-stock");
    expect(alertCategorySchema.parse("temperature-warning")).toBe(
      "temperature-warning",
    );
    expect(alertCategorySchema.parse("door-ajar")).toBe("door-ajar");
    expect(alertCategorySchema.parse("power-issue")).toBe("power-issue");
  });

  it("rejects invalid category", () => {
    expect(() => alertCategorySchema.parse("unknown-thing")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

describe("storeSchema", () => {
  const validStore = {
    id: "store-001",
    name: "Lobby Fridge - Building A",
    location: "Building A, Floor 1",
    status: "online" as const,
    temperature: 3.2,
    lastPing: "2026-06-29T10:30:00Z",
    uptime: 99.8,
    revenue24h: 142.5,
  };

  it("accepts a valid store", () => {
    expect(storeSchema.parse(validStore)).toEqual(validStore);
  });

  it("rejects missing required fields", () => {
    const { name: _, ...noName } = validStore;
    expect(() => storeSchema.parse(noName)).toThrow();
  });

  it("rejects invalid status enum", () => {
    expect(() =>
      storeSchema.parse({ ...validStore, status: "broken" }),
    ).toThrow();
  });

  it("rejects non-numeric temperature", () => {
    expect(() =>
      storeSchema.parse({ ...validStore, temperature: "cold" }),
    ).toThrow();
  });

  it("rejects invalid ISO timestamp for lastPing", () => {
    expect(() =>
      storeSchema.parse({ ...validStore, lastPing: "not-a-date" }),
    ).toThrow();
  });

  it("rejects negative uptime", () => {
    expect(() => storeSchema.parse({ ...validStore, uptime: -1 })).toThrow();
  });

  it("rejects uptime over 100", () => {
    expect(() => storeSchema.parse({ ...validStore, uptime: 101 })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// InventoryItem
// ---------------------------------------------------------------------------

describe("inventoryItemSchema", () => {
  const validItem = {
    id: "item-001",
    storeId: "store-001",
    productName: "Coca-Cola 355ml",
    category: "beverages",
    currentStock: 8,
    capacity: 12,
    price: 2.5,
    lastRestocked: "2026-06-28T14:00:00Z",
  };

  it("accepts a valid inventory item", () => {
    expect(inventoryItemSchema.parse(validItem)).toEqual(validItem);
  });

  it("rejects negative currentStock", () => {
    expect(() =>
      inventoryItemSchema.parse({ ...validItem, currentStock: -1 }),
    ).toThrow();
  });

  it("rejects zero capacity", () => {
    expect(() =>
      inventoryItemSchema.parse({ ...validItem, capacity: 0 }),
    ).toThrow();
  });

  it("rejects negative price", () => {
    expect(() =>
      inventoryItemSchema.parse({ ...validItem, price: -0.5 }),
    ).toThrow();
  });

  it("rejects missing storeId", () => {
    const { storeId: _, ...noStore } = validItem;
    expect(() => inventoryItemSchema.parse(noStore)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------

describe("alertSchema", () => {
  const validAlert = {
    id: "alert-001",
    storeId: "store-001",
    severity: "warning" as const,
    category: "low-stock" as const,
    message: "Coca-Cola stock below 20%",
    timestamp: "2026-06-29T09:15:00Z",
    acknowledged: false,
  };

  it("accepts a valid alert", () => {
    expect(alertSchema.parse(validAlert)).toEqual(validAlert);
  });

  it("rejects invalid severity", () => {
    expect(() =>
      alertSchema.parse({ ...validAlert, severity: "fatal" }),
    ).toThrow();
  });

  it("rejects invalid category", () => {
    expect(() =>
      alertSchema.parse({ ...validAlert, category: "unknown" }),
    ).toThrow();
  });

  it("accepts acknowledged as true", () => {
    const acked = { ...validAlert, acknowledged: true };
    expect(alertSchema.parse(acked).acknowledged).toBe(true);
  });

  it("rejects non-boolean acknowledged", () => {
    expect(() =>
      alertSchema.parse({ ...validAlert, acknowledged: "yes" }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// ActivityEvent
// ---------------------------------------------------------------------------

describe("activityEventSchema", () => {
  const validActivity = {
    id: "activity-001",
    storeId: "store-001",
    type: "restock" as const,
    description: "Restocked 12 units of Coca-Cola 355ml",
    timestamp: "2026-06-29T08:00:00Z",
    actor: "operator@micromart.com",
  };

  it("accepts a valid activity event", () => {
    expect(activityEventSchema.parse(validActivity)).toEqual(validActivity);
  });

  it("accepts all valid activity types", () => {
    const types = [
      "restock",
      "maintenance",
      "alert-acknowledged",
      "status-change",
      "price-update",
    ] as const;
    for (const type of types) {
      expect(
        activityEventSchema.parse({ ...validActivity, type }),
      ).toHaveProperty("type", type);
    }
  });

  it("rejects invalid activity type", () => {
    expect(() =>
      activityEventSchema.parse({ ...validActivity, type: "nope" }),
    ).toThrow();
  });

  it("accepts optional actor field", () => {
    const { actor: _, ...noActor } = validActivity;
    expect(activityEventSchema.parse(noActor)).not.toHaveProperty("actor");
  });

  it("rejects missing description", () => {
    const { description: _, ...noDesc } = validActivity;
    expect(() => activityEventSchema.parse(noDesc)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Factory integration — generated data passes schema validation
// ---------------------------------------------------------------------------

describe("factory functions produce schema-valid data", () => {
  it("buildStore output passes storeSchema", () => {
    const store = buildStore();
    expect(() => storeSchema.parse(store)).not.toThrow();
  });

  it("buildStoreList produces multiple valid stores", () => {
    const stores = buildStoreList(3);
    expect(stores).toHaveLength(3);
    for (const s of stores) {
      expect(() => storeSchema.parse(s)).not.toThrow();
    }
  });

  it("buildInventoryItem output passes inventoryItemSchema", () => {
    const item = buildInventoryItem();
    expect(() => inventoryItemSchema.parse(item)).not.toThrow();
  });

  it("buildInventoryList produces valid items tied to a store", () => {
    const items = buildInventoryList("store-042", 4);
    expect(items).toHaveLength(4);
    for (const item of items) {
      expect(item.storeId).toBe("store-042");
      expect(() => inventoryItemSchema.parse(item)).not.toThrow();
    }
  });

  it("buildAlert output passes alertSchema", () => {
    const alert = buildAlert();
    expect(() => alertSchema.parse(alert)).not.toThrow();
  });

  it("buildAlertList produces valid alerts tied to a store", () => {
    const alerts = buildAlertList("store-007", 3);
    expect(alerts).toHaveLength(3);
    for (const a of alerts) {
      expect(a.storeId).toBe("store-007");
      expect(() => alertSchema.parse(a)).not.toThrow();
    }
  });

  it("buildActivityEvent output passes activityEventSchema", () => {
    const event = buildActivityEvent();
    expect(() => activityEventSchema.parse(event)).not.toThrow();
  });

  it("buildActivityList produces valid events tied to a store", () => {
    const events = buildActivityList("store-099", 5);
    expect(events).toHaveLength(5);
    for (const e of events) {
      expect(e.storeId).toBe("store-099");
      expect(() => activityEventSchema.parse(e)).not.toThrow();
    }
  });

  it("buildStore accepts overrides", () => {
    const store = buildStore({ name: "Custom Name", status: "degraded" });
    expect(store.name).toBe("Custom Name");
    expect(store.status).toBe("degraded");
    expect(() => storeSchema.parse(store)).not.toThrow();
  });

  it("resetFactoryCounter resets IDs", () => {
    resetFactoryCounter();
    const store = buildStore();
    expect(store.id).toBe("store-001");
  });
});
