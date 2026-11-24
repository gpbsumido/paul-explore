/**
 * The tone band every theme-neutral accent has to sit in, as a test helper.
 *
 * `src/lib/accentBand.ts` explains why the band exists. Three tests used to
 * carry their own copy of the hex-to-HSL maths and the band edges, so moving an
 * edge meant finding all three. They read it from here now.
 */

const SATURATION = { min: 0.24, max: 0.68 };
const LIGHTNESS = { min: 0.33, max: 0.62 };

/**
 * Parses #rrggbb into HSL, since the band is defined in tone, not in hex.
 *
 * @param hex - A six-digit hex colour with its leading `#`.
 * @returns Hue in degrees, saturation and lightness from 0 to 1.
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d === 0) return { h: 0, s, l };
  const sector =
    max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (sector * 60 + 360) % 360, s, l };
}

/**
 * Whether a colour's saturation and lightness both sit inside the band. Hue
 * doesn't count, because hue is the identity of whatever is being coloured.
 *
 * @param hex - A six-digit hex colour with its leading `#`.
 */
export function isInToneBand(hex: string): boolean {
  const { s, l } = hexToHsl(hex);
  return (
    s >= SATURATION.min &&
    s <= SATURATION.max &&
    l >= LIGHTNESS.min &&
    l <= LIGHTNESS.max
  );
}
