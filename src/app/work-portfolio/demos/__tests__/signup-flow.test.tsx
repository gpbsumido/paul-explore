import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SignupFlowDemo from "../signup-flow";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("signup-flow")!];

describe("signup flow demo", () => {
  it("walks forward and back through the steps", () => {
    render(<SignupFlowDemo feature={feature} />);
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByLabelText("Make & model")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
  });

  it("carries entered values into the review step", () => {
    render(<SignupFlowDemo feature={feature} />);
    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "Sam Rivera" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Sam Rivera")).toBeInTheDocument();
  });
});
