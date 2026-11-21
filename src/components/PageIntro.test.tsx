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
    const eyebrow = screen.getByText("Dev notes");
    const title = screen.getByRole("heading", { level: 1 });
    expect(
      eyebrow.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
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

  it("adds a caller's classes to the header without losing the default spacing", () => {
    render(<PageIntro title="Craft" className="mt-12" />);
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("mb-10", "mt-12");
  });

  it("renders no eyebrow or lede element when neither is given", () => {
    render(<PageIntro title="Craft" />);
    expect(screen.getByRole("banner").querySelectorAll("p")).toHaveLength(0);
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
