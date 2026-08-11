import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { PUBLIC_ROUTES, isIndexableRoute } from "./publicRoutes";
import { isSessionProtectedPath } from "./protectedPaths";

/** Every route that has a page.tsx, as a URL path. */
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

describe("isIndexableRoute", () => {
  it("keeps an ordinary public page", () => {
    expect(isIndexableRoute("/thoughts/security")).toBe(true);
    expect(isIndexableRoute("/")).toBe(true);
  });

  it("drops a route with a dynamic segment, since there is no one URL to list", () => {
    expect(isIndexableRoute("/tcg/pokemon/card/[cardId]")).toBe(false);
    expect(isIndexableRoute("/calendar/events/[id]")).toBe(false);
  });

  it("drops the dev-only skeleton pages", () => {
    expect(isIndexableRoute("/dev/skeletons")).toBe(false);
    expect(isIndexableRoute("/dev/v4")).toBe(false);
  });

  it("drops anything behind a login, which a crawler can only ever get a redirect from", () => {
    expect(isIndexableRoute("/settings")).toBe(false);
    expect(isIndexableRoute("/calendar")).toBe(false);
  });
});

describe("PUBLIC_ROUTES", () => {
  it("lists every indexable page that exists, so a new page cannot be quietly left out", () => {
    const expected = routesOnDisk().filter(isIndexableRoute).sort();
    expect([...PUBLIC_ROUTES].sort()).toEqual(expected);
  });

  it("lists nothing that is gated, dynamic, or dev-only", () => {
    for (const route of PUBLIC_ROUTES) {
      expect(route.includes("[")).toBe(false);
      expect(route.startsWith("/dev")).toBe(false);
      expect(isSessionProtectedPath(route)).toBe(false);
    }
  });

  it("gives every route an absolute path and no trailing slash", () => {
    for (const route of PUBLIC_ROUTES) {
      expect(route.startsWith("/")).toBe(true);
      if (route !== "/") expect(route.endsWith("/")).toBe(false);
    }
  });

  it("has no duplicates", () => {
    expect(new Set(PUBLIC_ROUTES).size).toBe(PUBLIC_ROUTES.length);
  });
});
