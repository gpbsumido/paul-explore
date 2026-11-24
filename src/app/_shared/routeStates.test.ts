import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { FEATURES } from "./featureData.data";

/**
 * Every feature route shows something while it loads.
 *
 * Failures used to be pinned here too, one error.tsx per feature, from before
 * the app had a root boundary. The root one catches every route now, and
 * errorBoundaries.test.ts decides where a nested boundary still earns a file.
 */
const APP = join(process.cwd(), "src", "app");

const internal = FEATURES.filter((f) => f.href.startsWith("/"));
const dirOf = (href: string) => join(APP, ...href.split("/").filter(Boolean));

describe("feature routes", () => {
  it("gives every feature route a loading state", () => {
    const missing = internal
      .filter((f) => !existsSync(join(dirOf(f.href), "loading.tsx")))
      .map((f) => f.href);
    expect(missing).toEqual([]);
  });

  it("is actually looking at the right place", () => {
    expect(existsSync(join(dirOf("/research"), "loading.tsx"))).toBe(true);
    expect(existsSync(join(dirOf("/research"), "nope.tsx"))).toBe(false);
  });
});
