import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import OperatorDashboardContent from "./OperatorDashboardContent";
import { THOUGHTS } from "@/app/_shared/featureData";
import { groupThoughts } from "@/app/_shared/thoughtCategories";

vi.mock("@/components/PageHeader", () => ({
  default: () => null,
}));

describe("OperatorDashboardContent", () => {
  it("renders the write-up heading", () => {
    render(<OperatorDashboardContent />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /operator dashboard/i,
      }),
    ).toBeInTheDocument();
  });

  it("carries a dated continuation section for today's update", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/July 31, 2026/);
    expect(body).toMatch(/continuation/i);
  });

  it("has a timeline at the top linking down to the update", () => {
    render(<OperatorDashboardContent />);
    const link = screen.getByRole("link", {
      name: /running the store: arrangement, sales history, tax calculator/i,
    });
    expect(link).toHaveAttribute("href", "#update-2026-07-31");
  });

  it("documents the tax-to-remit summary", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/summarizeRemittance/);
    expect(body).toMatch(/how much do I owe/i);
  });

  it("has a timeline entry linking to the interactive-planogram update", () => {
    render(<OperatorDashboardContent />);
    const link = screen.getByRole("link", {
      name: /interactive planogram: rearrange slots and re-sync sensors/i,
    });
    expect(link).toHaveAttribute("href", "#update-2026-07-31-planogram");
  });

  it("documents the interactive planogram: reorder, re-sync, and persistence", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/moveSlot/);
    expect(body).toMatch(/assemblePlanogram/);
    expect(body).toMatch(/Re-sync/);
    expect(body).toMatch(/persist/i);
  });

  it("has a timeline entry linking to the sales-analytics update", () => {
    render(<OperatorDashboardContent />);
    const link = screen.getByRole("link", {
      name: /sales analytics: day\/week\/month\/year, per store and fleet/i,
    });
    expect(link).toHaveAttribute("href", "#update-2026-07-31-analytics");
  });

  it("documents the sales analytics: ranges and the fleet rollup", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/salesByPeriod/);
    expect(body).toMatch(/aggregateFleetSales/);
    expect(body).toMatch(/sales-analytics/);
  });

  it("explains how calls are kept low and performant", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/one request/i);
    expect(body).toMatch(/zero requests/i);
    expect(body).toMatch(/optimistic/i);
  });

  it("has a timeline entry linking to the planogram-boxes update", () => {
    render(<OperatorDashboardContent />);
    const link = screen.getByRole("link", {
      name: /planogram boxes: move products into empty spots/i,
    });
    expect(link).toHaveAttribute("href", "#update-2026-07-31-boxes");
  });

  it("documents the planogram boxes model and moveToBox", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/moveToBox/);
    expect(body).toMatch(/empty box/i);
  });

  it("has a timeline entry linking to the backend-wiring update", () => {
    render(<OperatorDashboardContent />);
    const link = screen.getByRole("link", {
      name: /making it real: wiring the dashboard to a database/i,
    });
    expect(link).toHaveAttribute("href", "#update-2026-08-01-backend");
  });

  it("documents the BFF wiring to portfolio_api and the fallback", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/portfolio_api/);
    expect(body).toMatch(/operator-bff\.ts/);
    expect(body).toMatch(/falls back/i);
  });

  it("has a timeline entry linking to the pricing update", () => {
    render(<OperatorDashboardContent />);
    const link = screen.getByRole("link", {
      name: /pricing & promotions: a profit calculator per store/i,
    });
    expect(link).toHaveAttribute("href", "#update-2026-08-02-pricing");
  });

  it("documents the pricing calculator helpers and the derive-not-store choice", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/summarizePricing/);
    expect(body).toMatch(/promoPrice/);
    expect(body).toMatch(/volume holds/i);
  });

  it("documents the profit calculator: assumed margin and below-cost guard", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/summarizeProfit/);
    expect(body).toMatch(/gross margin/i);
    expect(body).toMatch(/below cost/i);
  });

  it("has a timeline entry linking to the alert-history update", () => {
    render(<OperatorDashboardContent />);
    const link = screen.getByRole("link", {
      name: /alert history, analytics, and keeping the demo honest/i,
    });
    expect(link).toHaveAttribute("href", "#update-2026-08-02-alerts");
  });

  it("documents the offline fix, the re-seed, and the alert history", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/always offline/i);
    expect(body).toMatch(/re-seed/i);
    expect(body).toMatch(/summarizeAlerts/);
  });

  it("documents the store-arrangement slot addressing and refill run", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/slotLabelFor/);
    expect(body).toMatch(/getRefillList/);
    expect(body).toMatch(/refill run/i);
  });

  it("documents the sales history helpers and route", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/summarizeSales/);
    expect(body).toMatch(/topSellingProducts/);
    expect(body).toMatch(/salesByDay/);
    expect(body).toMatch(/\/api\/operator\/stores\/\[storeId\]\/sales/);
  });

  it("documents the Canadian tax logic and the derive-not-store decision", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/GST\/HST\/PST/);
    expect(body).toMatch(/9\.975%/);
    expect(body).toMatch(/computeTax/);
    expect(body).toMatch(/derived from the sales data/i);
  });
});

describe("operator-dashboard write-up registration", () => {
  it("is listed in the Features category", () => {
    const group = groupThoughts(THOUGHTS).find((g) => g.name === "Features");
    expect(
      group?.items.some((t) => t.href === "/thoughts/operator-dashboard"),
    ).toBe(true);
  });
});
