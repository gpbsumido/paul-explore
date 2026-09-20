import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PageIntro from "./PageIntro";

describe("PageIntro", () => {
  it("renders the title as the page's h1", () => {
    render(<PageIntro title="Thoughts" />);
    const h1 = screen.getByRole("heading", { level: 1, name: "Thoughts" });
    expect(h1).toBeInTheDocument();
  });

  it("shows the eyebrow above the title without making it a heading", () => {
    render(<PageIntro eyebrow="Dev notes" title="Thoughts" />);
    // The eyebrow is a label, not part of the heading outline.
    expect(screen.getByText("Dev notes")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Dev notes" }),
    ).not.toBeInTheDocument();
  });

  it("renders a lede when given one", () => {
    render(<PageIntro title="Updates" lede="A running note of what shipped." />);
    expect(
      screen.getByText("A running note of what shipped."),
    ).toBeInTheDocument();
  });

  it("uses the display type scale, not the timid text-3xl", () => {
    render(<PageIntro title="Craft" />);
    const h1 = screen.getByRole("heading", { level: 1, name: "Craft" });
    // The landing commits to a confident clamp display size; the old inline
    // pattern was a flat text-3xl. Pin the intent so a regression is visible.
    expect(h1.className).toMatch(/clamp\(/);
    expect(h1.className).not.toMatch(/text-3xl/);
  });
});
