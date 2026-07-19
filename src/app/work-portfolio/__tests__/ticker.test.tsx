import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import WorkPortfolioContent from "../WorkPortfolioContent";
import { PROJECTS, FEATURES } from "../_data/catalog";

/** Stub matchMedia so the reduced-motion hook sees the given preference. */
function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

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

  it("marquee duplicates the strip for a seamless loop", () => {
    stubReducedMotion(false);
    render(<WorkPortfolioContent />);
    const top = screen.getByLabelText("Projects ticker");
    // two copies: the visible one and the aria-hidden clone
    expect(within(top).getAllByText(PROJECTS[0].name)).toHaveLength(2);
  });

  it("tickers travel in opposite directions", () => {
    stubReducedMotion(false);
    render(<WorkPortfolioContent />);
    const top = screen.getByLabelText("Projects ticker");
    const bottom = screen.getByLabelText("Features ticker");
    expect(top.querySelector("[data-direction]")).toHaveAttribute(
      "data-direction",
      "left",
    );
    expect(bottom.querySelector("[data-direction]")).toHaveAttribute(
      "data-direction",
      "right",
    );
  });

  it("prefers-reduced-motion renders a single static copy", () => {
    stubReducedMotion(true);
    render(<WorkPortfolioContent />);
    const top = screen.getByLabelText("Projects ticker");
    expect(within(top).getAllByText(PROJECTS[0].name)).toHaveLength(1);
    expect(top.querySelector("[data-direction]")).toBeNull();
  });
});

describe("ticker selection", () => {
  it("clicking a feature chip selects that feature on the stage", () => {
    render(<WorkPortfolioContent />);
    const bottom = screen.getByLabelText("Features ticker");
    const chip = within(bottom).getAllByRole("button", {
      name: `Feature: ${FEATURES[3].title}`,
    })[0];
    fireEvent.click(chip);
    expect(
      screen.getByRole("heading", { name: FEATURES[3].title }),
    ).toBeInTheDocument();
    expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking a project chip jumps to its first feature and syncs rings", () => {
    render(<WorkPortfolioContent />);
    const top = screen.getByLabelText("Projects ticker");
    const project = PROJECTS[9];
    const chip = within(top).getAllByRole("button", {
      name: `Project: ${project.name}`,
    })[0];
    fireEvent.click(chip);

    const firstFeature = FEATURES.find((f) => f.projectId === project.id)!;
    expect(
      screen.getByRole("heading", { name: firstFeature.title }),
    ).toBeInTheDocument();
    // the owning project chip lights up too
    expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  it("touchstart freezes the marquee so a tap can land", () => {
    stubReducedMotion(false);
    render(<WorkPortfolioContent />);
    const top = screen.getByLabelText("Projects ticker");
    fireEvent.touchStart(top);
    expect(top.querySelector("[data-paused]")).not.toBeNull();
  });
});
