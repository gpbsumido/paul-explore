import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StandardAnalyticsDemo from "../standard-analytics";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("standard-analytics")!];

describe("standard analytics demo", () => {
  it("swaps KPI labels when a tab is selected", () => {
    render(<StandardAnalyticsDemo feature={feature} />);
    expect(screen.getByText("DAU")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "On-chain" }));
    expect(screen.getByText("Wallets")).toBeInTheDocument();
    expect(screen.queryByText("DAU")).toBeNull();
  });

  it("selects a metric by clicking its KPI card", () => {
    render(<StandardAnalyticsDemo feature={feature} />);
    const sessions = screen.getByRole("button", { name: /Sessions/ });
    fireEvent.click(sessions);
    expect(sessions).toHaveAttribute("aria-pressed", "true");
    // the chart caption reflects the selected metric
    expect(screen.getByText(/Sessions over 30 days/)).toBeInTheDocument();
  });

  it("changes the range filter", () => {
    render(<StandardAnalyticsDemo feature={feature} />);
    const seven = screen.getByRole("button", { name: "7d" });
    fireEvent.click(seven);
    expect(seven).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/over 7 days/)).toBeInTheDocument();
  });

  it("filters by segment", () => {
    render(<StandardAnalyticsDemo feature={feature} />);
    fireEvent.change(screen.getByLabelText("Segment"), {
      target: { value: "New" },
    });
    expect(screen.getByText(/· New/)).toBeInTheDocument();
  });
});
