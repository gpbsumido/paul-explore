import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The palette is written down twice.
 *
 * src/styles/tokens.css defines :root for CSS Modules and inline styles;
 * src/app/globals.css restates the same mappings inside @theme so Tailwind can
 * build utilities from them. It has to be both, because @theme cannot reference
 * a variable that @theme itself defines without a circular reference.
 *
 * The failure mode has no symptom until it does: change a hex in one file and
 * `bg-primary-600` disagrees with `var(--color-primary-600)`, on whichever
 * page happens to use the other one. Nothing errors, nothing logs, and the two
 * halves of the app are just slightly different colours.
 *
 * So the parity is checked rather than remembered.
 */
const ROOT = process.cwd();

const read = (path: string) => readFileSync(join(ROOT, path), "utf-8");

/** Pull `--color-x: value;` pairs out of the first block matching a header. */
function colorTokens(source: string, blockPattern: RegExp): Map<string, string> {
  const start = source.search(blockPattern);
  if (start === -1) throw new Error(`block not found: ${blockPattern}`);

  // Walk braces from the block header so a nested rule cannot end it early.
  const open = source.indexOf("{", start);
  let depth = 0;
  let end = open;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  const body = source.slice(open, end);
  const tokens = new Map<string, string>();
  for (const match of body.matchAll(/(--color-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    tokens.set(match[1], match[2].trim());
  }
  return tokens;
}

describe("colour token parity", () => {
  const rootTokens = colorTokens(read("src/styles/tokens.css"), /^:root\b/m);
  const themeTokens = colorTokens(read("src/app/globals.css"), /^@theme\b/m);

  it("reads real tokens out of both files", () => {
    expect(rootTokens.size).toBeGreaterThan(50);
    expect(themeTokens.size).toBeGreaterThan(50);
    expect(rootTokens.get("--color-primary-600")).toBeTruthy();
    expect(themeTokens.get("--color-primary-600")).toBeTruthy();
  });

  it("agrees on every colour it defines in both places", () => {
    const shared = [...themeTokens.keys()].filter((name) =>
      rootTokens.has(name),
    );
    expect(shared.length).toBeGreaterThan(50);

    const drifted = shared
      .filter((name) => rootTokens.get(name) !== themeTokens.get(name))
      .map(
        (name) =>
          `${name}: tokens.css=${rootTokens.get(name)} globals.css=${themeTokens.get(name)}`,
      );

    expect(drifted).toEqual([]);
  });

  it("bridges every identity ramp to Tailwind", () => {
    for (const ramp of ["primary", "secondary", "neutral"]) {
      for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
        expect(themeTokens.has(`--color-${ramp}-${step}`)).toBe(true);
      }
    }
  });

  it("keeps the identity ramps off the stock Tailwind palette", () => {
    // The whole point of the refresh. These are the stock hexes the app used
    // to ship, and finding one back in the ramp means a revert crept in.
    const stock = ["#3b82f6", "#8b5cf6", "#6b7280", "#2563eb", "#7c3aed"];
    for (const [name, value] of rootTokens) {
      if (!/^--color-(primary|secondary|neutral)-/.test(name)) continue;
      expect(stock).not.toContain(value.toLowerCase());
    }
  });
});
