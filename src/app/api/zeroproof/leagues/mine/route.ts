import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { API_URL, buildHeaders, withBackend } from "@/lib/backendFetch";

// GET /api/zeroproof/leagues/mine — the leagues the caller belongs to, with
// their join codes. Auth required. Static segment, so it resolves ahead of the
// :id route.
export const GET = withBackend("zeroproof my leagues", async ({ token }) => {
  const result = await fetchUpstream(`${API_URL}/api/zeroproof/leagues/mine`, {
    headers: buildHeaders(token, null),
  });
  if (!result.ok) return upstreamErrorResponse(result);
  if (!result.response.ok) {
    return NextResponse.json(
      { error: "Failed to load your leagues" },
      { status: result.response.status },
    );
  }
  return NextResponse.json(await result.response.json());
});
