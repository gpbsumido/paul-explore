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
});
