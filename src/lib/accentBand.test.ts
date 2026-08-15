import { describe, it, expect } from "vitest";
import { ACCENT_BAND, BAND_VALUES } from "./accentBand";
import { EVENT_COLORS } from "./calendar";

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

const SATURATION = { min: 0.24, max: 0.68 };
const LIGHTNESS = { min: 0.33, max: 0.62 };

/** The same band `thoughtColors.test.ts` pins the registry accents into. */
function outOfBand(hex: string): boolean {
  const { s, l } = hsl(hex);
  return (
    s < SATURATION.min ||
    s > SATURATION.max ||
    l < LIGHTNESS.min ||
    l > LIGHTNESS.max
  );
}

const offenders = (hexes: readonly string[]) =>
  hexes.filter(outOfBand).map((hex) => `${hex} -> ${JSON.stringify(hsl(hex))}`);

/**
 * Six separate arrays in this app each invented their own rainbow — confetti,
 * chart series, 404 variants, craft accents, motion tiles, particle palettes.
 * They now all draw from one band, so this is the single place that says what
 * "on palette" means for a theme-neutral accent.
 */
describe("the shared accent band", () => {
  it("keeps every band value inside the tone band", () => {
    expect(offenders(BAND_VALUES)).toEqual([]);
  });

  it("exposes every named value in the values list", () => {
    expect([...BAND_VALUES].sort()).toEqual(
      Object.values(ACCENT_BAND).sort() as string[],
    );
  });

  it("has no duplicate values", () => {
    expect(new Set(BAND_VALUES).size).toBe(BAND_VALUES.length);
  });

  it("excludes neutrals, which is why the app's grey is not in it", () => {
    expect(outOfBand("#7f7869")).toBe(true);
    expect([...BAND_VALUES]).not.toContain("#7f7869");
  });

  it("rejects the stock pastels this release exists to remove", () => {
    expect(outOfBand("#818cf8")).toBe(true);
    expect(outOfBand("#38bdf8")).toBe(true);
  });
});

/**
 * The calendar picker is a palette of options, not a lookup table: the modals
 * store the raw hex on the event and every render site reads that stored value
 * back. Retuning the options changes new picks and the default, and leaves
 * saved events alone — so the only thing to pin is the options themselves.
 */
describe("the calendar event colour picker", () => {
  it("keeps every option inside the tone band", () => {
    expect(offenders(EVENT_COLORS)).toEqual([]);
  });

  it("still offers eight options", () => {
    expect(EVENT_COLORS).toHaveLength(8);
  });

  it("draws every option from the shared band", () => {
    const outside = EVENT_COLORS.filter(
      (hex) => !(BAND_VALUES as readonly string[]).includes(hex),
    );
    expect(outside).toEqual([]);
  });
});
