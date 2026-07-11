import type {
  Store,
  InventoryItem,
  Alert,
  ActivityEvent,
  AlertSeverity,
  AlertCategory,
  ActivityType,
} from "@/types/operator";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let counter = 0;

function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${String(counter).padStart(3, "0")}`;
}

function randomFrom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function recentTimestamp(hoursAgo: number = 1): string {
  const d = new Date();
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Store factory
// ---------------------------------------------------------------------------

const STORE_NAMES = [
  "Lobby Fridge - Building A",
  "Break Room Cooler - Floor 3",
  "Cafeteria Unit - Building B",
  "Gym Vending - Rec Center",
  "Parking Garage Kiosk - Level P2",
  "Reception Snacks - Main Lobby",
  "Lab Pantry - Building C",
  "Rooftop Lounge - Tower 1",
] as const;

const STORE_LOCATIONS = [
  "Building A, Floor 1",
  "Building A, Floor 3",
  "Building B, Floor 1",
  "Rec Center, Ground Floor",
  "Parking Garage, Level P2",
  "Main Lobby",
  "Building C, Floor 2",
  "Tower 1, Rooftop",
] as const;

export function buildStore(overrides: Partial<Store> = {}): Store {
  const idx = counter % STORE_NAMES.length;
  return {
    id: nextId("store"),
    name: STORE_NAMES[idx],
    location: STORE_LOCATIONS[idx],
    status: "online",
    temperature: Number((2 + Math.random() * 4).toFixed(1)),
    lastPing: recentTimestamp(Math.random() / 60),
    uptime: Number((95 + Math.random() * 5).toFixed(1)),
    revenue24h: Number((50 + Math.random() * 200).toFixed(2)),
    ...overrides,
  };
}

export function buildStoreList(count: number = 6): readonly Store[] {
  return Array.from({ length: count }, () => buildStore());
}

// ---------------------------------------------------------------------------
// InventoryItem factory
// ---------------------------------------------------------------------------

const PRODUCTS = [
  { name: "Coca-Cola 355ml", category: "beverages", price: 2.5, capacity: 12 },
  {
    name: "Sparkling Water 500ml",
    category: "beverages",
    price: 1.75,
    capacity: 15,
  },
  { name: "Turkey Club Sandwich", category: "food", price: 6.99, capacity: 8 },
  { name: "Greek Yogurt Cup", category: "dairy", price: 3.25, capacity: 10 },
  { name: "Mixed Nuts 100g", category: "snacks", price: 4.5, capacity: 20 },
  { name: "Energy Bar", category: "snacks", price: 2.99, capacity: 24 },
  {
    name: "Cold Brew Coffee 350ml",
    category: "beverages",
    price: 4.25,
    capacity: 10,
  },
  {
    name: "Fresh Orange Juice 300ml",
    category: "beverages",
    price: 3.99,
    capacity: 8,
  },
] as const;

export function buildInventoryItem(
  overrides: Partial<InventoryItem> = {},
): InventoryItem {
  const product = randomFrom(PRODUCTS);
  const capacity = overrides.capacity ?? product.capacity;
  return {
    id: nextId("item"),
    storeId: "store-001",
    productName: product.name,
    category: product.category,
    currentStock: Math.floor(Math.random() * capacity),
    capacity,
    price: product.price,
    lastRestocked: recentTimestamp(12 + Math.random() * 48),
    ...overrides,
  };
}

export function buildInventoryList(
  storeId: string,
  count: number = 6,
): readonly InventoryItem[] {
  return Array.from({ length: count }, () => buildInventoryItem({ storeId }));
}

// ---------------------------------------------------------------------------
// Alert factory
// ---------------------------------------------------------------------------

const SEVERITIES: readonly AlertSeverity[] = [
  "info",
  "warning",
  "critical",
] as const;

const CATEGORIES: readonly AlertCategory[] = [
  "sensor-offline",
  "low-stock",
  "temperature-warning",
  "door-ajar",
  "power-issue",
] as const;

const ALERT_MESSAGES: Record<AlertCategory, readonly string[]> = {
  "sensor-offline": [
    "Temperature sensor not responding for 15 minutes",
    "Door sensor lost connection",
  ],
  "low-stock": [
    "Coca-Cola stock below 20%",
    "Turkey Club Sandwich out of stock",
    "Energy Bar stock at 1 unit",
  ],
  "temperature-warning": [
    "Internal temperature reached 8.2°C (threshold: 7°C)",
    "Cooling system running above normal duty cycle",
  ],
  "door-ajar": [
    "Door open for more than 60 seconds",
    "Door seal integrity check failed",
  ],
  "power-issue": [
    "Running on battery backup",
    "Voltage fluctuation detected on main feed",
  ],
};

export function buildAlert(overrides: Partial<Alert> = {}): Alert {
  const category = overrides.category ?? randomFrom(CATEGORIES);
  const messages = ALERT_MESSAGES[category];
  return {
    id: nextId("alert"),
    storeId: "store-001",
    severity: randomFrom(SEVERITIES),
    category,
    message: randomFrom(messages),
    timestamp: recentTimestamp(Math.random() * 24),
    acknowledged: false,
    ...overrides,
  };
}

export function buildAlertList(
  storeId: string,
  count: number = 4,
): readonly Alert[] {
  return Array.from({ length: count }, () => buildAlert({ storeId }));
}

// ---------------------------------------------------------------------------
// ActivityEvent factory
// ---------------------------------------------------------------------------

const ACTIVITY_TYPES: readonly ActivityType[] = [
  "restock",
  "maintenance",
  "alert-acknowledged",
  "status-change",
  "price-update",
] as const;

const ACTIVITY_DESCRIPTIONS: Record<ActivityType, readonly string[]> = {
  restock: [
    "Restocked 12 units of Coca-Cola 355ml",
    "Restocked 8 units of Turkey Club Sandwich",
    "Full restock completed — 47 items added",
  ],
  maintenance: [
    "Replaced cooling fan motor",
    "Cleaned condenser coils",
    "Firmware updated to v2.4.1",
  ],
  "alert-acknowledged": [
    "Acknowledged low-stock alert for Energy Bar",
    "Acknowledged temperature warning — technician dispatched",
  ],
  "status-change": [
    "Store status changed from offline to online",
    "Store status changed from online to degraded",
  ],
  "price-update": [
    "Updated Cold Brew Coffee price: $4.25 → $3.99",
    "Seasonal pricing applied to 5 items",
  ],
};

const ACTORS = [
  "operator@micromart.com",
  "tech-support@micromart.com",
  "admin@micromart.com",
  "field-ops@micromart.com",
] as const;

export function buildActivityEvent(
  overrides: Partial<ActivityEvent> = {},
): ActivityEvent {
  const type = overrides.type ?? randomFrom(ACTIVITY_TYPES);
  const descriptions = ACTIVITY_DESCRIPTIONS[type];
  return {
    id: nextId("activity"),
    storeId: "store-001",
    type,
    description: randomFrom(descriptions),
    timestamp: recentTimestamp(Math.random() * 72),
    actor: randomFrom(ACTORS),
    ...overrides,
  };
}

export function buildActivityList(
  storeId: string,
  count: number = 5,
): readonly ActivityEvent[] {
  return Array.from({ length: count }, () => buildActivityEvent({ storeId }));
}

// ---------------------------------------------------------------------------
// Reset counter (useful between test suites for deterministic IDs)
// ---------------------------------------------------------------------------

export function resetFactoryCounter(): void {
  counter = 0;
}
