import { describe, it, expect } from "vitest";
import { FEATURES, THOUGHTS } from "./featureData.data";

/** Parses #rrggbb into HSL, since the band is defined in tone, not in hex. */
function hsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s, l };
}

/**
 * The 4.7.0 palette swap retuned the FEATURES accents into one muted tone
 * band and left the 60 THOUGHTS hexes on stock Tailwind pastels, which is
 * visible on the /discover reels and the v3 graph. This pins every registry
 * colour into the same band: hue is free (it is the category identity),
 * tone is not. A stock 300-level pastel or a 500-level neon both fail.
 */
describe("registry colour tone band", () => {
  const SATURATION = { min: 0.24, max: 0.68 };
  const LIGHTNESS = { min: 0.33, max: 0.62 };

  const offenders = (items: { title: string; color?: string }[]) =>
    items
      .filter((item) => item.color)
      .filter((item) => {
        const { s, l } = hsl(item.color as string);
        return (
          s < SATURATION.min ||
          s > SATURATION.max ||
          l < LIGHTNESS.min ||
          l > LIGHTNESS.max
        );
      })
      .map((item) => `${item.title}: ${item.color}`);

  it("keeps every feature accent in the band", () => {
    expect(offenders(FEATURES)).toEqual([]);
  });

  it("keeps every write-up accent in the band", () => {
    expect(offenders(THOUGHTS)).toEqual([]);
  });
});
