import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { type NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/backendFetch";
import { auth0 } from "@/lib/auth0";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/zeroproof/leagues/:id — a league's rules, board, and the caller's
// place in it. Public but token-aware: a signed-in caller gets their membership
// and wallet; a signed-out one gets the public view. The join code comes back
// only for members (the backend decides that).
export async function GET(_request: NextRequest, { params }: RouteCtx) {
  const { id } = await params;

  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch {
    token = undefined;
  }

  try {
    const result = await fetchUpstream(
      `${API_URL}/api/zeroproof/leagues/${encodeURIComponent(id)}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
    );
    if (!result.ok) return upstreamErrorResponse(result);
    const data = await result.response.json().catch(() => null);
    return NextResponse.json(data ?? { error: "Failed to load league" }, {
      status: result.response.status,
    });
  } catch (err) {
    console.error("[BFF] GET /zeroproof/leagues/:id — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
