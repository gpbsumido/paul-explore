import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SlugDashboardsDemo from "../slug-dashboards";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("slug-dashboards")!];

describe("slug dashboards demo", () => {
  it("reshapes the dashboard when the slug changes", () => {
    render(<SlugDashboardsDemo feature={feature} />);
    expect(screen.getByText("Fleet Overview")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Dashboard slug"), {
      target: { value: "economy" },
    });
    expect(screen.getByText("Economy Snapshot")).toBeInTheDocument();
    // economy config has a Fees tile that overview doesn't
    expect(screen.getByText("Fees")).toBeInTheDocument();
    expect(screen.queryByText("Fleet Overview")).toBeNull();
  });

  it("shows the JSON config for the active slug", () => {
    render(<SlugDashboardsDemo feature={feature} />);
    const config = () => screen.getByTestId("json-view").textContent ?? "";
    expect(config()).toContain('"slug": "overview"');
    fireEvent.change(screen.getByLabelText("Dashboard slug"), {
      target: { value: "economy" },
    });
    expect(config()).toContain('"slug": "economy"');
    expect(config()).not.toContain('"slug": "overview"');
  });
});
