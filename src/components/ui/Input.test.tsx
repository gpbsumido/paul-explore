import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "@/test/a11y";
import Input from "./Input";

describe("Input accessibility", () => {
  describe("axe scans", () => {
    it("reports no violations with a visible label", async () => {
      const { container } = render(<Input label="Email" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("reports no violations with a visually hidden label", async () => {
      const { container } = render(
        <Input label="Search" hideLabel placeholder="Search..." />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("reports no violations in error state", async () => {
      const { container } = render(
        <Input label="Email" error="Email is required" />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("label association", () => {
    it("associates the label with the input via htmlFor/id", () => {
      render(<Input label="Username" />);
      expect(screen.getByLabelText("Username")).toBeInTheDocument();
    });

    it("associates a hidden label with the input", () => {
      render(<Input label="Search" hideLabel />);
      expect(screen.getByLabelText("Search")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("sets aria-invalid when an error is present", () => {
      render(<Input label="Email" error="Invalid email" />);
      expect(screen.getByLabelText("Email")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });

    it("does not set aria-invalid when no error", () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText("Email")).not.toHaveAttribute(
        "aria-invalid",
      );
    });

    it("links error message to the input via aria-describedby", () => {
      render(<Input label="Email" error="Email is required" />);
      const input = screen.getByLabelText("Email");
      const errorEl = screen.getByRole("alert");

      expect(input).toHaveAttribute("aria-describedby", errorEl.id);
    });

    it("links helper text via aria-describedby when no error", () => {
      render(<Input label="Name" helperText="Enter your full name" />);
      const input = screen.getByLabelText("Name");
      const helper = screen.getByText("Enter your full name");

      expect(input).toHaveAttribute("aria-describedby", helper.id);
    });
  });
});
