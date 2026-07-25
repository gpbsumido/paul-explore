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

  it("lets you type into the fields", () => {
    render(<AuthFlowsDemo feature={feature} />);
    const email = screen.getByLabelText("Email");
    fireEvent.change(email, { target: { value: "me@example.com" } });
    expect(email).toHaveValue("me@example.com");
  });

  it("shows an inline validation message for a bad email", () => {
    render(<AuthFlowsDemo feature={feature} />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "nope" } });
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  });

  it("flags mismatched passwords on the reset screen", () => {
    render(<AuthFlowsDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "hunter2secret" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "different" },
    });
    expect(screen.getByText(/must match/i)).toBeInTheDocument();
  });
});
