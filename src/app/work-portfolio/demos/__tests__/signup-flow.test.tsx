import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SignupFlowDemo from "../signup-flow";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("signup-flow")!];

describe("signup flow demo", () => {
  it("walks forward and back through the steps", () => {
    render(<SignupFlowDemo feature={feature} />);
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Sam" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "sam@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByLabelText("Make & model")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
  });

  it("blocks advancing past a step with missing or bad fields", () => {
    render(<SignupFlowDemo feature={feature} />);
    // empty contact step, Next should not advance
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getAllByText("Required").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    // bad email is caught too
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Sam" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "nope" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
  });

  it("completes and shows the attribution on submit", () => {
    render(<SignupFlowDemo feature={feature} />);
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Sam Rivera" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "sam@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.change(screen.getByLabelText("Make & model"), { target: { value: "Civic" } });
    fireEvent.change(screen.getByLabelText("License plate"), { target: { value: "ABC123" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Sam Rivera")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(screen.getByText(/Welcome aboard/)).toBeInTheDocument();
    expect(screen.getByText("spring-drive")).toBeInTheDocument();
  });
});
