import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { parseBody } from "@/lib/parseBody";
import { ripPackBodySchema } from "@/lib/schemas";
import { loadNightlySlate } from "@/lib/espn-nightly";
import { loadNflWeek, loadNflSeason } from "@/lib/espn-nfl";
import { drawPack, type GeneratedCard, type Sport } from "@/lib/fantasy-cards";

const DEFAULT_SEASON = "2025";
const PACK_SIZE = 5;

/** Regenerate the slate the user is looking at, so the draw pool is trusted. */
async function loadPool(
  sport: Sport,
  mode: "nightly" | "season" | undefined,
  date: string | undefined,
  week: number | undefined,
): Promise<GeneratedCard[]> {
  if (sport === "nfl") {
    if (mode === "season") return (await loadNflSeason({ season: DEFAULT_SEASON })).cards;
    return (await loadNflWeek({ season: DEFAULT_SEASON, week })).cards;
  }
  return (await loadNightlySlate({ sport, season: DEFAULT_SEASON, date })).cards;
}

// POST /api/card-lab/packs/open — draw a weighted pack from the current slate,
// spend coins, and record the pulls. The pool is regenerated here, not sent by
// the client, so the draw can't be gamed.
export const POST = withBackend("card-lab open", async ({ token }, request) => {
  const parsed = await parseBody(request, ripPackBodySchema);
  if (!parsed.ok) return parsed.response;
  const { sport, mode, date, week } = parsed.data;

  let pool: GeneratedCard[];
  try {
    pool = await loadPool(sport, mode, date, week);
  } catch (err) {
    console.error("[card-lab open] pool regeneration failed", { sport, mode, date, week }, err);
    return NextResponse.json(
      { error: "Couldn't rebuild this slate to draw from" },
      { status: 503 },
    );
  }

  const drawn = drawPack(pool, { size: PACK_SIZE });
  if (drawn.length === 0) {
    console.error("[card-lab open] empty pool", { sport, mode, date, week });
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
