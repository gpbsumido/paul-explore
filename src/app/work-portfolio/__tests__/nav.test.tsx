import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WorkPortfolioContent from "../WorkPortfolioContent";
import { FEATURES } from "../_data/catalog";
import { cycleIndex } from "../nav";

describe("cycleIndex", () => {
  it("steps forward and wraps at the end", () => {
    expect(cycleIndex(0, 1, 24)).toBe(1);
    expect(cycleIndex(23, 1, 24)).toBe(0);
  });

  it("steps back and wraps at the start", () => {
    expect(cycleIndex(5, -1, 24)).toBe(4);
    expect(cycleIndex(0, -1, 24)).toBe(23);
  });

  it("from intro, next lands on the first and prev on the last", () => {
    expect(cycleIndex(null, 1, 24)).toBe(0);
    expect(cycleIndex(null, -1, 24)).toBe(23);
  });
});

describe("stage arrows", () => {
  it("next from the intro selects the first feature", () => {
    render(<WorkPortfolioContent />);
    fireEvent.click(screen.getByRole("button", { name: "Next feature" }));
    expect(
      screen.getByRole("heading", { name: FEATURES[0].title }),
    ).toBeInTheDocument();
  });

  it("prev from the intro selects the last feature", () => {
    render(<WorkPortfolioContent />);
    fireEvent.click(screen.getByRole("button", { name: "Previous feature" }));
    expect(
      screen.getByRole("heading", { name: FEATURES[FEATURES.length - 1].title }),
    ).toBeInTheDocument();
  });

  it("wraps from the last feature back to the first", () => {
    render(<WorkPortfolioContent />);
    fireEvent.click(screen.getByRole("button", { name: "Previous feature" }));
    fireEvent.click(screen.getByRole("button", { name: "Next feature" }));
    expect(
      screen.getByRole("heading", { name: FEATURES[0].title }),
    ).toBeInTheDocument();
  });
});
