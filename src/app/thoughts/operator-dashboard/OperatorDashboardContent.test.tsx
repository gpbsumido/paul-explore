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

  it("documents the timezone fix: the bug, the DST cases, and the fleet tradeoff", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/Micromart/);
    expect(body).toMatch(/8pm the previous evening/);
    expect(body).toMatch(/23 hours long/);
    expect(body).toMatch(/AT TIME ZONE/);
    expect(body).toMatch(/formatToParts/);
  });

  it("explains why the fleet chart picks a single timezone", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/partition of time/);
    expect(body).toMatch(/makes the number honest/);
  });

  it("documents the restock work: the fiction, the session, the 409", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/is a fiction/);
    expect(body).toMatch(/counted_qty/);
    expect(body).toMatch(/409/);
    expect(body).toMatch(/inventory is never written directly/i);
  });

  it("explains what happened to the old one-tap restock", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/six-step wizard/);
    expect(body).toMatch(/leaves the same trail as a walked shelf/);
  });

  it("documents the promotions work: derived status, no price mutation", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/price-update/);
    expect(body).toMatch(/No status column/);
    expect(body).toMatch(/No price mutation/);
    expect(body).toMatch(/before-and-after, not attribution/);
  });

  it("records paying back the mirrored-helper parity test debt", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/It exists now/);
    expect(body).toMatch(/just a comment/);
  });

  it("documents the migration ordering bug and the correction", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/42703/);
    expect(body).toMatch(/explicit column list/);
    expect(body).toMatch(/Expand\s+first, deploy second/);
  });

  it("records why auth was not added to the write endpoints", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/checkJwt/);
    expect(body).toMatch(/persisting nothing/);
    expect(body).toMatch(/rate limit/i);
  });

  it("owns up to getting the rate limiter wrong the first time", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/Then I got the limiter wrong/);
    expect(body).toMatch(/backend-for-frontend/);
    expect(body).toMatch(/trust proxy/);
  });

  it("documents closing the promotion performance loop", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/before and\s+during side by side/);
    expect(body).toMatch(/no baseline/);
    expect(body).toMatch(/Zod strips unknown keys silently/);
  });

  it("explains why migrations are not run automatically on deploy", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/run migrations\s+automatically as part of the deploy/);
    expect(body).toMatch(/safe to run\s+against the currently deployed code/);
  });

  it("documents the service token and what it does not solve", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/authenticates a service, not a person/);
    expect(body).toMatch(/same hardcoded string for everybody/);
    expect(body).toMatch(/bearer secret/);
    expect(body).toMatch(/baffling partial outage/);
  });

  it("records the seed and fallback-test cleanups", () => {
    render(<OperatorDashboardContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/same sandwich\s+three times/);
    expect(body).toMatch(/three separate plans and written it zero times/);
  });

  it("has a timeline entry linking to the service-token update", () => {
    render(<OperatorDashboardContent />);
    const link = screen.getByRole("link", {
      name: /locking the writes without making anyone log in/i,
    });
    expect(link).toHaveAttribute("href", "#update-2026-08-02-service-token");
  });

  it("has a timeline entry linking to the hardening update", () => {
    render(<OperatorDashboardContent />);
    const link = screen.getByRole("link", {
      name: /the bit before merging, where i found out i was wrong/i,
    });
    expect(link).toHaveAttribute("href", "#update-2026-08-02-hardening");
  });

  it("has a timeline entry linking to the promotions update", () => {
    render(<OperatorDashboardContent />);
    const link = screen.getByRole("link", {
      name: /promotions: my calculator could predict/i,
    });
    expect(link).toHaveAttribute("href", "#update-2026-08-02-promotions");
  });

  it("has a timeline entry linking to the restocking update", () => {
    render(<OperatorDashboardContent />);
    const link = screen.getByRole("link", {
      name: /restocking: my one button was a fiction/i,
    });
    expect(link).toHaveAttribute("href", "#update-2026-08-02-restocking");
  });

  it("has a timeline entry linking to the timezone update", () => {
    render(<OperatorDashboardContent />);
    const link = screen.getByRole("link", {
      name: /timezones: i went looking for a missing feature/i,
    });
    expect(link).toHaveAttribute("href", "#update-2026-08-02-timezones");
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
