import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AdminSuiteDemo from "../admin-suite";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("admin-suite")!];

describe("admin suite demo", () => {
  it("reveals the API key on demand", () => {
    render(<AdminSuiteDemo feature={feature} />);
    expect(screen.queryByText(/sk_live_9f2a/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    expect(screen.getByText(/sk_live_9f2a/)).toBeInTheDocument();
  });

  it("shows the members table with role chips", () => {
    render(<AdminSuiteDemo feature={feature} />);
    expect(screen.getByText("Ana P.")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
  });
});
