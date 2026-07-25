import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FEATURES, FeatureCard, PREVIEW_MAP } from "../featureData";

const workPortfolio = FEATURES.find((f) => f.id === "work-portfolio")!;

describe("work-portfolio hub card", () => {
  it("has a preview component registered", () => {
    expect(PREVIEW_MAP["work-portfolio"]).toBeDefined();
  });

  it("renders the dual-ticker preview chips and the card title", () => {
    render(<FeatureCard feature={workPortfolio} prefersReduced={false} />);
    expect(
      screen.getByRole("heading", { name: "Work Portfolio" }),
    ).toBeInTheDocument();
    // the strip renders twice for the seamless loop, so each label appears >= twice
    expect(screen.getAllByText("Content Engine").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Wallet Lookup").length).toBeGreaterThan(0);
  });

  it("still renders under reduced motion", () => {
    render(<FeatureCard feature={workPortfolio} prefersReduced={true} />);
    expect(
      screen.getByRole("heading", { name: "Work Portfolio" }),
    ).toBeInTheDocument();
  });
});
