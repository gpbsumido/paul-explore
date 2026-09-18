/**
 * A stable accent colour for a team, derived from its name. There's no
 * cross-sport brand-colour table on the board (events carry names, not ids), so
 * instead of leaving every fixture the same grey I hash the name to a hue. Same
 * team, same colour every time; different teams read distinctly.
 *
 * Saturation and lightness are pinned inside the app's tone band so the accents
 * sit with the rest of the palette rather than shouting over it, and the result
 * is an `hsl()` string — no raw hex — so it stays inside the palette guard.
 */

/** djb2-ish string hash, folded into a 0-359 hue. Deterministic per name. */
function hueFromName(name: string): number {
  let hash = 5381;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 33 + name.charCodeAt(i)) % 360000;
  }
  return hash % 360;
}

export function teamAccentColor(name: string): string {
  return `hsl(${hueFromName(name)} 52% 48%)`;
}
