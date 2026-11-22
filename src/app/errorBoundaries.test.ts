import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const APP = path.join(process.cwd(), "src", "app");

/** Every error.tsx under src/app. */
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
  it.each(boundaries(APP).map((file) => path.relative(process.cwd(), file)))(
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
