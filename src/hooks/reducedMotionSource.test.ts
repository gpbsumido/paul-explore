import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const SRC = path.resolve(__dirname, "..");

/** Every .ts/.tsx source file under src, tests excluded. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    if (!/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) return [];
    return [full];
  });
}

const files = sourceFiles(SRC).map((file) => ({
  file: path.relative(SRC, file),
  text: readFileSync(file, "utf8"),
}));

/**
 * The motion preference has one source: usePrefersReducedMotion, which reads
 * through useSyncExternalStore so the server and the hydrating client agree.
 * Framer's useReducedMotion reads matchMedia on the first client render, so a
 * reduced-motion visitor's hydration disagreed with the server HTML. The old
 * context in app/providers was a second copy of the same store that pulled
 * components into importing the app shell.
 */
describe("reduced motion has one source", () => {
  it("never reads framer-motion's useReducedMotion", () => {
    const offenders = files
      .filter(({ text }) => /import[^;]*\buseReducedMotion\b[^;]*from "framer-motion"/.test(text))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("never reads the old app-shell context", () => {
    const offenders = files
      .filter(({ text }) => /\buseHubReducedMotion\b/.test(text))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("is only read from matchMedia inside usePrefersReducedMotion", () => {
    // A component reading matchMedia itself sees the real value on its first
    // client render, while the server rendered full motion.
    const offenders = files
      .filter(({ text }) => text.includes('matchMedia("(prefers-reduced-motion'))
      .map(({ file }) => file)
      .filter((file) => file !== path.join("hooks", "usePrefersReducedMotion.ts"));
    expect(offenders).toEqual([]);
  });
});
