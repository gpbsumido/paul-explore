// Fails the build when the JS a visitor downloads grows past a budget.
//
// Nothing caught bundle drift here before this. The app has a Web Vitals
// dashboard fed by real users, two write-ups about tree-shaking, and three
// design-system packages pulled from npm, so there is no shortage of ways for
// the client bundle to grow quietly. A sibling Angular app has an initial-bundle
// budget and it caught a regression, which is what prompted this one.
//
// WHERE THE NUMBERS COME FROM
//
// Next 16.3.0 builds with Turbopack, and two things people expect are missing:
// there is no `.next/app-build-manifest.json`, and `next build` no longer prints
// a First Load JS column (it prints revalidate/expire instead). So the per-route
// figure has to be derived:
//
//   shared baseline  .next/build-manifest.json, rootMainFiles + polyfillFiles.
//                    Seven chunks that every route loads. One byte added here is
//                    paid by all 127 routes, which is why it gets its own entry.
//
//   per route        .next/server/app/<route>/page_client-reference-manifest.js
//                    assigns globalThis.__RSC_MANIFEST. Every client module the
//                    route references carries the chunk list it lives in, so the
//                    union of those plus the shared baseline is its first load.
//
// That derivation was checked against ground truth rather than assumed. For a
// statically prerendered route, .next/server/app/<route>.html lists the real
// script tags a browser fetches. For /design-system the two agree exactly: the
// same 18 files, nothing on either side only. The HTML cannot be the primary
// source because / is force-dynamic and has no prerendered HTML, but it is what
// makes the manifest derivation trustworthy for the routes that have none.
//
// Sizes are gzipped, because compressed bytes are what cross the wire. Level 9
// is a stable proxy rather than a promise about the CDN, which often serves
// brotli. It moves when the bundle moves, which is all a budget needs.
//
// Run it after a build: `pnpm build && pnpm size`.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { createContext, runInNewContext } from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NEXT_DIR = join(ROOT, ".next");
const BYTES_PER_KB = 1024;

/**
 * @typedef {{ kb: number, note: string }} Budget
 * @typedef {{ name: string, bytes: number }} Measurement
 */

/** The pseudo-route for the chunks every real route pays for. */
export const SHARED = "shared baseline";

/**
 * Budgets in gzipped KB, each one a real measurement plus about 7% headroom.
 *
 * They are set from a build, not from aspiration. A budget that lands red on
 * day one teaches everyone to ignore the check, and then the check is worse
 * than nothing because it looks like cover.
 *
 * @type {Record<string, Budget>}
 */
export const BUDGETS = {
  [SHARED]: {
    kb: 178,
    note: "the chunks every route loads before anything route-specific, so a regression here is paid 127 times over",
  },
  "/": {
    kb: 273,
    note: "the hiring landing, and the one route with an LCP rule attached to it, so it gets the least slack",
  },
  "/world": {
    kb: 330,
    note: "deliberately heavy 3D city, budgeted generously rather than excluded so it still cannot quietly double",
  },
  "/lab/particles": {
    kb: 358,
    note: "the other deliberate 3D page, same reasoning as /world",
  },
  "/vitals": {
    kb: 370,
    note: "the recharts dashboard, heaviest route outside the operator area",
  },
  "/operator/stores/[storeId]": {
    kb: 460,
    note: "the heaviest route in the app, named so the catch-all ceiling can stay well below it",
  },
};

/**
 * Any route without a named budget answers to this.
 *
 * Without it the guard has a hole exactly where new code lands: a brand-new
 * route could ship at 600KB and nothing would say a word.
 *
 * @type {Budget}
 */
export const ROUTE_CEILING = {
  kb: 360,
  note: "the ceiling for any route without a named budget, set above today's heaviest unnamed route",
};

/**
 * What each budget was measured from, in gzipped bytes, on the build that set
 * them. The test suite reads this to prove no budget was ever written below the
 * thing it is meant to be guarding.
 *
 * @type {Record<string, number>}
 */
