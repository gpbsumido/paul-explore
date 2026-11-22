import { describe, it, expect, vi, afterEach } from "vitest";
import { forgiveUnexpectedOutput } from "@/test/unexpectedOutput";
import {
  loadStores,
  loadFleetSummary,
  loadSalesAnalytics,
  applyDismiss,
  applyRestock,
  applyPlanogramUpdate,
  openRestockSession,
  saveRestockLine,
  applyRestockSession,
  createPromotion,
  stopPromotion,
} from "./operator-bff";
import {
  OperatorApiError,
  OperatorContractError,
  OperatorWriteTimeoutError,
} from "./operator-client";
import * as seed from "./operator-data";
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
    postRestock: vi.fn(),
    patchPlanogram: vi.fn(),
    postRestockSession: vi.fn(),
    putRestockLine: vi.fn(),
    postCompleteRestock: vi.fn(),
    postPromotion: vi.fn(),
    patchEndPromotion: vi.fn(),
  };
});

import {
  fetchStores,
  fetchFleetSummary,
  fetchSalesAnalytics,
  patchDismiss,
  postRestock,
  patchPlanogram,
  postRestockSession,
  putRestockLine,
  postCompleteRestock,
  postPromotion,
  patchEndPromotion,
} from "./operator-client";

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

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

    expect(stores.map((s) => s.id)).toEqual(seed.getStores().map((s) => s.id));
    expect(forgiveUnexpectedOutput()).toEqual([
      expect.stringContaining("loadStores fell back to seed data: ECONNREFUSED"),
    ]);
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

    expect(summary.summaries.map((row) => row.storeId)).toEqual(
      seed.getStores().map((store) => store.id),
    );
    expect(summary.alertTrend.length).toBeGreaterThan(0);
    expect(forgiveUnexpectedOutput()).toEqual([
      expect.stringContaining("loadFleetSummary fell back to seed data: down"),
    ]);
  });
});

describe("loadSalesAnalytics", () => {
  it("falls back to the seed aggregation when the API is down", async () => {
    vi.mocked(fetchSalesAnalytics).mockRejectedValue(new Error("down"));

    const result = await loadSalesAnalytics("month", "America/Toronto");

    expect(result.granularity).toBe("month");
    expect(result.byStore.map((row) => row.storeId).sort()).toEqual(
      seed.getStores().map((store) => store.id).sort(),
    );
    expect(forgiveUnexpectedOutput()).toEqual([
      expect.stringContaining("loadSalesAnalytics fell back to seed data: down"),
    ]);
  });
});

describe("applyDismiss", () => {
  it("returns the dismissed alert from the API", async () => {
    const alert = buildAlert({ acknowledged: true });
    vi.mocked(patchDismiss).mockResolvedValue(alert);

    const result = await applyDismiss(alert.id);

    expect(result?.acknowledged).toBe(true);
  });

});

/**
 * A seed alert nobody has dismissed yet. Each test takes its own, because the
 * seed is one in-memory store shared by the whole file and a fallback that does
 * run mutates it.
 */
const undismissedSeedAlert = (index: number) => {
  const alerts = seed
    .getStores()
    .flatMap((store) => seed.getAlerts(store.id) ?? [])
    .filter((alert) => !alert.acknowledged);
  expect(alerts.length).toBeGreaterThan(index);
  return alerts[index];
};

const isDismissedInSeed = (alertId: string) =>
  seed
    .getStores()
    .flatMap((store) => seed.getAlerts(store.id) ?? [])
    .some((alert) => alert.id === alertId && alert.acknowledged);

describe("a write the API answered never falls back to the seed", () => {
  it("treats an API 404 as not found instead of applying the write to the seed", async () => {
    const alert = undismissedSeedAlert(0);
    vi.mocked(patchDismiss).mockRejectedValue(new OperatorApiError(404));

    const result = await applyDismiss(alert.id);

    expect(result).toBeUndefined();
    expect(isDismissedInSeed(alert.id)).toBe(false);
  });

  it.each([400, 409, 500])(
    "passes an API %i back to the caller and leaves the seed alone",
    async (status) => {
      const alert = undismissedSeedAlert(0);
      vi.mocked(patchDismiss).mockRejectedValue(new OperatorApiError(status));

      await expect(applyDismiss(alert.id)).rejects.toMatchObject({ status });
      expect(isDismissedInSeed(alert.id)).toBe(false);
    },
  );

  it("reports an unreadable answer instead of replaying the write against the seed", async () => {
    const alert = undismissedSeedAlert(0);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(patchDismiss).mockRejectedValue(
      new OperatorContractError("/alerts/x/dismiss", new Error("bad shape")),
    );

    await expect(applyDismiss(alert.id)).rejects.toBeInstanceOf(OperatorContractError);
    expect(isDismissedInSeed(alert.id)).toBe(false);
  });

  it("reports a write that ran out of time instead of replaying it against the seed", async () => {
    const alert = undismissedSeedAlert(0);
    vi.mocked(patchDismiss).mockRejectedValue(new OperatorWriteTimeoutError("/alerts/x/dismiss"));

    await expect(applyDismiss(alert.id)).rejects.toBeInstanceOf(OperatorWriteTimeoutError);
    expect(isDismissedInSeed(alert.id)).toBe(false);
  });

  it("still falls back to the seed when the API never answered", async () => {
    const alert = undismissedSeedAlert(1);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(patchDismiss).mockRejectedValue(new TypeError("fetch failed"));

    const result = await applyDismiss(alert.id);

    expect(result?.acknowledged).toBe(true);
    expect(isDismissedInSeed(alert.id)).toBe(true);
  });

  const WRITES = [
    { name: "applyRestock", client: postRestock, run: () => applyRestock("store", ["item"]) },
    { name: "applyDismiss", client: patchDismiss, run: () => applyDismiss("alert") },
    {
      name: "applyPlanogramUpdate",
      client: patchPlanogram,
      run: () => applyPlanogramUpdate("store", { resyncItemId: "item" }),
    },
    { name: "openRestockSession", client: postRestockSession, run: () => openRestockSession("store") },
    {
      name: "saveRestockLine",
      client: putRestockLine,
      run: () => saveRestockLine("session", "item", { expectedQty: 1, countedQty: 1, added: 0, removed: 0, removalReason: null }),
    },
    { name: "applyRestockSession", client: postCompleteRestock, run: () => applyRestockSession("session", null) },
    {
      name: "createPromotion",
      client: postPromotion,
      run: () =>
        createPromotion("store", {
          productName: null,
          percent: 10,
          startsAt: "2026-07-01T00:00:00.000Z",
          endsAt: null,
        }),
    },
    { name: "stopPromotion", client: patchEndPromotion, run: () => stopPromotion("promotion") },
  ];

  it.each(WRITES)("$name passes a 409 through rather than falling back", async ({ client, run }) => {
    vi.mocked(client).mockRejectedValue(new OperatorApiError(409));

    await expect(run()).rejects.toMatchObject({ status: 409 });
  });
});
