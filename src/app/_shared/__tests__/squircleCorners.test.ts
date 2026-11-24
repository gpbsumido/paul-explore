import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Apple-style continuous corners. corner-shape is progressive enhancement
// (Chromium-only in 2026, falls back to a normal rounded corner), so it's safe
// to apply broadly — the one hard rule is that circles and pills must be
// excluded, because squircle visibly distorts a corner whose radius is half the
// side. This guards both halves of that.
const css = readFileSync(
  join(process.cwd(), "src/app/globals.css"),
  "utf8",
);

/** The selector of the one rule that sets corner-shape: squircle. */
function squircleSelector(): string {
  const rule = css.match(/([^{}]+)\{[^{}]*corner-shape:\s*squircle[^{}]*\}/);
  if (!rule) throw new Error("no rule sets corner-shape: squircle");
  return rule[1].replace(/\s+/g, "");
}

describe("squircle corners", () => {
  it("gives rounded utilities the squircle corner shape", () => {
    expect(squircleSelector()).toContain('[class*="rounded"]');
  });

  it("excludes fully-round elements so circles and pills stay round", () => {
    expect(squircleSelector()).toContain(':not([class*="rounded-full"])');
  });

  it("excludes square corners, which have no radius to shape", () => {
    expect(squircleSelector()).toContain(':not([class*="rounded-none"])');
  });
});
