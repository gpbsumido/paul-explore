import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "@/test/a11y";
import IconButton from "./IconButton";

describe("IconButton accessibility", () => {
  it("reports axe violation when aria-label is empty", async () => {
    const { container } = render(
      <IconButton aria-label="">
        <svg aria-hidden="true" />
      </IconButton>,
    );
    const results = await axe(container);
    const buttonNameViolation = results.violations.find(
      (v) => v.id === "button-name",
    );
    expect(buttonNameViolation).toBeDefined();
  });

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
});
