import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The app owns no palette values. It aliases them.
 *
 * `src/styles/tokens.css` is a seam: every colour ramp it exposes to CSS
 * Modules and to the Tailwind `@theme` bridge is `var(--paul-color-*)`, handed
 * down by @paul-portfolio/tokens. That only works while the names on both
 * sides agree, and a mismatch is close to invisible -- an alias pointing at a
 * name the package stopped shipping is invalid at computed-value time, so the
 * property falls back to inherited or unset rather than erroring. The page
 * still renders, just in the wrong colours.
 *
 * Nothing checked that until the palette moved into the package, which is when
 * a rename in another repo became something that could quietly repaint this
 * one.
 */
const ROOT = process.cwd();

const appTokens = (): string =>
  readFileSync(join(ROOT, "src/styles/tokens.css"), "utf-8");

const packageTokens = (): string =>
  readFileSync(
    join(ROOT, "node_modules/@paul-portfolio/tokens/build/tokens.css"),
    "utf-8",
  );

/** The --paul-* names a stylesheet reads through var(). */
const referenced = (source: string): string[] => [
  ...new Set(
    [...source.matchAll(/var\((--paul-[a-z0-9_-]+)\)/g)].map((m) => m[1]),
  ),
];

/** The custom properties a stylesheet declares. */
const declared = (source: string): string[] => [
  ...new Set(
    [...source.matchAll(/^\s*(--[a-z0-9_-]+)\s*:/gm)].map((m) => m[1]),
  ),
];

/** Ramps the design system owns end to end. */
const OWNED_RAMPS = [
  "primary",
  "secondary",
  "neutral",
  "error",
  "success",
  "warning",
] as const;

describe("token seam", () => {
  it("resolves every --paul-* alias against the installed package", () => {
    const defined = new Set(declared(packageTokens()));
    const dangling = referenced(appTokens()).filter((n) => !defined.has(n));

    expect(dangling).toEqual([]);
  });

  it("reads a palette value down from the package rather than restating it", () => {
    expect(packageTokens()).toMatch(/--paul-color-primary-500:\s*#219b84/);
    expect(appTokens()).toContain(
      "--color-primary-500: var(--paul-color-primary-500)",
    );
  });

  /**
   * The failure this stops is a local literal creeping back in. Copying a hex
   * into a ramp here looks harmless and works on the day, then the package
   * moves and this app is the one place that did not follow.
   */
  it("keeps the owned ramps free of hardcoded values", () => {
    const literals = appTokens()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) =>
        OWNED_RAMPS.some((ramp) =>
          new RegExp(`^--color-${ramp}-\\d+\\s*:`).test(line),
        ),
      )
      .filter((line) => !line.includes("var(--paul-color-"));

    expect(literals).toEqual([]);
  });

  it("actually extracts names, so a rotted regex fails rather than passes", () => {
    expect(referenced("a { color: var(--paul-color-primary-500); }")).toEqual([
      "--paul-color-primary-500",
    ]);
    expect(referenced("a { color: red; }")).toEqual([]);
    expect(declared(":root {\n  --paul-radius-sm: 2px;\n}")).toEqual([
      "--paul-radius-sm",
    ]);
  });
});
