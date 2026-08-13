import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse, type NextRequest } from "next/server";
import { getBackendAuth, buildHeaders, API_URL } from "@/lib/backendFetch";
import { safeSegment } from "@/lib/safeSegment";
import { parseBody } from "@/lib/parseBody";
import { playoffPicksBodySchema } from "@/lib/schemas";

function currentSeasonYear(): number {
  const now = new Date();
  return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
}

// GET /api/nba/playoffs/picks
// Returns the authenticated user's bracket picks for the current season.
export async function GET() {
  let token: string;
  try {
    ({ token } = await getBackendAuth());
  } catch (err) {
    console.error("[playoffs BFF] GET picks — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const season = currentSeasonYear();

  try {
    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/nba/playoffs/picks/${safeSegment(season)}`,
      {
        headers: buildHeaders(token, null),
      },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;

    if (res.status === 404) {
      return NextResponse.json({ picks: {} });
    }

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      console.error("[playoffs BFF] GET picks — backend error:", body);
      return NextResponse.json(
        { error: "Failed to fetch picks" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[playoffs BFF] GET picks — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

// PUT /api/nba/playoffs/picks
// Saves the authenticated user's bracket picks for the current season.
export async function PUT(request: NextRequest) {
  let token: string;
  try {
    ({ token } = await getBackendAuth());
  } catch (err) {
    console.error("[playoffs BFF] PUT picks — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = await parseBody(request, playoffPicksBodySchema);
  if (!parsed.ok) return parsed.response;
  const { picks } = parsed.data;

  const season = currentSeasonYear();

  try {
    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/nba/playoffs/picks/${safeSegment(season)}`,
      {
        method: "PUT",
        headers: buildHeaders(token, null, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ picks }),
      },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      console.error("[playoffs BFF] PUT picks — backend error:", body);
      return NextResponse.json(
        { error: "Failed to save picks" },
        { status: res.status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[playoffs BFF] PUT picks — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
