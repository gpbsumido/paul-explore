import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import Button, { type ButtonVariant } from "./Button";

const VARIANTS: readonly ButtonVariant[] = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "danger",
] as const;

describe("Button accessibility", () => {
  describe("axe scans", () => {
    it.each(VARIANTS)(
      "reports no violations for the %s variant",
      async (variant) => {
        const { container } = render(
          <Button variant={variant}>Click me</Button>,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      },
    );

    it("reports no violations when loading", async () => {
      const { container } = render(<Button loading>Saving</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("reports no violations when disabled", async () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("disabled state", () => {
    it("is focusable when disabled so screen readers can discover it", async () => {
      const user = userEvent.setup();
      render(<Button disabled>Cannot click</Button>);

      await user.tab();
      expect(screen.getByRole("button")).toHaveFocus();
    });

    it("has aria-disabled but not the native disabled attribute", () => {
      render(<Button disabled>Cannot click</Button>);
      const button = screen.getByRole("button");

      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).not.toHaveAttribute("disabled");
    });

    it("does not fire onClick when disabled", async () => {
      const user = userEvent.setup();
      let clicked = false;
      render(
        <Button disabled onClick={() => (clicked = true)}>
          Cannot click
        </Button>,
      );

      await user.click(screen.getByRole("button"));
      expect(clicked).toBe(false);
    });
  });

  describe("focus-visible ring", () => {
    it("applies a focus-visible outline class", () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole("button");
      const classes = button.className;

      expect(classes).toContain("focus-visible:outline-2");
      expect(classes).toContain("focus-visible:outline-offset-2");
    });
  });
});
