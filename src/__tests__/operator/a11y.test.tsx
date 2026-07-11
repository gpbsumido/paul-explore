import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "@/test/a11y";
import { buildStore } from "@/test/factories/operator";
import AlertSummaryBanner from "@/components/operator/AlertSummaryBanner";
import FleetStatsBar from "@/components/operator/FleetStatsBar";
import StockBar from "@/components/operator/StockBar";
import Bone from "@/components/operator/Bone";
import ToastNotification from "@/components/operator/ToastNotification";
import RefreshBar from "@/components/operator/RefreshBar";
import AlertTrendChart from "@/components/operator/AlertTrendChart";
import FleetHealthChart from "@/components/operator/FleetHealthChart";
import InventoryComparisonChart from "@/components/operator/InventoryComparisonChart";
import type { FleetStats } from "@/lib/operator-utils";
import type { AlertTrendBucket } from "@/types/operator";

// ---------------------------------------------------------------------------
// Mocks — operator components pull from react-query / next/navigation
// ---------------------------------------------------------------------------

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    getQueriesData: () => [],
    getQueryState: () => null,
    invalidateQueries: vi.fn(),
  }),
  useIsFetching: () => 0,
}));

vi.mock("@/contexts/ToastContext", () => ({
  useToast: () => ({
    toasts: [
      { id: "t1", message: "Store refreshed", variant: "success" as const },
    ],
    removeToast: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

function makeFleetStats(): FleetStats {
  return {
    totalStores: 8,
    needsAttention: 2,
    lowStockItems: 5,
    avgInventoryHealth: 72,
    criticalAlerts: 1,
    warningAlerts: 3,
  };
}

function makeTrendData(): readonly AlertTrendBucket[] {
  return [
    { hour: "00:00", count: 2 },
    { hour: "06:00", count: 5 },
    { hour: "12:00", count: 3 },
    { hour: "18:00", count: 1 },
  ];
}

// ---------------------------------------------------------------------------
// AlertSummaryBanner
// ---------------------------------------------------------------------------

describe("AlertSummaryBanner accessibility", () => {
  it("has no axe violations", async () => {
    const { container } = render(
      <AlertSummaryBanner
        criticalCount={2}
        warningCount={5}
        onFilterCritical={vi.fn()}
        onFilterWarning={vi.fn()}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ---------------------------------------------------------------------------
// FleetStatsBar
// ---------------------------------------------------------------------------

describe("FleetStatsBar accessibility", () => {
  it("has no axe violations", async () => {
    const { container } = render(<FleetStatsBar stats={makeFleetStats()} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ---------------------------------------------------------------------------
// StockBar
// ---------------------------------------------------------------------------

describe("StockBar accessibility", () => {
  it("has no axe violations for healthy stock", async () => {
    const { container } = render(<StockBar currentStock={10} capacity={12} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no axe violations for critical stock", async () => {
    const { container } = render(<StockBar currentStock={1} capacity={12} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("exposes stock level via meter role", () => {
    render(<StockBar currentStock={8} capacity={12} />);
    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "8");
    expect(meter).toHaveAttribute("aria-valuemax", "12");
  });
});

// ---------------------------------------------------------------------------
// Bone (skeleton)
// ---------------------------------------------------------------------------

describe("Bone accessibility", () => {
  it("is hidden from the accessibility tree", () => {
    const { container } = render(<Bone style={{ height: 20, width: 100 }} />);
    const bone = container.firstElementChild!;
    expect(bone).toHaveAttribute("aria-hidden", "true");
  });
});

// ---------------------------------------------------------------------------
// ToastNotification
// ---------------------------------------------------------------------------

describe("ToastNotification accessibility", () => {
  it("has no axe violations", async () => {
    const { container } = render(<ToastNotification />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("uses an aria-live region", () => {
    render(<ToastNotification />);
    const region = screen.getByRole("region", { name: "Notifications" });
    expect(region).toHaveAttribute("aria-live", "polite");
  });
});

// ---------------------------------------------------------------------------
// RefreshBar
// ---------------------------------------------------------------------------

describe("RefreshBar accessibility", () => {
  it("has no axe violations", async () => {
    const { container } = render(<RefreshBar />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("uses a status role with aria-live", () => {
    render(<RefreshBar />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
  });
});

// ---------------------------------------------------------------------------
// Chart components
// ---------------------------------------------------------------------------

describe("AlertTrendChart accessibility", () => {
  it("has no axe violations", async () => {
    const { container } = render(<AlertTrendChart data={makeTrendData()} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("provides a text alternative via role=img and aria-label", () => {
    render(<AlertTrendChart data={makeTrendData()} />);
    const chart = screen.getByRole("img");
    expect(chart.getAttribute("aria-label")).toContain("11 total alerts");
    expect(chart.getAttribute("aria-label")).toContain("peak of 5 at 06:00");
  });
});

describe("FleetHealthChart accessibility", () => {
  it("has no axe violations", async () => {
    const stores = [
      buildStore({ status: "online" }),
      buildStore({ status: "online" }),
      buildStore({ status: "degraded" }),
    ];
    const { container } = render(<FleetHealthChart stores={stores} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("provides a text alternative via role=img", () => {
    const stores = [
      buildStore({ status: "online" }),
      buildStore({ status: "degraded" }),
    ];
    render(<FleetHealthChart stores={stores} />);
    const chart = screen.getByRole("img");
    expect(chart).toHaveAttribute("aria-label");
    expect(chart.getAttribute("aria-label")).toContain("Fleet health");
  });
});

describe("InventoryComparisonChart accessibility", () => {
  const data = [
    { name: "Store A", health: 85 },
    { name: "Store B", health: 45 },
    { name: "Store C", health: 20 },
  ];

  it("has no axe violations", async () => {
    const { container } = render(<InventoryComparisonChart data={data} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("provides a text alternative listing each store", () => {
    render(<InventoryComparisonChart data={data} />);
    const chart = screen.getByRole("img");
    const label = chart.getAttribute("aria-label")!;
    expect(label).toContain("Store A: 85%");
    expect(label).toContain("Store B: 45%");
    expect(label).toContain("Store C: 20%");
  });
});
