import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { API_URL, buildHeaders, withAdminBackend } from "@/lib/backendFetch";

// GET /api/zeroproof/ingest-health — which sports / ESPN leagues are (not)
// resolving on the sync and settle crons. Admin only (withAdminBackend 404s a
// non-admin at the edge); the caller's own token goes upstream so the API
// re-checks admin too.
export const GET = withAdminBackend("zeroproof ingest-health GET", async ({ token, email }) => {
  const result = await fetchUpstream(`${API_URL}/api/zeroproof/ingest-health`, {
    headers: buildHeaders(token, email),
  });
  if (!result.ok) return upstreamErrorResponse(result);
  if (!result.response.ok) {
    return NextResponse.json(
      { error: "Failed to load ingest health" },
      { status: result.response.status },
    );
  }
  return NextResponse.json(await result.response.json());
});
