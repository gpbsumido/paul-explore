import { teamBrandColor } from "./teamColors";

/**
 * A stable accent colour for a team. When the team is in a league I have brand
 * colours for (NBA, NFL, MLB), it reads in its real colour; otherwise — a
 * fantasy team, an unknown name — I hash the name to a hue so it still gets its
 * own stable, distinct shade rather than a flat grey.
 *
 * The hash's saturation and lightness are pinned inside the app's tone band so
 * the fallback sits with the palette, and it's an `hsl()` string (no raw hex),
 * so the hash path stays inside the palette guard. The brand path returns hex
 * from the identity-allowlisted teamColors table.
 */

/** djb2-ish string hash, folded into a 0-359 hue. Deterministic per name. */
function hueFromName(name: string): number {
  let hash = 5381;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 33 + name.charCodeAt(i)) % 360000;
  }
  return hash % 360;
}

export function teamAccentColor(name: string, sport?: string): string {
  if (sport) {
    const brand = teamBrandColor(sport, name);
    if (brand) return brand;
  }
  return `hsl(${hueFromName(name)} 52% 48%)`;
}
