import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { FEATURES } from "./featureData.data";

/**
 * Every feature route should recover in place when it throws.
 *
 * Without an error.tsx a render error escapes to the global boundary, which
 * throws away the page shell and leaves no way back except a reload. That was
 * true of twelve of the fourteen feature routes, so this pins it: a feature
 * added later gets the same treatment or CI says so.
 */
const APP = join(process.cwd(), "src", "app");

const internal = FEATURES.filter((f) => f.href.startsWith("/"));
const dirOf = (href: string) => join(APP, ...href.split("/").filter(Boolean));

describe("feature routes recover on their own", () => {
  it("gives every feature route an error boundary", () => {
    const missing = internal
      .filter((f) => !existsSync(join(dirOf(f.href), "error.tsx")))
      .map((f) => f.href);
    expect(missing).toEqual([]);
  });

  it("gives every feature route a loading state", () => {
    const missing = internal
      .filter((f) => !existsSync(join(dirOf(f.href), "loading.tsx")))
      .map((f) => f.href);
    expect(missing).toEqual([]);
  });

  it("is actually looking at the right place", () => {
    expect(existsSync(join(dirOf("/research"), "error.tsx"))).toBe(true);
    expect(existsSync(join(dirOf("/research"), "nope.tsx"))).toBe(false);
  });
});
