import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Guards for the two crawler files whose failure modes are silent.
 *
 * The sitemap already has a test that walks src/app and fails when the route
 * list and the pages on disk disagree. These two files were noted as having the
 * same drift problem and no equivalent guard, which is a fair description of
 * how they were left rather than a reason to leave them there.
 */
const ROOT = process.cwd();
const APP = join(ROOT, "src", "app");

describe("security.txt", () => {
  const source = readFileSync(join(ROOT, "public/.well-known/security.txt"), "utf8");

  it("has not expired, and is not about to", () => {
    // RFC 9116 requires an Expires field, and a lapsed one is worse than
    // absent: the file still serves, still looks maintained, and researchers
    // are told to disregard it. Nothing anywhere announces the date passing.
    const match = /^Expires:\s*(.+)$/m.exec(source);
    expect(match, "security.txt must carry an Expires field").not.toBeNull();

    const expires = new Date(match![1].trim());
    expect(Number.isNaN(expires.getTime())).toBe(false);

    // Thirty days of warning, so this fails while there is still time to fix it
    // rather than the morning it lapses.
    const thirtyDays = Date.now() + 30 * 24 * 60 * 60 * 1000;
    expect(expires.getTime()).toBeGreaterThan(thirtyDays);
  });

  it("points at a contact that is not an email address", () => {
    // Deliberate: this repository is public, so a committed address is
    // published to every scraper permanently, and removing it later leaves it
    // in the history.
    const contact = /^Contact:\s*(.+)$/m.exec(source);
    expect(contact).not.toBeNull();
    expect(contact![1]).not.toMatch(/mailto:|@/);
  });
});

describe("llms.txt", () => {
  const source = readFileSync(join(ROOT, "public/llms.txt"), "utf8");

  /** Every site-relative path the file names, deduplicated. */
  const paths = [
    ...new Set(
      [...source.matchAll(/https:\/\/paulsumido\.com(\/[a-z0-9/-]*)/gi)]
        .map((m) => m[1].replace(/\/$/, ""))
        .filter(Boolean),
    ),
  ];

  /** Does a page.tsx exist for this URL path? */
  const pageExists = (route: string): boolean =>
    existsSync(join(APP, route, "page.tsx"));

  it("names paths that still exist", () => {
    // It is hand-written prose naming specific write-ups, so it drifts the
    // moment one is renamed — and a file telling a crawler where to look is
    // worth nothing when it points at pages that moved.
    const dead = paths.filter((p) => p !== "" && !pageExists(p));
    expect(dead).toEqual([]);
  });

  it("found paths to check, so a rotted regex fails rather than passes", () => {
    expect(paths.length).toBeGreaterThan(3);
  });

  it("does not name a write-up that no longer exists", () => {
    const thoughts = readdirSync(join(APP, "thoughts")).filter((d) =>
      existsSync(join(APP, "thoughts", d, "page.tsx")),
    );
    const named = paths
      .filter((p) => p.startsWith("/thoughts/"))
      .map((p) => p.replace("/thoughts/", ""));
    const missing = named.filter((slug) => !thoughts.includes(slug));
    expect(missing).toEqual([]);
  });
});
