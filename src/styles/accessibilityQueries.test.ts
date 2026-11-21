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
 * It looks inside each media query's block, not just for its header. A header
 * with an empty or wrong body is the same gap with a passing test.
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

/** The body of the brace block that opens at `openIndex`, nested rules included. */
function bodyFrom(source: string, openIndex: number): { body: string; end: number } {
  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return { body: source.slice(openIndex + 1, i), end: i + 1 };
    }
  }
  throw new Error("unbalanced braces in stylesheet");
}

/** Every `@media <query>` block in the source, as its body text. */
function mediaBlocks(source: string, query: RegExp): string[] {
  const header = new RegExp(`@media\\s*\\(${query.source}\\)\\s*\\{`, "g");
  return [...source.matchAll(header)].map((match) => {
    const openIndex = (match.index ?? 0) + match[0].length - 1;
    return bodyFrom(source, openIndex).body;
  });
}

/** The source with every block of a given media query cut out of it. */
function withoutMediaBlocks(source: string, query: RegExp): string {
  const header = new RegExp(`@media\\s*\\(${query.source}\\)\\s*\\{`);
  let remaining = source;
  for (let match = header.exec(remaining); match; match = header.exec(remaining)) {
    const openIndex = match.index + match[0].length - 1;
    remaining = remaining.slice(0, match.index) + remaining.slice(bodyFrom(remaining, openIndex).end);
  }
  return remaining;
}

describe("accessibility media queries", () => {
  const source = css();

  it("frosts glass to solid under prefers-reduced-transparency", () => {
    const blocks = mediaBlocks(source, /prefers-reduced-transparency:\s*reduce/);
    expect(blocks.length).toBeGreaterThan(0);
    // The class-based glass has to drop its blur; matching the selector keeps
    // another block's `backdrop-filter: none` from covering for it.
    expect(blocks.join("\n")).toMatch(/\.glass-card[^{]*\{[^}]*(?<![-\w])backdrop-filter:\s*none/);
  });

  it("strengthens borders under prefers-contrast: more", () => {
    const blocks = mediaBlocks(source, /prefers-contrast:\s*more/);
    expect(blocks.length).toBeGreaterThan(0);
    const joined = blocks.join("\n");
    // Once for the light theme and once for dark.
    expect(joined.match(/--color-border\s*:/g)).toHaveLength(2);
    expect(joined.match(/--glass-border\s*:/g)).toHaveLength(2);
  });

  it("eases the theme brightness change, and only when motion is allowed", () => {
    const gated = mediaBlocks(source, /prefers-reduced-motion:\s*no-preference/).join("\n");
    expect(gated).toMatch(/--theme-transition\s*:/);
    expect(gated).toMatch(/transition:\s*var\(--theme-transition\)/);

    // Nothing outside the no-preference block may apply it, or the gate means nothing.
    const ungated = withoutMediaBlocks(source, /prefers-reduced-motion:\s*no-preference/);
    expect(ungated).not.toMatch(/transition:\s*var\(--theme-transition\)/);
  });

  it("kills the hotspot-pulse and scroll-hint loops under reduced motion", () => {
    // Every other CSS loop already carries a reduced-motion guard; these two
    // were the audit's outstanding gaps.
    const blocks = mediaBlocks(source, /prefers-reduced-motion:\s*reduce/).join("\n");
    expect(blocks).toMatch(/\.hotspot-ring\s*\{[^}]*animation:\s*none/);
    expect(blocks).toMatch(/\.animate-scroll-hint\s*\{[^}]*animation:\s*none/);
  });
});
