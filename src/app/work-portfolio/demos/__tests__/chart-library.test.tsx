import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import ChartLibraryDemo from "../chart-library";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("chart-library")!];

describe("chart library demo", () => {
  it("renders the chart gallery with named figures", () => {
    render(<ChartLibraryDemo feature={feature} />);
    expect(screen.getByText("Growth curve")).toBeInTheDocument();
    expect(screen.getByText("Conversion funnel")).toBeInTheDocument();
    expect(screen.getByText("Retention")).toBeInTheDocument();
    expect(screen.getByText("Revenue mix")).toBeInTheDocument();
  });

  it("counts up re-rolls when the reroll button is clicked", () => {
    render(<ChartLibraryDemo feature={feature} />);
    expect(screen.getByText(/re-rolled 0 times/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reroll data" }));
    expect(screen.getByText(/re-rolled 1 times/)).toBeInTheDocument();
  });
});
