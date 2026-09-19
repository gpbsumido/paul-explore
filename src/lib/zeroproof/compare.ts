import type { LeaderboardEntry } from "./schemas";
import { winRatePct } from "./analytics";
import { formatRecord, formatSignedPct } from "./format";

/**
 * Head-to-head stats comparison for the Compare tab. Pure, so the "who leads"
 * calls are unit-tested without a browser. It works off the same fields the
 * public leaderboard already exposes plus my own profile stats — individual
 * bets stay private, so this compares records, not picks.
 */

/** The stat fields both a leaderboard entry and my profile carry. */
type StatsLike = {
  wins: number;
  losses: number;
  pushes: number;
  betCount: number;
  roiPct: number;
  sharpScore: number | null;
};

export type CompareMetric = {
  key: string;
  label: string;
  /** Formatted for display. */
  mine: string;
  theirs: string;
  /** Who's ahead; null for informational rows (record, volume) with no better side. */
  leader: "mine" | "theirs" | "tie" | null;
};

/** Higher-is-better comparison with null handling (null trails any real number). */
function leadOf(
  mine: number | null,
  theirs: number | null,
): "mine" | "theirs" | "tie" | null {
  if (mine === null && theirs === null) return null;
  if (mine === null) return "theirs";
  if (theirs === null) return "mine";
  if (mine === theirs) return "tie";
  return mine > theirs ? "mine" : "theirs";
}

/** My stats against another player's, metric by metric. */
export function compareStats(mine: StatsLike, theirs: StatsLike): CompareMetric[] {
  const myWinRate = winRatePct(mine);
  const theirWinRate = winRatePct(theirs);
  const pct = (value: number | null) => (value === null ? "—" : `${value}%`);
  const sharp = (value: number | null) => (value === null ? "—" : String(value));

  return [
    { key: "record", label: "Record", mine: formatRecord(mine), theirs: formatRecord(theirs), leader: null },
    { key: "winRate", label: "Win rate", mine: pct(myWinRate), theirs: pct(theirWinRate), leader: leadOf(myWinRate, theirWinRate) },
    { key: "roi", label: "ROI", mine: formatSignedPct(mine.roiPct), theirs: formatSignedPct(theirs.roiPct), leader: leadOf(mine.roiPct, theirs.roiPct) },
    { key: "sharp", label: "Sharp score", mine: sharp(mine.sharpScore), theirs: sharp(theirs.sharpScore), leader: leadOf(mine.sharpScore, theirs.sharpScore) },
    { key: "bets", label: "Bets", mine: String(mine.betCount), theirs: String(theirs.betCount), leader: null },
  ];
}

/** How many of the comparable metrics each side leads. */
export function leadSummary(metrics: CompareMetric[]): {
  mineLeads: number;
  theirsLeads: number;
  comparable: number;
} {
  const comparable = metrics.filter((metric) => metric.leader !== null);
  return {
    mineLeads: comparable.filter((metric) => metric.leader === "mine").length,
    theirsLeads: comparable.filter((metric) => metric.leader === "theirs").length,
    comparable: comparable.length,
  };
}

/**
 * Where I'd rank against the field on one metric, one better than everyone I
 * beat. A null score (mine or theirs) trails any real number, so an ungraded
 * player sinks rather than tops the board.
 */
export function rankByMetric(
  entries: LeaderboardEntry[],
  mine: StatsLike,
  metric: "roiPct" | "sharpScore",
): { rank: number; total: number } {
  const mineValue = mine[metric];
  const ahead = entries.filter((entry) => {
    const value = entry[metric];
    if (value === null) return false;
    if (mineValue === null) return true;
    return value > mineValue;
  }).length;
  return { rank: ahead + 1, total: entries.length + 1 };
}
