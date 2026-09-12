import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { groupThoughts } from "@/app/_shared/thoughtCategories";
import { THOUGHTS } from "@/app/_shared/featureData";
import RiskScoringApiContent from "./RiskScoringApiContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("RiskScoringApiContent", () => {
  it("renders the write-up heading", () => {
    render(<RiskScoringApiContent />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("is filed under Architecture & Backend, not left uncategorized", () => {
    const group = groupThoughts(THOUGHTS).find((g) =>
      g.items.some((t) => t.href === "/thoughts/risk-scoring-api"),
    );
    expect(group?.name).toBe("Architecture & Backend");
  });

  it("explains the rules engine behind one interface", () => {
    render(<RiskScoringApiContent />);
    expect(screen.getAllByText(/Rule/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/velocity/i).length).toBeGreaterThan(0);
  });

  it("documents the score bands and the live flagged feed", () => {
    render(<RiskScoringApiContent />);
    expect(screen.getAllByText(/amber/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/server-sent events|SSE/i).length).toBeGreaterThan(
      0,
    );
  });

  it("closes with a WhatsNext block naming the Postgres seam", () => {
    render(<RiskScoringApiContent />);
    expect(screen.getAllByText(/Postgres/i).length).toBeGreaterThan(0);
  });

  it("is written as someone new to Go, not as a Go veteran", () => {
    render(<RiskScoringApiContent />);
    expect(screen.queryAllByText(/new to Go/i).length).toBeGreaterThan(0);
  });

  it("names the Go concepts it teaches along the way", () => {
    render(<RiskScoringApiContent />);
    expect(screen.queryAllByText(/goroutine/i).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/mutex/i).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/channel/i).length).toBeGreaterThan(0);
  });

  it("lets the reader score a transaction from the page", () => {
    render(<RiskScoringApiContent />);
    expect(
      screen.getByRole("button", { name: /score this transaction/i }),
    ).toBeInTheDocument();
  });

  it("carries the dated update documenting the reframe and the demo", () => {
    render(<RiskScoringApiContent />);
    expect(screen.queryAllByText(/September 11, 2026/).length).toBeGreaterThan(
      0,
    );
  });

  it("carries the dated update on the nil-slice bug the live demo found", () => {
    render(<RiskScoringApiContent />);
    expect(screen.queryAllByText(/September 12, 2026/).length).toBeGreaterThan(
      0,
    );
    expect(screen.queryAllByText(/nil slice/i).length).toBeGreaterThan(0);
  });

  it("teaches the risk vocabulary, not just the implementation", () => {
    render(<RiskScoringApiContent />);
    expect(screen.queryAllByText(/false positive/i).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/risk appetite/i).length).toBeGreaterThan(0);
  });
});
