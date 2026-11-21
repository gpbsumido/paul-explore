import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { parseBody } from "@/lib/parseBody";
import { ripPackBodySchema } from "@/lib/schemas";
import { loadNightlySlate } from "@/lib/espn-nightly";
import { loadNflWeek, loadNflSeason } from "@/lib/espn-nfl";
import { drawPack, type GeneratedCard, type Sport } from "@/lib/fantasy-cards";
import { CARD_LAB_DEFAULT_SEASON, loadNbaSeasonCards } from "@/lib/card-lab-pool";

const PACK_SIZE = 5;

/**
 * Regenerate the slate the user is looking at, so the draw pool is trusted.
 * Same branches as the page: NFL by season or week, NBA season from the
 * fantasy league, everything else from the nightly slate.
 */
async function loadPool(
  sport: Sport,
  mode: "nightly" | "season" | undefined,
  season: string,
  date: string | undefined,
  week: number | undefined,
): Promise<GeneratedCard[]> {
  if (sport === "nfl") {
    if (mode === "season") return (await loadNflSeason({ season })).cards;
    return (await loadNflWeek({ season, week })).cards;
  }
  if (sport === "nba" && mode === "season") {
    const { cards, error } = await loadNbaSeasonCards(season);
    if (error) throw new Error(`NBA ${season} season cards unavailable`);
    return cards;
  }
  return (await loadNightlySlate({ sport, season, date })).cards;
}

// POST /api/card-lab/packs/open — draw a weighted pack from the current slate,
// spend coins, and record the pulls. The pool is regenerated here, not sent by
// the client, so the draw can't be gamed.
export const POST = withBackend("card-lab open", async ({ token }, request) => {
  const parsed = await parseBody(request, ripPackBodySchema);
  if (!parsed.ok) return parsed.response;
  const { sport, mode, date, week } = parsed.data;
  const season = parsed.data.season ?? CARD_LAB_DEFAULT_SEASON;

  let pool: GeneratedCard[];
  try {
    pool = await loadPool(sport, mode, season, date, week);
  } catch (err) {
    console.error("[card-lab open] pool regeneration failed", { sport, mode, season, date, week }, err);
    return NextResponse.json(
      { error: "Couldn't rebuild this slate to draw from" },
      { status: 503 },
    );
  }

  const drawn = drawPack(pool, { size: PACK_SIZE });
  if (drawn.length === 0) {
    console.error("[card-lab open] empty pool", { sport, mode, season, date, week });
    return NextResponse.json({ error: "No cards to rip from this slate" }, { status: 409 });
  }

  const result = await fetchUpstream(`${API_URL}/api/tcg/packs/open`, {
    method: "POST",
    headers: buildHeaders(token, null, { "Content-Type": "application/json" }),
    body: JSON.stringify({ cards: drawn }),
  });
  if (!result.ok) {
    console.error("[card-lab open] card API unreachable", result);
    return upstreamErrorResponse(result);
  }

  const body = await result.response.json().catch(() => null);
  if (!result.response.ok) {
    // Pass the backend's status through — notably 402 for an empty wallet.
    console.error("[card-lab open] card API error", result.response.status, body);
    return NextResponse.json(body ?? { error: "Failed to open pack" }, {
      status: result.response.status,
    });
  }
  return NextResponse.json({ ...body, cards: drawn });
});
