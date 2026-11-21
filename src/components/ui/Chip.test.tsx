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

describe("Chip behaviour", () => {
  it("is a button that fires onClick when a click handler is given", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Chip label="TypeScript" onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "TypeScript" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("has no button at all when it is neither clickable nor removable", () => {
    render(<Chip label="TypeScript" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("does not fire onClick when its remove button is pressed", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onRemove = vi.fn();
    render(<Chip label="TypeScript" onClick={onClick} onRemove={onRemove} />);
    await user.click(screen.getByRole("button", { name: "Remove TypeScript" }));
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Chip as a link", () => {
  it("opens an external link in a new tab", () => {
    render(<Chip label="paul-explore#689" href="https://github.com/x/y/pull/689" />);
    const link = screen.getByRole("link", { name: "paul-explore#689" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer noopener");
    expect(link).toHaveAttribute("href", "https://github.com/x/y/pull/689");
  });

  it("keeps an internal link in the same tab", () => {
    render(<Chip label="Resume" href="/resume" />);
    const link = screen.getByRole("link", { name: "Resume" });
    expect(link).toHaveAttribute("href", "/resume");
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });

  it("titles a link chip with its label unless told otherwise, and sizes it", () => {
    const { rerender } = render(<Chip label="Resume" href="/resume" size="sm" />);
    const link = () => screen.getByRole("link", { name: "Resume" });
    expect(link()).toHaveAttribute("title", "Resume");
    expect(link()).toHaveClass("chip", "chip--sm");

    rerender(<Chip label="Resume" href="/resume" title="My CV" />);
    expect(link()).toHaveAttribute("title", "My CV");
    expect(link()).not.toHaveClass("chip--sm");
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
