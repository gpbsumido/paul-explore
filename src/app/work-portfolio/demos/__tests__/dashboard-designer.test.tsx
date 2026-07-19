import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import DashboardDesignerDemo from "../dashboard-designer";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("dashboard-designer")!];

describe("dashboard designer demo", () => {
  it("adds a widget from the palette", () => {
    render(<DashboardDesignerDemo feature={feature} />);
    const canvas = screen.getByLabelText("Dashboard canvas");
    const before = within(canvas).queryAllByText("KPI tile").length;
    fireEvent.click(screen.getByRole("button", { name: "KPI tile" }));
    expect(within(canvas).queryAllByText("KPI tile").length).toBe(before + 1);
  });

  it("removes a widget", () => {
    render(<DashboardDesignerDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove Sessions" }));
    expect(screen.queryByText("Sessions")).toBeNull();
  });

  it("shows the empty state when all widgets are removed", () => {
    render(<DashboardDesignerDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove Active players" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Sessions" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Revenue by day" }));
    expect(screen.getByText(/empty canvas/)).toBeInTheDocument();
  });
});
