import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Guards against verifying the wrong thing, rather than against broken code.
 *
 * node_modules held an older @paul-portfolio build than package.json asked for,
 * so a suite "proved" a fix that was not installed. That happened twice in one
 * sitting, and both times the suite passed. A test run against the wrong inputs
 * does not fail — it passes, which is the whole problem.
 */
const root = process.cwd();
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));

function compare(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}

describe("installed dependencies match what package.json asks for", () => {
  const declared = Object.entries(
    (pkg.dependencies ?? {}) as Record<string, string>,
  ).filter(([name]) => name.startsWith("@paul-portfolio/"));

  it("finds the design system packages declared", () => {
    expect(declared.length).toBeGreaterThan(0);
  });

  for (const [name, range] of declared) {
    it(`${name} on disk satisfies ${range}`, () => {
      const installed = JSON.parse(
        readFileSync(join(root, "node_modules", name, "package.json"), "utf-8"),
      ).version as string;
      const min = range.replace(/^[\^~]/, "");

      expect(
        compare(installed, min),
        `${name} is ${installed} on disk but package.json asks for ${range}. ` +
          `Run pnpm install — until then every suite tests the older package ` +
          `while reporting on the newer one.`,
      ).toBeGreaterThanOrEqual(0);
    });
  }
});
