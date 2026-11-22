import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const APP = path.join(process.cwd(), "src", "app");

/** Every error.tsx under src/app, plus the root global-error.tsx. */
function boundaries(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return boundaries(full);
    return entry.name === "error.tsx" ? [full] : [];
  });
}

/**
 * Most failures a page shows are a server render that couldn't reach an API.
 * `reset` re-renders the same failed payload, so "Try again" did nothing until
 * a full reload. `retry` fetches the segment again, which is the point of the
 * button.
 */
describe("error boundaries", () => {
  it.each(
    [...boundaries(APP), path.join(APP, "global-error.tsx")].map((file) =>
      path.relative(process.cwd(), file),
    ),
  )(
    "%s retries by fetching again rather than resetting",
    (file) => {
      const source = readFileSync(file, "utf8");
      expect(source).toMatch(/\bretry\b/);
      expect(source).not.toMatch(/\breset\b/);
    },
  );

  it("catches a failure on any page, not just the feature routes", () => {
    // Without a root boundary a write-up, the landing page or /settings fell
    // through to the framework's bare error screen.
    expect(existsSync(path.join(APP, "error.tsx"))).toBe(true);
  });

  it("catches a failure in the root layout itself", () => {
    expect(existsSync(path.join(APP, "global-error.tsx"))).toBe(true);
  });
});

/**
 * The first boundary out from a segment: its nearest ancestor with an
 * error.tsx, or the app root, which always has one.
 */
function enclosingBoundary(dir: string): string {
  const parent = path.dirname(dir);
  if (parent === APP || existsSync(path.join(parent, "error.tsx"))) return parent;
  return enclosingBoundary(parent);
}

/** Whether a layout.tsx sits in `dir` or any segment above it, up to but not including `boundary`. */
function layoutBetween(dir: string, boundary: string): boolean {
  if (dir === boundary) return false;
  return existsSync(path.join(dir, "layout.tsx")) || layoutBetween(path.dirname(dir), boundary);
}

/**
 * A boundary renders inside every layout above it. With the root boundary in
 * place, a nested one only changes anything when a layout sits between the two,
 * because that layout stays on screen around the error instead of being
 * thrown away. Thirty identical copies of the root boundary had piled up on
 * feature routes with no layout of their own, each one a file to keep in step
 * for no visible difference.
 */
describe("nested error boundaries", () => {
  const nested = boundaries(APP)
    .map((file) => path.dirname(file))
    .filter((dir) => dir !== APP);

  it.each(nested.map((dir) => path.relative(process.cwd(), dir)))(
    "%s keeps a layout on screen that the next boundary out would drop",
    (relativeDir) => {
      const dir = path.join(process.cwd(), relativeDir);
      expect(layoutBetween(dir, enclosingBoundary(dir))).toBe(true);
    },
  );
});
