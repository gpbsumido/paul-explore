import { describe, it, expect, vi, afterEach } from "vitest";
import {
  loadStores,
  loadFleetSummary,
  loadSalesAnalytics,
  applyDismiss,
} from "./operator-bff";
import { OperatorApiError } from "./operator-client";
import { buildStore, buildAlert } from "@/test/factories/operator";

vi.mock("./operator-client", async () => {
  const actual =
    await vi.importActual<typeof import("./operator-client")>(
      "./operator-client",
    );
  return {
    ...actual,
    fetchStores: vi.fn(),
    fetchFleetSummary: vi.fn(),
    fetchSalesAnalytics: vi.fn(),
    patchDismiss: vi.fn(),
  };
});

import {
  fetchStores,
  fetchFleetSummary,
  fetchSalesAnalytics,
  patchDismiss,
} from "./operator-client";

afterEach(() => vi.clearAllMocks());

describe("loadStores", () => {
  it("returns the live API stores when the API answers", async () => {
    const store = buildStore({ name: "From API" });
    vi.mocked(fetchStores).mockResolvedValue([store]);

    const stores = await loadStores();

    expect(stores.map((s) => s.name)).toEqual(["From API"]);
  });

  it("falls back to the seed fleet when the API is unreachable", async () => {
    vi.mocked(fetchStores).mockRejectedValue(new Error("ECONNREFUSED"));

    const stores = await loadStores();

    expect(stores.length).toBeGreaterThan(0);
  });
});

describe("loadFleetSummary", () => {
  it("prefers the API summary", async () => {
    vi.mocked(fetchFleetSummary).mockResolvedValue({
      summaries: [
        {
          storeId: "s1",
          alertCount: 2,
          inventoryHealth: 80,
          hasCritical: true,
          hasWarning: false,
        },
      ],
      fleetStats: {
        criticalAlerts: 1,
        warningAlerts: 0,
        lowStockItems: 0,
        avgInventoryHealth: 80,
      },
      alertTrend: [],
    });

    const summary = await loadFleetSummary();

    expect(summary.summaries[0].storeId).toBe("s1");
  });

  it("falls back to a seed-computed summary when the API is down", async () => {
    vi.mocked(fetchFleetSummary).mockRejectedValue(new Error("down"));

    const summary = await loadFleetSummary();

    expect(summary.summaries.length).toBeGreaterThan(0);
    expect(summary.alertTrend.length).toBeGreaterThan(0);
  });
});

describe("loadSalesAnalytics", () => {
  it("falls back to the seed aggregation when the API is down", async () => {
    vi.mocked(fetchSalesAnalytics).mockRejectedValue(new Error("down"));

    const result = await loadSalesAnalytics("month");

    expect(result.granularity).toBe("month");
    expect(result.byStore.length).toBeGreaterThan(0);
  });
});

describe("applyDismiss", () => {
  it("returns the dismissed alert from the API", async () => {
    const alert = buildAlert({ acknowledged: true });
    vi.mocked(patchDismiss).mockResolvedValue(alert);

    const result = await applyDismiss(alert.id);

    expect(result?.acknowledged).toBe(true);
  });

  it("falls back to the seed on an API error; unknown ids stay undefined (route 404s)", async () => {
    vi.mocked(patchDismiss).mockRejectedValue(new OperatorApiError(404));

    // Falls back to seed.dismissAlert, which returns undefined for an id the
    // seed doesn't have — so an unknown alert still surfaces as a 404.
    const result = await applyDismiss("missing");

    expect(result).toBeUndefined();
  });
});
