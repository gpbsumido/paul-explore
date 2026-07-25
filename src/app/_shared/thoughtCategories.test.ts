import { describe, it, expect } from "vitest";
import {
  categoryAnchor,
  groupThoughts,
  DEPRECATED_GROUP,
} from "./thoughtCategories";
import { THOUGHTS } from "./featureData";

describe("groupThoughts deprecation", () => {
  const groups = groupThoughts(THOUGHTS);
  const deprecated = groups.find((g) => g.name === DEPRECATED_GROUP);

  it("collects deprecated write-ups into a trailing Deprecated group", () => {
    const deprecatedCount = THOUGHTS.filter((t) => t.deprecated).length;
    expect(deprecatedCount).toBeGreaterThan(0);
    expect(deprecated?.items).toHaveLength(deprecatedCount);
    expect(groups[groups.length - 1].name).toBe(DEPRECATED_GROUP);
  });

  it("keeps deprecated write-ups out of the normal category groups", () => {
    for (const g of groups) {
      if (g.name === DEPRECATED_GROUP) continue;
      expect(g.items.every((t) => !t.deprecated)).toBe(true);
    }
  });
});

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
