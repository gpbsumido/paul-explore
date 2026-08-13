import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * A page that reads the session must never be statically renderable.
 *
 * This is the regression test for the Messenger auth bug, which the write-up
 * for it correctly listed as missing. A user opened the site from Facebook
 * Messenger and saw the signed-in hub without ever logging in, because the root
 * page had been treated as statically renderable and cached at the edge.
 *
 * The subtle part is why that was possible at all. `auth0.getSession()` calls
 * `cookies()` from next/headers, which is what normally forces a route to be
 * dynamic — but that call happens inside the Auth0 library, and the detection
 * has to see through the indirection to work. When it does not, the page is
 * cached and the cache does not know who it is holding.
 *
 * So the fix was an explicit `force-dynamic` rather than trusting the
 * detection, and this asserts that every session-reading page has one. Today
 * the build marks them all dynamic anyway; the point is that it keeps doing so
 * after a refactor moves a session read behind one more layer, or a framework
 * upgrade changes what the detection can see.
 */
const APP = join(process.cwd(), "src", "app");

type Page = { route: string; source: string };

function collect(dir: string, found: Page[] = []): Page[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collect(full, found);
    else if (entry.name === "page.tsx") {
      const rel = relative(APP, full).replace(/\/?page\.tsx$/, "");
      found.push({ route: `/${rel}`, source: readFileSync(full, "utf8") });
    }
  }
  return found;
}

const pages: Page[] = collect(APP);

/** Anything that resolves the current user, however it is spelled. */
const READS_SESSION = /getSession\s*\(|auth0\.getSession|requireSession/;

/** The two ways to opt a route out of static rendering. */
const OPTS_OUT =
  /export\s+const\s+dynamic\s*=\s*["']force-dynamic["']|export\s+const\s+revalidate\s*=\s*0\b/;

describe("pages that read the session", () => {
  it("never rely on the framework noticing for them", () => {
    const relying = pages
      .filter((p) => READS_SESSION.test(p.source))
      .filter((p) => !OPTS_OUT.test(p.source))
      .map((p) => p.route);

    expect(relying).toEqual([]);
  });

  it("found the pages it claims to be checking", () => {
    expect(pages.length).toBeGreaterThan(50);
    // If this drops to zero the regex has rotted and the test above passes
    // vacuously, which is worse than failing.
    expect(pages.filter((p) => READS_SESSION.test(p.source)).length).toBeGreaterThan(0);
  });
});
