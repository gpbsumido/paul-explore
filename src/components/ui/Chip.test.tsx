import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import Chip from "./Chip";

describe("Chip accessibility", () => {
  describe("axe scans", () => {
    it("reports no violations for a static chip", async () => {
      const { container } = render(<Chip label="TypeScript" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("reports no violations for a clickable chip", async () => {
      const { container } = render(
        <Chip label="TypeScript" onClick={() => {}} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("reports no violations for a removable chip", async () => {
      const { container } = render(
        <Chip label="TypeScript" onRemove={() => {}} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("removable chip", () => {
    it("renders a remove button with an accessible name including the label", () => {
      render(<Chip label="TypeScript" onRemove={() => {}} />);
      expect(
        screen.getByRole("button", { name: "Remove TypeScript" }),
      ).toBeInTheDocument();
    });

    it("calls onRemove when the remove button is clicked", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      render(<Chip label="TypeScript" onRemove={onRemove} />);

      await user.click(
        screen.getByRole("button", { name: "Remove TypeScript" }),
      );
      expect(onRemove).toHaveBeenCalledOnce();
    });
  });
});

describe("Chip as a link", () => {
  it("opens an external link in a new tab", () => {
    render(<Chip label="paul-explore#689" href="https://github.com/x/y/pull/689" />);
    const link = screen.getByRole("link", { name: "paul-explore#689" });
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("refuses props a link chip can't honour, at compile time", () => {
    // These used to type-check and then vanish at runtime. A click handler or a
    // remove button inside a link would be a control inside a control anyway.
    // @ts-expect-error a link chip takes no onClick
    render(<Chip label="a" href="/a" onClick={() => {}} />);
    // @ts-expect-error a link chip takes no onRemove
    render(<Chip label="b" href="/b" onRemove={() => {}} />);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
