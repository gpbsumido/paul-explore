import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";

// GET /api/zeroproof/me — the signed-in player's profile: stats, wallets,
// accolades. Auth required; withBackend answers 401 when there's no session.
export const GET = withBackend("zeroproof profile", async ({ token }) => {
  const result = await fetchUpstream(`${API_URL}/api/zeroproof/me`, {
    headers: buildHeaders(token, null),
  });
  if (!result.ok) return upstreamErrorResponse(result);
  if (!result.response.ok) {
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: result.response.status },
    );
  }
  return NextResponse.json(await result.response.json());
});
