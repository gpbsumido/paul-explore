import { describe, it, expect } from "vitest";
import { ACCENT_BAND, BAND_VALUES } from "./accentBand";
import { EVENT_COLORS } from "./calendar";
import { hexToHsl, isInToneBand } from "@/test/toneBand";

/** The same band `thoughtColors.test.ts` pins the registry accents into. */
const outOfBand = (hex: string) => !isInToneBand(hex);

const offenders = (hexes: readonly string[]) =>
  hexes.filter(outOfBand).map((hex) => `${hex} -> ${JSON.stringify(hexToHsl(hex))}`);

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
