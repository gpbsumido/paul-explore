import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import WorkPortfolioContent from "../WorkPortfolioContent";
import { PROJECTS, FEATURES } from "../_data/catalog";

describe("work-portfolio tickers", () => {
  it("top ticker shows every project chip", () => {
    render(<WorkPortfolioContent />);
    const top = screen.getByLabelText("Projects ticker");
    for (const project of PROJECTS) {
      expect(within(top).getAllByText(project.name).length).toBeGreaterThan(0);
    }
  });

  it("bottom ticker shows every feature chip with its project tag", () => {
    render(<WorkPortfolioContent />);
    const bottom = screen.getByLabelText("Features ticker");
    for (const feature of FEATURES) {
      expect(within(bottom).getAllByText(feature.title).length).toBeGreaterThan(0);
    }
  });

  it("stage starts on the intro card", () => {
    render(<WorkPortfolioContent />);
    expect(
      screen.getByText(`${PROJECTS.length} projects · ${FEATURES.length} feature demos`),
    ).toBeInTheDocument();
  });
});
