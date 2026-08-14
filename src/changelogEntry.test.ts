import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pkg from "../package.json";

/**
 * Whatever version package.json is on has to be written down.
 *
 * The changelog fell twenty versions behind without anything failing, while the
 * README went on calling it "a running log of changes/additions". Nothing read
 * the file, so nothing noticed -- the log stopped at 4.0.0 while the app shipped
 * 4.5.6, and every release in between was undocumented.
 *
 * This is deliberately the weakest useful check. It cannot tell whether an entry
 * is any good, only that the version bump and the note about it happen together
 * rather than the second one being left for later, which is where it was lost.
 */
const ROOT = join(process.cwd());

const changelog = (): string =>
  readFileSync(join(ROOT, "CHANGELOG.md"), "utf-8");

/** Versions the changelog documents, in the order it lists them. */
const documented = (source: string): string[] =>
  [...source.matchAll(/^## .*version (\d+\.\d+\.\d+)\s*$/gm)].map((m) => m[1]);

describe("changelog", () => {
  it("has an entry for the version package.json is on", () => {
    expect(documented(changelog())).toContain(pkg.version);
  });

  it("gives that entry something to say", () => {
    const source = changelog();
    const start = source.indexOf(`version ${pkg.version}`);
    const next = source.indexOf("\n## ", start);
    const body = source.slice(start, next === -1 ? undefined : next);

    // A heading with nothing under it satisfies the check above while
    // documenting nothing, which is the obvious way to game it.
    expect(body.split("\n").filter((l) => l.trim().startsWith("- ")).length)
      .toBeGreaterThan(0);
  });

  /**
   * Five versions had two headings each, with different notes under each half.
   * Nothing was wrong with the content -- it was just split, so reading the log
   * for what a release contained gave you half of it and no hint there was more.
   * They are merged now, and this stops the split happening again.
   */
  it("gives each version exactly one heading", () => {
    const counts = new Map<string, number>();
    for (const v of documented(changelog())) {
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const repeated = [...counts]
      .filter(([, n]) => n > 1)
      .map(([version]) => version);

    expect(repeated).toEqual([]);
  });

  it("actually reads versions out, so a rotted regex fails rather than passes", () => {
    expect(documented("## 2026-08-14 - version 4.5.6\n\n- a note\n")).toEqual([
      "4.5.6",
    ]);
    expect(documented("## not a version heading\n")).toEqual([]);
  });
});
