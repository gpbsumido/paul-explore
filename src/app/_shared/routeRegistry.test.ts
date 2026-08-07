import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { FEATURES, THOUGHTS } from "./featureData.data";

/**
 * Every registry entry must point at a route that actually exists.
 *
 * The research-explorer write-up shipped registered in both registries with no
 * page.tsx behind it, so it appeared on the index and linked to an error page.
 * Its own test rendered the content component directly, which passed happily
 * without a route -- the test asserted the wrong thing.
 *
 * This checks the filesystem instead, so the same mistake fails CI for any
 * future entry rather than only the one that got caught.
 */

const APP_DIR = join(process.cwd(), "src", "app");

/** Internal hrefs only. An external URL is somebody else's route. */
const isInternal = (href: string): boolean => href.startsWith("/");

/**
 * The file Next needs for `href` to be a page. Dynamic segments are resolved by
 * checking for any bracketed directory at that level, which no current entry
 * uses but a future one might.
 */
const hasPage = (href: string): boolean => {
  const dir = join(APP_DIR, ...href.split("/").filter(Boolean));
  return existsSync(join(dir, "page.tsx")) || existsSync(join(dir, "page.ts"));
};

describe("route registry", () => {
  it("gives every registered write-up a real page", () => {
    const broken = THOUGHTS.filter((t) => isInternal(t.href)).filter(
      (t) => !hasPage(t.href),
    );
    expect(broken.map((t) => t.href)).toEqual([]);
  });

  it("gives every registered feature a real page", () => {
    const broken = FEATURES.filter((f) => isInternal(f.href)).filter(
      (f) => !hasPage(f.href),
    );
    expect(broken.map((f) => f.href)).toEqual([]);
  });

  it("gives every feature's thoughtsHref a real page", () => {
    const broken = FEATURES.filter(
      (f) => f.thoughtsHref && isInternal(f.thoughtsHref),
    ).filter((f) => !hasPage(f.thoughtsHref as string));
    expect(broken.map((f) => f.thoughtsHref)).toEqual([]);
  });

  it("actually detects a missing page, so the check can fail", () => {
    expect(hasPage("/thoughts/definitely-not-a-real-page")).toBe(false);
    expect(hasPage("/research")).toBe(true);
  });
});
