/**
 * Real brand colours for the leagues the board carries, so a fixture reads in
 * its team's actual colour rather than an arbitrary hash. Keyed by the team
 * nickname within its league; the events carry full names from the odds vendor
 * ("Boston Red Sox") or short names in tests ("Celtics"), so the lookup matches
 * either the exact nickname or the tail of a full name.
 *
 * Scoped by league because a few nicknames collide across sports with different
 * colours — the NFL and MLB both have a Cardinals and a Giants, and they don't
 * share a palette. Fantasy teams have arbitrary names and no brand colour, so
 * they fall through to the hash in teamAccent.
 *
 * These are identity colours (a published brand), not design-language tokens,
 * so this file is on the palette-guard's identity allowlist.
 */

type League = "nba" | "nfl" | "mlb";

/** Primary brand colour per team, keyed by lowercase nickname. */
const BRAND: Record<League, Record<string, string>> = {
  nba: {
    hawks: "#e03a3e",
    celtics: "#007a33",
    nets: "#000000",
    hornets: "#1d1160",
    bulls: "#ce1141",
    cavaliers: "#860038",
    mavericks: "#00538c",
    nuggets: "#0e2240",
    pistons: "#c8102e",
    warriors: "#1d428a",
    rockets: "#ce1141",
    pacers: "#002d62",
    clippers: "#c8102e",
    lakers: "#552583",
    grizzlies: "#5d76a9",
    heat: "#98002e",
    bucks: "#00471b",
    timberwolves: "#0c2340",
    pelicans: "#0c2340",
    knicks: "#006bb6",
    thunder: "#007ac1",
    magic: "#0077c0",
    "76ers": "#006bb6",
    suns: "#1d1160",
    "trail blazers": "#e03a3e",
    kings: "#5a2d81",
    spurs: "#6d6e71",
    raptors: "#ce1141",
    jazz: "#002b5c",
    wizards: "#002b5c",
  },
  nfl: {
    cardinals: "#97233f",
    falcons: "#a71930",
    ravens: "#241773",
    bills: "#00338d",
    panthers: "#0085ca",
    bears: "#0b162a",
    bengals: "#fb4f14",
    browns: "#311d00",
    cowboys: "#003594",
    broncos: "#fb4f14",
    lions: "#0076b6",
    packers: "#203731",
    texans: "#03202f",
    colts: "#002c5f",
    jaguars: "#006778",
    chiefs: "#e31837",
    raiders: "#000000",
    chargers: "#0080c6",
    rams: "#003594",
    dolphins: "#008e97",
    vikings: "#4f2683",
    patriots: "#002244",
    saints: "#d3bc8d",
    giants: "#0b2265",
    jets: "#125740",
    eagles: "#004c54",
    steelers: "#ffb612",
    "49ers": "#aa0000",
    seahawks: "#002244",
    buccaneers: "#d50a0a",
    titans: "#0c2340",
    commanders: "#5a1414",
  },
  mlb: {
    diamondbacks: "#a71930",
    braves: "#ce1141",
    orioles: "#df4601",
    "red sox": "#bd3039",
    cubs: "#0e3386",
    "white sox": "#27251f",
    reds: "#c6011f",
    guardians: "#00385d",
    rockies: "#33006f",
    tigers: "#0c2340",
    astros: "#002d62",
    royals: "#004687",
    angels: "#ba0021",
    dodgers: "#005a9c",
    marlins: "#00a3e0",
    brewers: "#12284b",
    twins: "#002b5c",
    mets: "#002d72",
    yankees: "#003087",
    athletics: "#003831",
    phillies: "#e81828",
    pirates: "#fdb827",
    padres: "#2f241d",
    giants: "#fd5a1e",
    mariners: "#0c2c56",
    cardinals: "#c41e3a",
    rays: "#092c5c",
    rangers: "#003278",
    "blue jays": "#134a8e",
    nationals: "#ab0003",
  },
};

/** Which league a sport key belongs to, or null for fantasy / anything else. */
function leagueFromSport(sport: string): League | null {
  if (sport.includes("basketball")) return "nba";
  if (sport.includes("americanfootball")) return "nfl";
  if (sport.includes("baseball")) return "mlb";
  return null;
}

/**
 * The team's brand colour, or null when there isn't one — a fantasy team, an
 * unknown league, or a name that doesn't match. Callers fall back to the hash.
 */
export function teamBrandColor(sport: string, name: string): string | null {
  const league = leagueFromSport(sport);
  if (!league) return null;
  const lower = name.trim().toLowerCase();
  for (const [nickname, color] of Object.entries(BRAND[league])) {
    if (lower === nickname || lower.endsWith(` ${nickname}`)) return color;
  }
  return null;
}
