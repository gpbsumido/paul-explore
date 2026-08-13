import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Every stepped demo drives its keyboard from the same hook.
 *
 * The learn write-up listed this as a gap in its own words: the hook is
 * covered, but nothing stopped a page wiring it up differently. Thirteen demos
 * that mostly agree about what the arrow keys do is worse than thirteen that
 * disagree openly, because the exception is the one nobody finds — you only
 * notice by tabbing into a demo and pressing a key that does nothing.
 *
 * So the rule is narrow and checkable: no learn page implements arrow-key
 * stepping itself. Anything that wants it goes through useStepPlayer, which is
 * where the behaviour is defined and tested once.
 */
const LEARN = join(process.cwd(), "src", "app", "learn");

/** Every .tsx under one demo directory, concatenated. */
function sourceOf(dir: string): string {
  const found: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".tsx") && !entry.name.includes(".test."))
        found.push(readFileSync(full, "utf8"));
    }
  };
  walk(dir);
  return found.join("\n");
}

const demos = readdirSync(LEARN)
  .filter((name) => name !== "__tests__")
  .map((name) => ({ name, dir: join(LEARN, name) }))
  .filter((d) => statSync(d.dir).isDirectory() && existsSync(join(d.dir, "page.tsx")))
  .map((d) => ({ ...d, source: sourceOf(d.dir) }));

/** Arrow-key stepping, spelled any of the ways it gets spelled. */
const HANDLES_ARROWS = /["']Arrow(Left|Right)["']/;

describe("learn demos agree about the keyboard", () => {
  it("never hand-roll arrow-key stepping", () => {
    const rolled = demos.filter((d) => HANDLES_ARROWS.test(d.source)).map((d) => d.name);
    expect(rolled).toEqual([]);
  });

  it("drives every stepped demo through the shared hook", () => {
    // A demo with previous/next controls but no hook is the case this exists
    // for: it will have got its keyboard behaviour from somewhere else, or from
    // nowhere.
    const stepped = demos.filter((d) => /useStepPlayer/.test(d.source));
    expect(stepped.length).toBeGreaterThan(5);
  });

  it("found the demos it claims to be checking", () => {
    expect(demos.length).toBeGreaterThan(10);
  });
});
