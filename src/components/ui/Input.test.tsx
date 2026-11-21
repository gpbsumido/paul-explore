import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
      const errorEl = screen.getByText("Email is required");

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

describe("Input behaviour", () => {
  it("hands what is typed to onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input label="Name" onChange={onChange} />);
    await user.type(screen.getByLabelText("Name"), "Paul");
    expect(onChange).toHaveBeenCalledTimes(4);
    expect(screen.getByLabelText("Name")).toHaveValue("Paul");
  });

  it("marks a required field in its label and on the input", () => {
    render(<Input label="Email" required />);
    expect(screen.getByLabelText("Email *")).toBeRequired();
  });

  it("does not star an optional field", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).not.toBeRequired();
    expect(screen.queryByLabelText("Email *")).not.toBeInTheDocument();
  });

  it("keeps a hidden-label field required too", () => {
    render(<Input label="Search" hideLabel required />);
    expect(screen.getByLabelText("Search")).toBeRequired();
  });

  it("forwards its ref to the input element, with or without a hidden label", () => {
    const visible = createRef<HTMLInputElement>();
    const hidden = createRef<HTMLInputElement>();
    render(
      <>
        <Input label="Name" ref={visible} />
        <Input label="Search" hideLabel ref={hidden} />
      </>,
    );
    expect(visible.current).toBe(screen.getByLabelText("Name"));
    expect(hidden.current).toBe(screen.getByLabelText("Search"));
  });

  it("passes native attributes straight through to the input", () => {
    render(<Input label="Name" placeholder="Full name" disabled maxLength={20} />);
    const input = screen.getByLabelText("Name");
    expect(input).toHaveAttribute("placeholder", "Full name");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("maxlength", "20");
  });

  it("puts a caller's class on the wrapper rather than the input", () => {
    const { container } = render(<Input label="Name" className="w-64" />);
    expect(container.firstElementChild).toHaveClass("w-64");
    expect(screen.getByLabelText("Name")).not.toHaveClass("w-64");
  });

  it("sizes the input, in both label modes", () => {
    render(
      <>
        <Input label="Compact" size="sm" />
        <Input label="Compact hidden" size="sm" hideLabel />
        <Input label="Regular" />
      </>,
    );
    expect(screen.getByLabelText("Compact")).toHaveClass("input--sm");
    expect(screen.getByLabelText("Compact hidden")).toHaveClass("input--sm");
    expect(screen.getByLabelText("Regular")).not.toHaveClass("input--sm");
  });

  it("keeps the helper text linked when the label is hidden", () => {
    render(<Input label="Search" hideLabel helperText="Names only" />);
    expect(screen.getByLabelText("Search")).toHaveAttribute(
      "aria-describedby",
      screen.getByText("Names only").id,
    );
  });

  it("shows the error rather than the helper text when both are given", () => {
    render(<Input label="Email" error="Email is required" helperText="We never share it" />);
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.queryByText("We never share it")).not.toBeInTheDocument();
  });
});

describe("Input with a hidden label", () => {
  it("points the hidden label at the input it names", () => {
    const { container } = render(<Input label="Search" hideLabel />);
    const label = container.querySelector("label");
    const input = screen.getByRole("textbox");

    expect(label).not.toBeNull();
    expect(input.id).not.toBe("");
    expect(label?.htmlFor).toBe(input.id);
  });

  it("keeps the hidden label out of sight but in the accessibility tree", () => {
    const { container } = render(<Input label="Search" hideLabel />);
    expect(container.querySelector("label")).toHaveClass("sr-only");
  });
});
