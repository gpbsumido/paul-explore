import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import IconButton from "./IconButton";

describe("IconButton accessibility", () => {
  it("reports no violations with a descriptive aria-label", async () => {
    const { container } = render(
      <IconButton aria-label="Close dialog">
        <svg aria-hidden="true" />
      </IconButton>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders the aria-label on the button element", () => {
    render(
      <IconButton aria-label="Open settings">
        <svg aria-hidden="true" />
      </IconButton>,
    );
    expect(
      screen.getByRole("button", { name: "Open settings" }),
    ).toBeInTheDocument();
  });

  it("renders the design-system icon-btn class (focus ring lives in that CSS)", () => {
    render(
      <IconButton aria-label="Edit">
        <svg aria-hidden="true" />
      </IconButton>,
    );
    expect(screen.getByRole("button")).toHaveClass("icon-btn");
  });

  it("still forwards a size and merges extra classes", () => {
    render(
      <IconButton aria-label="Edit" size="sm" className="border">
        <svg aria-hidden="true" />
      </IconButton>,
    );
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("icon-btn", "icon-btn--sm", "border");
  });

  it("fires onClick, and not while disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(
      <IconButton aria-label="Edit" onClick={onClick}>
        <svg aria-hidden="true" />
      </IconButton>,
    );
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(onClick).toHaveBeenCalledOnce();

    rerender(
      <IconButton aria-label="Edit" onClick={onClick} disabled>
        <svg aria-hidden="true" />
      </IconButton>,
    );
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
