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

  describe("loading state", () => {
    it("is busy, disabled and does not fire onClick while loading", async () => {
      const user = userEvent.setup();
      let clicked = false;
      render(
        <Button loading onClick={() => (clicked = true)}>
          Saving
        </Button>,
      );
      const button = screen.getByRole("button", { name: "Saving" });
      expect(button).toHaveAttribute("aria-busy", "true");
      expect(button).toBeDisabled();
      await user.click(button);
      expect(clicked).toBe(false);
    });

    it("is not busy by default", () => {
      render(<Button>Save</Button>);
      expect(screen.getByRole("button")).not.toHaveAttribute("aria-busy");
    });
  });

  describe("variants and sizes", () => {
    it("is the primary variant at the standard size when nothing is asked for", () => {
      render(<Button>Save</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("btn--primary");
      expect(button.className).not.toMatch(/btn--(xs|sm|lg)/);
    });

    it("passes the variant and size it is given to the design-system button", () => {
      render(
        <Button variant="danger" size="lg">
          Delete
        </Button>,
      );
      expect(screen.getByRole("button")).toHaveClass("btn--danger", "btn--lg");
    });
  });

  describe("disabled state", () => {
    it("marks the button as disabled", () => {
      render(<Button disabled>Cannot click</Button>);
      const button = screen.getByRole("button");

      expect(button).toBeDisabled();
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
});

describe("Button as a link", () => {
  it("keeps the props it was given instead of dropping them", async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(
      <Button
        href="/resume"
        aria-label="Open my résumé"
        target="_blank"
        rel="noreferrer"
        onClick={(event) => {
          event.preventDefault();
          clicked = true;
        }}
      >
        Resume
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Open my résumé" });
    expect(link).toHaveAttribute("href", "/resume");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");

    await user.click(link);
    expect(clicked).toBe(true);
  });
});
