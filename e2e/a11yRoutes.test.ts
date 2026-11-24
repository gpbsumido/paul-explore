// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { isSessionProtectedPath } from "@/lib/protectedPaths";
import {
  A11Y_ROUTES,
  A11Y_EXCLUDED_ROUTES,
  A11Y_EXCLUDED_PREFIXES,
} from "./helpers/a11yRoutes";

/**
 * a11y-routes.spec.ts scans a hand-written list of routes. Nothing tied that
 * list to the pages that exist, so a new public page was never scanned and
 * nobody noticed: when this guard was written, four public pages outside the
 * write-ups had never been scanned. These tests walk src/app the same way
 * publicRoutes.test.ts does and fail when the two drift.
 */

/** Every route that has a page.tsx, as a URL path, dynamic segments left in. */
function routesOnDisk(dir = join(process.cwd(), "src/app"), base = ""): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "api") continue;
    if (entry.isDirectory()) {
      // Route groups like (marketing) do not appear in the URL.
      const segment = entry.name.startsWith("(") ? "" : `/${entry.name}`;
      found.push(...routesOnDisk(join(dir, entry.name), base + segment));
    } else if (entry.name === "page.tsx") {
      found.push(base === "" ? "/" : base);
    }
  }
  return found;
}

const pagesOnDisk = routesOnDisk();

/** A page an anonymous visitor can open at one fixed URL. */
const publicStaticPages = pagesOnDisk.filter(
  (route) => !route.includes("[") && !isSessionProtectedPath(route),
);

/** True when a concrete URL is served by a page, dynamic segments included. */
function isServedByAPage(url: string): boolean {
  const urlSegments = url.split("/");
  return pagesOnDisk.some((page) => {
    const pageSegments = page.split("/");
    return (
      pageSegments.length === urlSegments.length &&
      pageSegments.every(
        (segment, i) => segment.startsWith("[") || segment === urlSegments[i],
      )
    );
  });
}

const isExcluded = (route: string) =>
  A11Y_EXCLUDED_ROUTES.some((excluded) => excluded.route === route) ||
  A11Y_EXCLUDED_PREFIXES.some(({ prefix }) => route.startsWith(prefix));

describe("the axe scan's route list", () => {
  it("covers every public, non-dynamic page, or says why a page is left out", () => {
    const neverScanned = publicStaticPages.filter(
      (route) => !A11Y_ROUTES.includes(route) && !isExcluded(route),
    );
    expect(neverScanned).toEqual([]);
  });

  it("only scans URLs that a page actually serves, so a rename cannot scan the 404 page", () => {
    const scansNothing = A11Y_ROUTES.filter((route) => !isServedByAPage(route));
    expect(scansNothing).toEqual([]);
  });

  // Only single pages: a section prefix is allowed to contain the one or two
  // pages that stand in for it.
  it("does not excuse a single page it also scans", () => {
    const both = A11Y_EXCLUDED_ROUTES.map(({ route }) => route).filter((route) =>
      A11Y_ROUTES.includes(route),
    );
    expect(both).toEqual([]);
  });

  it("does not keep an exclusion for a page that no longer exists", () => {
    const stale = A11Y_EXCLUDED_ROUTES.map(({ route }) => route).filter(
      (route) => !publicStaticPages.includes(route),
    );
    expect(stale).toEqual([]);
  });

  it("does not keep a prefix exclusion that matches no page", () => {
    const stale = A11Y_EXCLUDED_PREFIXES.map(({ prefix }) => prefix).filter(
      (prefix) => !publicStaticPages.some((route) => route.startsWith(prefix)),
    );
    expect(stale).toEqual([]);
  });

  it("gives every exclusion a reason", () => {
    const unexplained = [
      ...A11Y_EXCLUDED_ROUTES.map(({ route, reason }) => ({ id: route, reason })),
      ...A11Y_EXCLUDED_PREFIXES.map(({ prefix, reason }) => ({ id: prefix, reason })),
    ].filter(({ reason }) => reason.trim().length < 20);
    expect(unexplained).toEqual([]);
  });

  it("lists each route once", () => {
    expect(new Set(A11Y_ROUTES).size).toBe(A11Y_ROUTES.length);
  });
});
