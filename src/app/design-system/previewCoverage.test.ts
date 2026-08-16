import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { COMPONENTS } from "./catalog";

/**
 * Every catalogued component has to render something.
 *
 * The gallery renders `PREVIEWS[component.id]` into a fixed-height box, and a
 * missing key is not an error -- it is `undefined`, so the card lays out
 * perfectly with an empty frame where the component should be. Fourteen of
 * them shipped that way for weeks: the eleven charts plus TiltCard, Spotlight
 * and GradientBackground, which are the first cards in the gallery, so the
 * page opened on a column of empty boxes and only looked alive further down.
 *
 * `catalog.test.ts` could not catch it. That file checks each documented name
 * against the package's real exports, which was true the whole time -- the
 * components existed, the page just never rendered them. This reads the map
 * that actually feeds the page.
 */
const source = () =>
  readFileSync(
    join(process.cwd(), "src/app/design-system/DesignSystemShowcaseContent.tsx"),
    "utf-8",
  );

/** The keys of the PREVIEWS record, read from the source rather than imported. */
function previewKeys(): string[] {
  const src = source();
  const start = src.indexOf("const PREVIEWS: Record<string, ReactNode> = {");
  const end = src.indexOf("\n};", start);
  const body = src.slice(start, end);
  return [...body.matchAll(/^\s{2}"?([a-z][a-z-]*)"?:/gm)].map((m) => m[1]);
}

describe("design system preview coverage", () => {
  it("reads keys out of the real map, so a rotted parser fails rather than passes", () => {
    expect(previewKeys()).toContain("button");
    expect(previewKeys().length).toBeGreaterThan(10);
  });

  it("gives every catalogued component a preview to render", () => {
    const keys = new Set(previewKeys());
    const missing = COMPONENTS.filter((c) => !keys.has(c.id)).map((c) => c.id);

    expect(missing).toEqual([]);
  });

  it("has no preview for a component the catalog dropped", () => {
    const ids = new Set(COMPONENTS.map((c) => c.id));
    const orphans = previewKeys().filter((key) => !ids.has(key));

    expect(orphans).toEqual([]);
  });
});
