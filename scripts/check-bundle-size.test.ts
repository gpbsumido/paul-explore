import { describe, it, expect } from "vitest";
import {
  missingBuildAction,
  BUDGETS,
  MEASURED,
  ROUTE_CEILING,
  compare,
  formatFailures,
  measure,
  routeChunks,
  sharedChunks,
} from "./check-bundle-size.mjs";

/**
 * The checker's I/O lives in main(); everything below is pure, so these tests
 * feed it fixture manifests and a fake size lookup. Nothing here runs a build.
 * A test that shelled out to `next build` would take minutes and would stop
 * being run, which is the failure mode this whole guard exists to avoid.
 */

/** A stand-in for `.next/build-manifest.json`, trimmed to the fields we read. */
const buildManifest = {
  rootMainFiles: ["static/chunks/main.js", "static/chunks/framework.js"],
  polyfillFiles: ["static/chunks/polyfill.js"],
};

/**
 * A stand-in for the `clientModules` map inside a route's
 * `page_client-reference-manifest.js`. Two modules deliberately share a chunk,
 * because that is the case that inflates every number if dedupe is wrong.
 */
const clientModules = {
  "[project]/src/app/page.tsx": {
    chunks: ["/_next/static/chunks/route-a.js", "/_next/static/chunks/main.js"],
  },
  "[project]/src/components/Chart.tsx": {
    chunks: ["/_next/static/chunks/route-a.js", "/_next/static/chunks/route-b.js"],
  },
};

const sizes: Record<string, number> = {
  "static/chunks/main.js": 1000,
  "static/chunks/framework.js": 2000,
  "static/chunks/polyfill.js": 500,
  "static/chunks/route-a.js": 300,
  "static/chunks/route-b.js": 70,
};

const sizeOf = (chunk: string): number => sizes[chunk] ?? 0;

describe("reading chunks out of a Turbopack build", () => {
  it("takes the shared baseline from rootMainFiles and polyfillFiles", () => {
    expect(sharedChunks(buildManifest)).toEqual([
      "static/chunks/main.js",
      "static/chunks/framework.js",
      "static/chunks/polyfill.js",
    ]);
  });

  it("unions a route's client-module chunks onto the shared baseline", () => {
    const chunks = routeChunks({
      clientModules,
      shared: sharedChunks(buildManifest),
    });

    expect([...chunks].sort()).toEqual([
      "static/chunks/framework.js",
      "static/chunks/main.js",
      "static/chunks/polyfill.js",
      "static/chunks/route-a.js",
      "static/chunks/route-b.js",
    ]);
  });

  /**
   * `main.js` is in the shared baseline AND named by a client module, and
   * `route-a.js` is named by both modules. A visitor downloads each once.
   */
  it("counts a chunk named more than once exactly once", () => {
    const chunks = routeChunks({
      clientModules,
      shared: sharedChunks(buildManifest),
    });

    expect(chunks).toHaveLength(5);
    expect(measure({ chunks, sizeOf })).toBe(3870);
  });

  it("strips the /_next/ request prefix so chunks resolve to files on disk", () => {
    const chunks = routeChunks({ clientModules, shared: [] });

    expect(chunks.every((c) => !c.startsWith("/_next/"))).toBe(true);
  });
});

describe("comparing a measurement against its budget", () => {
  it("passes a route measured under budget", () => {
    const [result] = compare({
      measurements: [{ name: "/", bytes: 100 }],
      budgets: { "/": { kb: 1, note: "test" } },
      ceiling: { kb: 99, note: "test" },
    });

    expect(result.over).toBe(false);
    expect(result.overBy).toBe(0);
  });

  it("fails a route measured over budget", () => {
    const [result] = compare({
      measurements: [{ name: "/", bytes: 2048 }],
      budgets: { "/": { kb: 1, note: "test" } },
      ceiling: { kb: 99, note: "test" },
    });

    expect(result.over).toBe(true);
    expect(result.budgetBytes).toBe(1024);
    expect(result.overBy).toBe(1024);
  });

  it("treats a measurement exactly on budget as passing", () => {
    const [result] = compare({
      measurements: [{ name: "/", bytes: 1024 }],
      budgets: { "/": { kb: 1, note: "test" } },
      ceiling: { kb: 99, note: "test" },
    });

    expect(result.over).toBe(false);
  });

  /**
   * Without this, a brand-new route ships with no budget at all and the guard
   * has a hole exactly where new code lands.
   */
  it("applies the catch-all ceiling to a route with no named budget", () => {
    const [result] = compare({
      measurements: [{ name: "/brand-new", bytes: 3000 }],
      budgets: {},
      ceiling: { kb: 2, note: "ceiling" },
    });

    expect(result.over).toBe(true);
    expect(result.source).toBe("ceiling");
  });

  it("prefers a named budget over the ceiling", () => {
    const [result] = compare({
      measurements: [{ name: "/world", bytes: 3000 }],
      budgets: { "/world": { kb: 4, note: "3D page" } },
      ceiling: { kb: 2, note: "ceiling" },
    });

    expect(result.over).toBe(false);
    expect(result.source).toBe("named");
    expect(result.note).toBe("3D page");
  });
});

describe("the failure message", () => {
  const failures = compare({
    measurements: [{ name: "/world", bytes: 400 * 1024 }],
    budgets: { "/world": { kb: 330, note: "deliberately heavy 3D city" } },
    ceiling: { kb: 360, note: "ceiling" },
  });

  it("names the route, the budget, the actual and the overage", () => {
    const text = formatFailures(failures);

    expect(text).toContain("/world");
    expect(text).toContain("330");
    expect(text).toContain("400");
    expect(text).toContain("70");
  });

  it("says why that budget is the number it is", () => {
    expect(formatFailures(failures)).toContain("deliberately heavy 3D city");
  });
});

/**
 * The point of deriving budgets from a real build is that they are not
 * aspirational. If a budget were ever set below what the app already ships,
 * the guard would land red and everyone would learn to skip it.
 */
describe("the committed budgets", () => {
  it("sits above the baseline it was measured from, every entry", () => {
    const alreadyRed = Object.entries(MEASURED).filter(
      ([name, bytes]) => bytes > (BUDGETS[name]?.kb ?? ROUTE_CEILING.kb) * 1024,
    );

    expect(alreadyRed).toEqual([]);
  });

  it("keeps every budget within 15% of its baseline, so headroom stays honest", () => {
    const tooLoose = Object.entries(MEASURED).filter(([name, bytes]) => {
      const budget = (BUDGETS[name]?.kb ?? ROUTE_CEILING.kb) * 1024;
      return budget > bytes * 1.15;
    });

    expect(tooLoose).toEqual([]);
  });

  it("explains every named budget", () => {
    const unexplained = Object.entries(BUDGETS).filter(
      ([, budget]) => !budget.note || budget.note.length < 20,
    );

    expect(unexplained).toEqual([]);
  });

  /**
   * The CI step runs on `if: always()` so a flaky end-to-end failure cannot
   * hide a size regression -- the build output is on disk either way. That
   * exposes one more case: when the *build* is what failed, there is nothing
   * to measure, and a second red step blaming the bundle would be noise
   * pointing at the wrong thing.
   */
  describe("a run with no build output", () => {
    it("fails locally, because that is someone forgetting to build", () => {
      expect(missingBuildAction([])).toBe("fail");
    });

    it("stands down when told the build may legitimately be absent", () => {
      expect(missingBuildAction(["--skip-if-unbuilt"])).toBe("skip");
    });

    it("ignores flags it does not know", () => {
      expect(missingBuildAction(["--verbose"])).toBe("fail");
    });
  });
});
