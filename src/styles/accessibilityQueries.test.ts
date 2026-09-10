import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The app is built on translucent glass and animated chrome. Three OS-level
 * accessibility signals have to be honoured, and it's easy to ship a glass
 * surface or a looping animation that silently ignores them. This guard reads
 * the real CSS and fails if any of the three is missing, so a new surface can't
 * quietly reintroduce the gap.
 *
 * See plans/apple-design-audit — Tier 1.
 */
const css = (): string => {
  const dir = join(process.cwd(), "src");
  return [
    readFileSync(join(dir, "app", "globals.css"), "utf-8"),
    readFileSync(join(dir, "styles", "tokens.css"), "utf-8"),
  ].join("\n");
};

describe("accessibility media queries", () => {
  const source = css();

  it("frosts glass to solid under prefers-reduced-transparency", () => {
    expect(source).toMatch(/@media\s*\(prefers-reduced-transparency:\s*reduce\)/);
  });

  it("strengthens borders/contrast under prefers-contrast: more", () => {
    expect(source).toMatch(/@media\s*\(prefers-contrast:\s*more\)/);
  });

  it("eases the theme brightness change instead of snapping", () => {
    // A transition on background/color, gated behind a no-reduced-motion query
    // so it can't reintroduce vestibular motion.
    expect(source).toMatch(/theme-transition|--theme-transition/);
  });

  it("kills the hotspot-pulse and scroll-hint loops under reduced motion", () => {
    // Every other CSS loop already carries a reduced-motion guard; these two
    // were the audit's outstanding gaps.
    expect(source).toMatch(/hotspot-ring[\s\S]*?animation:\s*none|animation:\s*none[\s\S]*?hotspot/i);
    expect(source).toMatch(/scroll-hint[\s\S]*?animation:\s*none|animation:\s*none[\s\S]*?scroll-hint/i);
  });
});
