import { describe, it, expect } from "vitest";
import {
  categoryAnchor,
  groupThoughts,
  DEPRECATED_GROUP,
} from "./thoughtCategories";
import { THOUGHTS } from "./featureData";
import type { ThoughtItem } from "@/types/hub";

/** A write-up at /thoughts/<slug>, with the fields the grouping does not read filled in. */
function buildThought(
  slug: string,
  overrides: Partial<ThoughtItem> = {},
): ThoughtItem {
  return {
    title: slug,
    href: `/thoughts/${slug}`,
    preview: "",
    color: "#336699",
    ...overrides,
  };
}

describe("groupThoughts", () => {
  it("files a write-up under the category that claims its slug", () => {
    const groups = groupThoughts([
      buildThought("vitals"),
      buildThought("world"),
    ]);
    expect(
      groups.map((g) => [g.name, g.items.map((t) => t.title)]),
    ).toEqual([
      ["Features", ["world"]],
      ["Performance", ["vitals"]],
    ]);
  });

  it("orders groups by category, not by the order write-ups arrive", () => {
    const groups = groupThoughts([
      buildThought("security"),
      buildThought("vitals"),
      buildThought("world"),
    ]);
    expect(groups.map((g) => g.name)).toEqual([
      "Features",
      "Performance",
      "Security",
    ]);
  });

  it("puts a write-up nobody categorised into a trailing More group", () => {
    const groups = groupThoughts([
      buildThought("world"),
      buildThought("brand-new-writeup"),
    ]);
    expect(groups.map((g) => g.name)).toEqual(["Features", "More"]);
    expect(groups[1].items.map((t) => t.title)).toEqual(["brand-new-writeup"]);
  });

  it("leaves out a category that has no write-ups", () => {
    expect(groupThoughts([buildThought("world")]).map((g) => g.name)).toEqual([
      "Features",
    ]);
  });

  it("drops a deprecated write-up from its category into the Deprecated group", () => {
    const groups = groupThoughts([
      buildThought("world"),
      buildThought("vitals", { deprecated: true }),
      buildThought("brand-new-writeup", { deprecated: true }),
    ]);
    expect(groups.map((g) => [g.name, g.items.map((t) => t.title)])).toEqual([
      ["Features", ["world"]],
      [DEPRECATED_GROUP, ["vitals", "brand-new-writeup"]],
    ]);
  });

  it("shows every real write-up exactly once", () => {
    const shown = groupThoughts(THOUGHTS).flatMap((g) => g.items);
    expect(shown).toHaveLength(THOUGHTS.length);
    expect(new Set(shown).size).toBe(THOUGHTS.length);
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

describe("the real write-ups", () => {
  it("each sit in a named category rather than the More catch-all", () => {
    const more = groupThoughts(THOUGHTS).find((group) => group.name === "More");
    expect(more?.items.map((item) => item.href) ?? []).toEqual([]);
  });
});
