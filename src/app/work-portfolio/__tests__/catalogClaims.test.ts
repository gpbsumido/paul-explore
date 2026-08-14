import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PROJECTS, FEATURES } from "../_data/catalog";

/**
 * Prose that counts the catalog has to agree with the catalog.
 *
 * Two demos came out after this shipped, Streaming Ops and Economy & Financial
 * Health, taking it from 24 features across 11 projects down to 22 across 10.
 * catalog.test.ts was updated both times, so nothing failed. The places that
 * write the number out in words were not, and the write-up went on advertising
 * two demos that are not there.
 *
 * The page and the write-up now derive their counts -- the server component
 * reads the catalog and hands the numbers down -- so most of this is belt and
 * braces against someone typing a literal back in.
 *
 * featureData.data.ts is the one that genuinely cannot derive them. It feeds
 * the command palette registry, which sits in the root layout, so importing
 * the catalog there would put 21KB of it in every route in the app. That is
 * the mistake featureDataImports.test.ts already exists to prevent. Its string
 * stays a literal, and this is what checks it.
 */

const ROOT = process.cwd();

/** Everywhere the count is stated in prose rather than derived from the data. */
const CLAIM_FILES = [
  "src/app/work-portfolio/page.tsx",
  "src/app/work-portfolio/_data/types.ts",
  "src/app/thoughts/work-portfolio/page.tsx",
  "src/app/thoughts/work-portfolio/WorkPortfolioThoughtsContent.tsx",
  "src/app/_shared/featureData.data.ts",
];

const FEATURE_CLAIM = /(\d+)[\s-]+(?:feature demos|demoable features|features?|demos?)\b/gi;
const PROJECT_CLAIM = /(\d+)[\s-]+(?:past projects|old jobs|projects?)\b/gi;

const claimsIn = (source: string, pattern: RegExp): number[] =>
  [...source.matchAll(pattern)].map((match) => Number(match[1]));

const read = (file: string): string => readFileSync(join(ROOT, file), "utf-8");

describe("work portfolio counts", () => {
  it.each(CLAIM_FILES)("counts features correctly in %s", (file) => {
    const wrong = claimsIn(read(file), FEATURE_CLAIM).filter(
      (claimed) => claimed !== FEATURES.length,
    );
    expect(wrong).toEqual([]);
  });

  it.each(CLAIM_FILES)("counts projects correctly in %s", (file) => {
    const wrong = claimsIn(read(file), PROJECT_CLAIM).filter(
      (claimed) => claimed !== PROJECTS.length,
    );
    expect(wrong).toEqual([]);
  });

  it("actually reads a stale claim, so the check can fail", () => {
    const stale = "Rebuilding 24 features from 11 old jobs";
    expect(claimsIn(stale, FEATURE_CLAIM)).toEqual([24]);
    expect(claimsIn(stale, PROJECT_CLAIM)).toEqual([11]);
  });
});
