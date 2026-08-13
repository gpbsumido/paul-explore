import { describe, it, expect } from "vitest";
import { readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { counterpartFor } from "@/lib/featureThoughts";

/**
 * A write-up about a page you can visit should link to that page.
 *
 * This exists because /thoughts/to-do shipped without one. The pairing is driven
 * by FEATURES, which is the public hub list, so anything not on the hub — an
 * admin page, a sub-page of a hub entry — has nowhere to hang a thoughtsHref and
 * silently gets no link. Nothing failed, the link was just absent, which is the
 * kind of gap you only find by walking the site.
 *
 * The rule: if a write-up's slug matches a real route, it must resolve a
 * counterpart. Deliberate exceptions go in the list below with a reason, so
 * skipping one is a decision someone wrote down rather than an oversight.
 */
const APP = join(process.cwd(), "src", "app");
const THOUGHTS = join(APP, "thoughts");

const UNPAIRED_ON_PURPOSE: Record<string, string> = {
  "design-system":
    "Second write-up about the same feature. /design-system pairs with design-system-showcase, and a feature can only point at one.",
};

const slugs = readdirSync(THOUGHTS).filter(
  (d) => d !== "_shared" && existsSync(join(THOUGHTS, d, "page.tsx")),
);

/** Does a route of the same name exist, i.e. is there anything to link to? */
const hasRoute = (slug: string): boolean => {
  const dir = join(APP, slug);
  return existsSync(dir) && statSync(dir).isDirectory() && existsSync(join(dir, "page.tsx"));
};

describe("write-ups link back to the page they are about", () => {
  it("pairs every write-up whose subject is a real route", () => {
    const missing = slugs
      .filter(hasRoute)
      .filter((s) => !UNPAIRED_ON_PURPOSE[s])
      .filter((s) => counterpartFor(`/thoughts/${s}`) === null);

    expect(missing).toEqual([]);
  });

  it("pairs it in both directions, not just one", () => {
    const oneWay = slugs
      .filter(hasRoute)
      .filter((s) => !UNPAIRED_ON_PURPOSE[s])
      .filter((s) => {
        const toFeature = counterpartFor(`/thoughts/${s}`);
        if (!toFeature) return false;
        const back = counterpartFor(toFeature.href);
        return back?.href !== `/thoughts/${s}`;
      });

    expect(oneWay).toEqual([]);
  });

  it("keeps the exception list honest", () => {
    // An exception for a write-up that no longer exists, or that would pass
    // anyway, is stale config pretending to be a decision.
    const stale = Object.keys(UNPAIRED_ON_PURPOSE).filter(
      (s) => !slugs.includes(s) || !hasRoute(s),
    );
    expect(stale).toEqual([]);
  });

  it("found the write-ups it claims to be checking", () => {
    expect(slugs.length).toBeGreaterThan(50);
  });
});
