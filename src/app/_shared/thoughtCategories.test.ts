import { describe, it, expect } from "vitest";
import { categoryAnchor, groupThoughts } from "./thoughtCategories";
import { THOUGHTS } from "./featureData";

describe("categoryAnchor", () => {
  it("slugifies a plain name", () => {
    expect(categoryAnchor("Performance")).toBe("performance");
  });

  it("collapses spaces and ampersands into single hyphens", () => {
    expect(categoryAnchor("Design & UI")).toBe("design-ui");
    expect(categoryAnchor("Architecture & Backend")).toBe(
      "architecture-backend",
    );
  });

  it("never leaves leading or trailing hyphens", () => {
    expect(categoryAnchor(" More! ")).toBe("more");
  });

  it("produces a unique, non-empty anchor for every real category", () => {
    const names = groupThoughts(THOUGHTS).map((g) => g.name);
    const anchors = names.map(categoryAnchor);
    for (const a of anchors) expect(a).toMatch(/^[a-z0-9-]+$/);
    expect(new Set(anchors).size).toBe(anchors.length);
  });
});
