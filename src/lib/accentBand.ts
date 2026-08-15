/**
 * The shared accent band.
 *
 * A theme-neutral accent is one hex rendered on both warm paper and warm ink,
 * so it cannot use the two-value trick the `--color-feature-*` tokens use. What
 * keeps it working in both themes is tone: saturation 0.24-0.68 and lightness
 * 0.33-0.62. Below that band a value disappears into the dark page, above it a
 * value washes out on the light one.
 *
 * Before this, six arrays each invented their own rainbow -- the win confetti,
 * the chart series, the 404 variants, the craft accents, the motion tiles and
 * the particle palettes. They now all draw from here, which is why the reels,
 * the charts and the 404 finally look like one app.
 *
 * Hue is free, because hue is the identity of whatever is being coloured. Tone
 * is not. `src/lib/accentBand.test.ts` pins every value.
 *
 * The app's neutral (#7f7869) is deliberately absent: its saturation of 0.095
 * fails the band, correctly, because it is a neutral. Reach for
 * `--color-neutral-500` when that is what you want.
 */
export const ACCENT_BAND = {
  verdigris: "#2b8a7e",
  sea: "#2d8f66",
  teal: "#2b8c9b",
  azure: "#3388b4",
  blue: "#4a81bc",
  indigo: "#6451ba",
  violet: "#7b6aca",
  orchid: "#a65eae",
  magenta: "#be5283",
  rose: "#b95c93",
  coral: "#be5d68",
  red: "#c0584d",
  ember: "#b46c2d",
  gold: "#9f7d27",
  olive: "#718d2d",
} as const;

/** Every band value, for the arrays that want a series rather than a name. */
export const BAND_VALUES = Object.values(ACCENT_BAND);

/**
 * A six-step series for charts, in an order that stays distinguishable when the
 * steps sit next to each other. Verdigris leads because it is the house colour.
 */
export const CHART_SERIES = [
  ACCENT_BAND.verdigris,
  ACCENT_BAND.ember,
  ACCENT_BAND.azure,
  ACCENT_BAND.orchid,
  ACCENT_BAND.gold,
  ACCENT_BAND.coral,
] as const;
