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
});