export const MEASURED = {
  [SHARED]: 170192,
  "/": 261431,
  "/world": 314144,
  "/lab/particles": 341314,
  "/vitals": 353465,
  "/operator/stores/[storeId]": 439909,
  "/fantasy/nba/player/stats": 341834,
};

/** Turns a manifest chunk reference into a path relative to `.next`. */
const normalize = (chunk) => chunk.replace(/^\/_next\//, "");

/**
 * The chunks every route loads, from `.next/build-manifest.json`.
 *
 * @param {{ rootMainFiles?: string[], polyfillFiles?: string[] }} buildManifest
 * @returns {string[]}
 */
export function sharedChunks(buildManifest) {
  const files = [
    ...(buildManifest.rootMainFiles ?? []),
    ...(buildManifest.polyfillFiles ?? []),
  ];
  return [...new Set(files.map(normalize))];
}

/**
 * Every distinct chunk a route's first load pulls in.
 *
 * A chunk named by two client modules, or named by a module and also in the
 * shared baseline, is still downloaded once. Counting it twice would inflate
 * every number the guard reports.
 *
 * @param {{ clientModules: Record<string, { chunks?: string[] }>, shared: string[] }} input
 * @returns {string[]}
 */
export function routeChunks({ clientModules, shared }) {
  const chunks = new Set(shared.map(normalize));
  for (const mod of Object.values(clientModules)) {
    for (const chunk of mod.chunks ?? []) chunks.add(normalize(chunk));
  }
  return [...chunks];
}

/**
 * Total bytes for a set of chunks, given a way to size one.
 *
 * @param {{ chunks: string[], sizeOf: (chunk: string) => number }} input
 * @returns {number}
 */
export function measure({ chunks, sizeOf }) {
  return chunks.reduce((total, chunk) => total + sizeOf(chunk), 0);
}

/**
 * The budget a named thing answers to, and whether that was specific or the
 * catch-all ceiling.
 *
 * @param {{ name: string, budgets: Record<string, Budget>, ceiling: Budget }} input
 */
function budgetFor({ name, budgets, ceiling }) {
  const named = budgets[name];
  return named
    ? { ...named, source: /** @type {const} */ ("named") }
    : { ...ceiling, source: /** @type {const} */ ("ceiling") };
}

/**
 * Measurements against their budgets.
 *
 * Exactly on budget passes. The interesting case is always the byte after.
 *
 * @param {{ measurements: Measurement[], budgets: Record<string, Budget>, ceiling: Budget }} input
 */
export function compare({ measurements, budgets, ceiling }) {
  return measurements.map(({ name, bytes }) => {
    const budget = budgetFor({ name, budgets, ceiling });
    const budgetBytes = budget.kb * BYTES_PER_KB;
    return {
      name,
      bytes,
      budgetBytes,
      note: budget.note,
      source: budget.source,
      over: bytes > budgetBytes,
      overBy: Math.max(0, bytes - budgetBytes),
    };
  });
}

/** Gzipped bytes as KB with one decimal, the unit every budget is written in. */
const kb = (bytes) => `${(bytes / BYTES_PER_KB).toFixed(1)}KB`;

/**
 * The readable diff for everything over budget: what grew, by how much, and
 * why that budget is the number it is.
 *
 * @param {ReturnType<typeof compare>} results
 * @returns {string}
 */
export function formatFailures(results) {
  return results
    .filter((r) => r.over)
    .map(
      (r) =>
        `  ${r.name}\n` +
        `    budget  ${kb(r.budgetBytes)}${r.source === "ceiling" ? " (catch-all ceiling)" : ""}\n` +
        `    actual  ${kb(r.bytes)}\n` +
        `    over by ${kb(r.overBy)}\n` +
        `    why     ${r.note}`,
    )
    .join("\n\n");
}

/**
 * The passing summary: the named entries with how much room each has left,
 * so the number is visible on a green run and not only on a red one.
 *
 * @param {ReturnType<typeof compare>} results
 * @returns {string}
 */
export function formatReport(results) {
  return results
    .filter((r) => r.source === "named")
    .sort((a, b) => b.bytes - a.bytes)
    .map(
      (r) =>
        `  ${r.name.padEnd(30)} ${kb(r.bytes).padStart(8)} / ${kb(r.budgetBytes).padStart(8)}` +
        `  (${((r.bytes / r.budgetBytes) * 100).toFixed(0)}% used)`,
    )
    .join("\n");
}

/** Reads a route's RSC manifest without letting it touch this process's globals. */
function readRouteManifest(file) {
  const context = createContext({});
  runInNewContext(readFileSync(file, "utf8"), context);
  const manifest = context.__RSC_MANIFEST ?? {};
  const key = Object.keys(manifest)[0];
  return key ? { key, clientModules: manifest[key].clientModules ?? {} } : null;
}

/** Every `page_client-reference-manifest.js` under `.next/server/app`. */
function findRouteManifests(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) findRouteManifests(full, acc);
    else if (entry.name === "page_client-reference-manifest.js") acc.push(full);
  }
  return acc;
}

