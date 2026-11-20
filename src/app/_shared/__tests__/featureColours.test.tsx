import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FEATURES, FeatureCard, FEATURE_TOKEN } from "../featureData";
import { contrastRatio } from "@/components/ui/readableOn";

/**
 * A feature has two colours: a theme-aware token pair in tokens.css, and one
 * hex in the data for the places that can't switch on theme (reel dots, graph
 * nodes). The hex is meant to be derived from the pair. When the palette was
 * swapped, four of them weren't, so Vitals was purple on its card tint and
 * green on its dot.
 */
const tokensCss = readFileSync(join(process.cwd(), "src/styles/tokens.css"), "utf8");
const dsTokensCss = readFileSync(
  join(process.cwd(), "node_modules/@paul-portfolio/tokens/build/tokens.css"),
  "utf8",
);

/** The first declaration of a variable is the light half of the pair. */
function firstHex(css: string, variable: string): string {
  const match = css.match(new RegExp(`${variable}: (#[0-9a-f]{6});`));
  if (!match) throw new Error(`${variable} is not declared as a hex`);
  return match[1];
}

/** Every declaration of a variable, light first then dark. */
function allHexes(css: string, variable: string): string[] {
  return [...css.matchAll(new RegExp(`${variable}: (#[0-9a-f]{6});`, "g"))].map(
    (m) => m[1],
  );
}

function hueOf(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  const raw =
    max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return (raw * 60 + 360) % 360;
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

const tokenised = FEATURES.filter((feature) => FEATURE_TOKEN[feature.id]);

describe("feature colours", () => {
  it.each(tokenised.map((f) => [f.id, f] as const))(
    "%s has the same hue in its data colour as in its token",
    (_id, feature) => {
      const token = firstHex(tokensCss, FEATURE_TOKEN[feature.id]);
      expect(hueDistance(hueOf(feature.color), hueOf(token))).toBeLessThan(20);
    },
  );

  it.each(tokenised.map((f) => [f.id, f] as const))(
    "%s keeps 3:1 against both page backgrounds",
    (_id, feature) => {
      const backgrounds = [
        ...allHexes(dsTokensCss, "--paul-color-background"),
        ...allHexes(dsTokensCss, "--paul-color-surface"),
      ];
      expect(backgrounds).toHaveLength(4);
      for (const background of backgrounds) {
        expect(contrastRatio(feature.color, background)).toBeGreaterThanOrEqual(3);
      }
    },
  );

  it("paints a card's dot from the same token as its tint", () => {
    const vitals = FEATURES.find((f) => f.id === "vitals")!;
    render(<FeatureCard feature={vitals} prefersReduced />);
    const dot = screen.getByRole("heading", { name: vitals.title })
      .previousElementSibling as HTMLElement;
    expect(dot.style.backgroundColor).toBe("var(--color-feature-vitals)");
  });
});
