import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { API_URL, buildHeaders, withBackend } from "@/lib/backendFetch";

type RouteCtx = { params: Promise<{ id: string; espnId: string }> };

// DELETE /api/zeroproof/leagues/:id/espn-leagues/:espnId — the commissioner
// removes an ESPN league from their league. Auth required; commissioner-checked
// by the backend.
export const DELETE = withBackend<RouteCtx>(
  "zeroproof remove league espn",
  async ({ token }, _request, { params }) => {
    const { id, espnId } = await params;
    const result = await fetchUpstream(
      `${API_URL}/api/zeroproof/leagues/${encodeURIComponent(id)}/espn-leagues/${encodeURIComponent(espnId)}`,
      { method: "DELETE", headers: buildHeaders(token, null) },
    );
    if (!result.ok) return upstreamErrorResponse(result);
    return new NextResponse(null, { status: 204 });
  },
);
