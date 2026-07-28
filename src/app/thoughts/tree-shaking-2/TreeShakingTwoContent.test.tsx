import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TreeShakingTwoContent from "./TreeShakingTwoContent";
import { THOUGHTS } from "@/app/_shared/featureData";
import { groupThoughts } from "@/app/_shared/thoughtCategories";

vi.mock("@/components/PageHeader", () => ({
  default: () => null,
}));

describe("TreeShakingTwoContent", () => {
  it("renders the write-up heading", () => {
    render(<TreeShakingTwoContent />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /tree shaking, round 2/i,
      }),
    ).toBeInTheDocument();
  });

  it("frames the pass as starting from green dead-code checks", () => {
    render(<TreeShakingTwoContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/depcheck/);
    expect(body).toMatch(/ts-prune/);
    expect(body).toMatch(/green/i);
  });

  it("names the barrel packages Next does not optimize by default", () => {
    render(<TreeShakingTwoContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/optimizePackageImports/);
    expect(body).toMatch(/@paul-portfolio\/react/);
    expect(body).toMatch(/@react-three\/drei/);
    expect(body).toMatch(/@unovis\/react/);
  });

  it("reports the measured bundle reduction with a baseline", () => {
    render(<TreeShakingTwoContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/13,468/);
    expect(body).toMatch(/13,320/);
    expect(body).toMatch(/148/);
  });

  it("documents the web-vitals check and the LCP soft spot", () => {
    render(<TreeShakingTwoContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/Lighthouse/);
    expect(body).toMatch(/LCP/);
    expect(body).toMatch(/unused JavaScript/i);
  });

  it("explains the LCP fix: moving the entrance reveal off the JS bundle", () => {
    render(<TreeShakingTwoContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/opacity:0/);
    expect(body).toMatch(/hydrat/i);
    expect(body).toMatch(/CSS/);
  });

  it("documents the operator recharts lazy-load as the clean unused-JS trim", () => {
    render(<TreeShakingTwoContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/recharts/);
    expect(body).toMatch(/collapsed/i);
    expect(body).toMatch(/118 KiB.*70 KiB|118.*70/);
  });

  it("records the lab-vs-field divergence, and that the field number won", () => {
    render(<TreeShakingTwoContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/simulation/i);
    expect(body).toMatch(/4284 ms/);
    expect(body).toMatch(/1712 ms/);
  });
});

describe("tree-shaking-2 write-up registration", () => {
  it("is listed in the Performance category", () => {
    const group = groupThoughts(THOUGHTS).find((g) => g.name === "Performance");
    expect(
      group?.items.some((t) => t.href === "/thoughts/tree-shaking-2"),
    ).toBe(true);
  });
});
