import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AuthFlowsDemo from "../auth-flows";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("auth-flows")!];

describe("auth flows demo", () => {
  it("steps through the identity screens", () => {
    render(<AuthFlowsDemo feature={feature} />);
    expect(screen.getByText("Sign in")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Verify email")).toBeInTheDocument();
  });

  it("jumps straight to a screen from the dots", () => {
    render(<AuthFlowsDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "Wallet passport" }));
    expect(screen.getByRole("button", { name: "Connect wallet" })).toBeInTheDocument();
  });
});
