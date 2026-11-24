import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const THOUGHTS_DIR = join(process.cwd(), "src/app/thoughts");

/** Every non-test .tsx source under a write-up's folder, sections included. */
function sourcesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx") && !entry.name.includes(".test."))
    .map((entry) => readFileSync(join(entry.parentPath, entry.name), "utf8"));
}

function idsMatching(sources: string[], pattern: RegExp): string[] {
  return sources.flatMap((source) => [...source.matchAll(pattern)].map((match) => match[1]));
}

const pagesWithTimelines = readdirSync(THOUGHTS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
  .map((entry) => ({ slug: entry.name, sources: sourcesUnder(join(THOUGHTS_DIR, entry.name)) }))
  .filter(({ sources }) => sources.some((source) => source.includes("<UpdateTimeline")));

/**
 * The timeline at the top of a write-up is the only way to know it has updates
 * further down. It's typed out by hand, so it drifts: the TCG page listed one
 * of its four. Both directions are checked, so a timeline can't point at an
 * update that was renamed either.
 */
describe("write-up update timelines", () => {
  it.each(pagesWithTimelines)("$slug lists every update it has, and only those", ({ sources }) => {
    const updateIds = idsMatching(sources, /\bid="(update-[^"]+)"/g);
    const timelineIds = idsMatching(sources, /\bid: "(update-[^"]+)"/g);
    expect([...timelineIds].sort()).toEqual([...updateIds].sort());
  });
});
