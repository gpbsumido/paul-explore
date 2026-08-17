import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const V5 = join(process.cwd(), "src/app/v5");

/** Every source file the landing renders from, tests excluded. */
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    if (!/\.tsx?$/.test(entry.name)) return [];
    if (/\.test\.tsx?$/.test(entry.name)) return [];
    return [path];
  });
}

const files = () => sources(V5);
const read = (file: string) => readFileSync(file, "utf-8");

/**
 * The two anti-slop rules on this page that a person cannot reliably audit by
 * eye, made mechanical. Both are about the tells that make a page read as
 * generated: the em-dash habit, and an uppercase micro-label stacked above
 * every single section heading.
 */
describe("v5 landing copy discipline", () => {
  it("has sources to check, so a rotted glob fails rather than passes", () => {
    expect(files().length).toBeGreaterThan(5);
  });

  it("ships no em-dash or en-dash anywhere in the landing sources", () => {
    const offenders = files().filter((file) => /[—–]/.test(read(file)));
    expect(offenders.map((f) => f.replace(`${process.cwd()}/`, ""))).toEqual([]);
  });

  it("keeps the uppercase eyebrow under the one-per-three-sections budget", () => {
    // Seven sections, so the budget is three. The page ships none: a section's
    // position on the page already says what it is.
    const eyebrows = files().reduce(
      (total, file) =>
        total + (read(file).match(/uppercase[^"'`]*tracking/g) ?? []).length,
      0,
    );
    expect(eyebrows).toBeLessThanOrEqual(3);
  });

  it("does not reach for a scroll cue", () => {
    const offenders = files().filter((file) =>
      /Scroll to (explore|discover|see)/i.test(read(file)),
    );
    expect(offenders).toEqual([]);
  });
});
