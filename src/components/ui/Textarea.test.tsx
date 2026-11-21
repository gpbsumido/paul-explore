import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import Textarea from "./Textarea";

describe("Textarea accessibility", () => {
  describe("axe scans", () => {
    it("reports no violations with a visible label", async () => {
      const { container } = render(<Textarea label="Notes" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("reports no violations with a hidden label", async () => {
      const { container } = render(<Textarea label="Description" hideLabel />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("reports no violations in error state", async () => {
      const { container } = render(
        <Textarea label="Notes" error="Too short" />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("label association", () => {
    it("associates the label with the textarea via htmlFor/id", () => {
      render(<Textarea label="Description" />);
      expect(screen.getByLabelText("Description")).toBeInTheDocument();
    });

    it("points a hidden label at the textarea, not at an id nothing has", () => {
      // The wrapper drew its own sr-only label with its own useId, while the
      // package gave the textarea a different one.
      const { container } = render(<Textarea label="Description" hideLabel />);
      const label = container.querySelector("label");
      expect(label).not.toBeNull();
      expect(document.getElementById(label!.htmlFor)).toBe(
        screen.getByRole("textbox"),
      );
    });
  });

  describe("required", () => {
    it("marks a required field once", () => {
      // The package adds its own " *", and the wrapper added another.
      const { container } = render(<Textarea label="Notes" required />);
      expect(container.textContent?.match(/\*/g)).toHaveLength(1);
      expect(screen.getByRole("textbox")).toBeRequired();
    });
  });

  describe("error state", () => {
    it("sets aria-invalid when an error is present", () => {
      render(<Textarea label="Notes" error="Required" />);
      expect(screen.getByLabelText("Notes")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });

    it("links error message via aria-describedby", () => {
      render(<Textarea label="Notes" error="Too short" />);
      const textarea = screen.getByLabelText("Notes");
      const errorEl = screen.getByText("Too short");
      expect(textarea).toHaveAttribute("aria-describedby", errorEl.id);
    });
  });

  describe("character count", () => {
    it("shows a character count when maxLength is set", () => {
      render(<Textarea label="Bio" maxLength={100} />);
      expect(screen.getByText("0 / 100")).toBeInTheDocument();
    });

    it("updates the count as the user types", async () => {
      const user = userEvent.setup();
      render(<Textarea label="Bio" maxLength={100} />);

      await user.type(screen.getByLabelText("Bio"), "Hello");
      expect(screen.getByText("5 / 100")).toBeInTheDocument();
    });

    it("announces count changes to screen readers via aria-live", () => {
      render(<Textarea label="Bio" maxLength={100} />);
      const count = screen.getByText("0 / 100");
      expect(count.closest("[aria-live]")).toHaveAttribute(
        "aria-live",
        "polite",
      );
    });
  });

  describe("behaviour", () => {
    it("shows no character count when there is no maxLength", () => {
      render(<Textarea label="Bio" />);
      expect(screen.queryByText(/\/ \d+/)).not.toBeInTheDocument();
    });

    it("stops the count at the limit by passing maxLength to the field", async () => {
      const user = userEvent.setup();
      render(<Textarea label="Bio" maxLength={3} />);
      await user.type(screen.getByLabelText("Bio"), "Hello");
      expect(screen.getByLabelText("Bio")).toHaveValue("Hel");
      expect(screen.getByText("3 / 3")).toBeInTheDocument();
    });

    it("hands what is typed to onChange", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Textarea label="Bio" onChange={onChange} />);
      await user.type(screen.getByLabelText("Bio"), "Hi");
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it("links helper text via aria-describedby", () => {
      render(<Textarea label="Bio" helperText="A sentence or two" />);
      expect(screen.getByLabelText("Bio")).toHaveAttribute(
        "aria-describedby",
        screen.getByText("A sentence or two").id,
      );
    });

    it("forwards its ref to the textarea element", () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<Textarea label="Bio" ref={ref} />);
      expect(ref.current).toBe(screen.getByLabelText("Bio"));
    });

    it("keeps a hidden label out of sight but in the accessibility tree", () => {
      const { container } = render(<Textarea label="Bio" hideLabel />);
      expect(container.querySelector("label")).toHaveClass("sr-only");
    });

    it("shows the label normally unless asked to hide it", () => {
      const { container } = render(<Textarea label="Bio" />);
      expect(container.querySelector("label")).not.toHaveClass("sr-only");
    });

    it("puts a caller's class on the wrapper", () => {
      const { container } = render(<Textarea label="Bio" className="w-64" />);
      expect(container.firstElementChild).toHaveClass("w-64");
    });
  });
});
