import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { API_URL, buildHeaders, withAdminBackend } from "@/lib/backendFetch";

// GET /api/zeroproof/admin/bets — every user's bets with who placed them, for the
// admin god's view. Admin only (withAdminBackend 404s a non-admin at the edge);
// the caller's own token goes upstream so the API re-checks admin too. Only ?q=
// is forwarded, as a case-insensitive search across email/handle/selection/market.
export const GET = withAdminBackend("zeroproof admin bets GET", async ({ token, email }, request) => {
  const q = new URL(request.url).searchParams.get("q");
  const suffix = q ? `?q=${encodeURIComponent(q)}` : "";

  const result = await fetchUpstream(`${API_URL}/api/zeroproof/admin/bets${suffix}`, {
    headers: buildHeaders(token, email),
  });
  if (!result.ok) return upstreamErrorResponse(result);
  if (!result.response.ok) {
    return NextResponse.json(
      { error: "Failed to load bets" },
      { status: result.response.status },
    );
  }
  return NextResponse.json(await result.response.json());
});