/** `/world/page` is the manifest's name for what a visitor calls `/world`. */
const routeName = (key) => key.replace(/\/page$/, "") || "/";

function main() {
  const buildManifestPath = join(NEXT_DIR, "build-manifest.json");
  if (!existsSync(buildManifestPath)) {
    console.error(
      "No build found at .next/build-manifest.json.\n" +
        "Bundle sizes come from a real build, so run `pnpm build` first.",
    );
    process.exit(1);
  }

  const sizes = new Map();
  /** Gzipped size of one chunk, computed once however many routes share it. */
  const sizeOf = (chunk) => {
    if (!sizes.has(chunk)) {
      const path = join(NEXT_DIR, chunk);
      sizes.set(
        chunk,
        existsSync(path) ? gzipSync(readFileSync(path), { level: 9 }).length : 0,
      );
    }
    return sizes.get(chunk);
  };

  const shared = sharedChunks(
    JSON.parse(readFileSync(buildManifestPath, "utf8")),
  );

  /** @type {Measurement[]} */
  const measurements = [
    { name: SHARED, bytes: measure({ chunks: shared, sizeOf }) },
  ];

  for (const file of findRouteManifests(join(NEXT_DIR, "server/app"))) {
    const manifest = readRouteManifest(file);
    if (!manifest) continue;
    const chunks = routeChunks({
      clientModules: manifest.clientModules,
      shared,
    });
    measurements.push({
      name: routeName(manifest.key),
      bytes: measure({ chunks, sizeOf }),
    });
  }

  const results = compare({
    measurements,
    budgets: BUDGETS,
    ceiling: ROUTE_CEILING,
  });
  const failures = results.filter((r) => r.over);

  console.log(
    `[check-bundle-size] gzipped first-load JS across ${results.length - 1} routes\n`,
  );
  console.log(formatReport(results));

  if (failures.length > 0) {
    console.error(
      `\nOver budget by ${kb(failures.reduce((t, f) => t + f.overBy, 0))} across ${failures.length} entr${failures.length === 1 ? "y" : "ies"}:\n`,
    );
    console.error(formatFailures(failures));
    console.error(
      "\nEither find the weight (`pnpm analyze` builds a treemap) or, if the" +
        "\ngrowth is deliberate, raise the budget in scripts/check-bundle-size.mjs" +
        "\nand say in the PR what bought the bytes.",
    );
    process.exit(1);
  }

  console.log(`\nAll ${results.length} entries within budget.`);
}

// Only run when invoked directly, so the tests can import the pure functions.
if (process.argv[1] === fileURLToPath(import.meta.url)) main();
