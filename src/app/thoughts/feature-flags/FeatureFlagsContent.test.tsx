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
      screen.getByRole("heading", { level: 1, name: "Feature Flags" }),
    ).toBeInTheDocument();
  });

  it("explains the engine-first, deterministic design", () => {
    render(<FeatureFlagsContent />);
    expect(
      screen.getByRole("heading", { name: /deterministic bucketing/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/FNV-1a/).length).toBeGreaterThan(0);
  });

  it("documents the transparency UI: live API, resets, and sign-in-to-change", () => {
    render(<FeatureFlagsContent />);
    expect(
      screen.getByRole("heading", { name: /telling the truth in the ui/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/resets in/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/sign in to change flags/i).length).toBeGreaterThan(
      0,
    );
  });

  it("documents gating a real feature behind a visitor-keyed flag", () => {
    render(<FeatureFlagsContent />);
    expect(
      screen.getByRole("heading", { name: /gating a real feature/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/pocket-tcg/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/visitor_id/i).length).toBeGreaterThan(0);
  });

  it("documents the stale-verdict race and the client-side evaluation fix", () => {
    render(<FeatureFlagsContent />);
    expect(
      screen.getByRole("heading", { name: /the verdict that lied/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/read-your-writes/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/evaluateAllFlags/).length).toBeGreaterThan(0);
  });
});
