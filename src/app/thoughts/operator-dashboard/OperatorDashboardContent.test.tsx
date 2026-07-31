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
