import { fetchUpstream } from "@/lib/upstream";
import {
  cardsFromLeaguePayload,
  fantasyLeagueUrl,
} from "@/lib/espn-performances";
import type { GeneratedCard } from "@/lib/fantasy-cards";

/**
 * The season Card Lab shows when the URL doesn't name one. The page and the
 * pack rip both read it from here, because when each had its own copy the rip
 * kept drawing from 2025 whatever season was on screen.
 *
 * Pinned rather than derived from `currentNbaSeason`: I picked it in August
 * 2026 as the last season with a full year of totals, so it needs moving by
 * hand once a newer season has enough games to make a pool worth ripping.
 */
export const CARD_LAB_DEFAULT_SEASON = "2025";

/**
 * The NBA season view's cards, built from the fantasy league's season totals
 * rather than a nightly slate. Shared by the page that shows them and the rip
 * that draws from them, so both are always the same pool.
 */
export async function loadNbaSeasonCards(
  season: string,
): Promise<{ cards: GeneratedCard[]; error: boolean }> {
  const result = await fetchUpstream(fantasyLeagueUrl("nba", season), {
    next: { revalidate: 3600 },
  });
  if (!result.ok || !result.response.ok) return { cards: [], error: true };
  try {
    const payload = await result.response.json();
    return { cards: cardsFromLeaguePayload(payload, { season }), error: false };
  } catch {
    return { cards: [], error: true };
  }
}
