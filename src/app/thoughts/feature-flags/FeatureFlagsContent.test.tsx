import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import FeatureFlagsContent from "./FeatureFlagsContent";

vi.mock("@/components/PageHeader", () => ({
  default: () => null,
}));

describe("FeatureFlagsContent", () => {
  it("renders the write-up heading", () => {
    render(<FeatureFlagsContent />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Feature Flags Service" }),
    ).toBeInTheDocument();
  });

  it("explains the reset cron that restores the demo seed", () => {
    render(<FeatureFlagsContent />);
    expect(
      screen.getByRole("heading", { name: /reset cron/i }),
    ).toBeInTheDocument();
  });

  it("documents the authed PATCH endpoint and its audit trail", () => {
    render(<FeatureFlagsContent />);
    expect(screen.getAllByText(/checkJwt/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/audit/i).length).toBeGreaterThan(0);
  });
});
