import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { API_URL, buildHeaders, withAdminBackend } from "@/lib/backendFetch";
import { parseBody } from "@/lib/parseBody";
import { addEspnLeagueBodySchema } from "@/lib/zeroproof/schemas";

// GET /api/zeroproof/espn-leagues — the registered ESPN leagues. Admin only
// (withAdminBackend 404s a non-admin at the edge); the caller's own token goes
// upstream so the API re-checks admin too.
export const GET = withAdminBackend("zeroproof espn-leagues GET", async ({ token, email }) => {
  const result = await fetchUpstream(`${API_URL}/api/zeroproof/espn-leagues`, {
    headers: buildHeaders(token, email),
  });
  if (!result.ok) return upstreamErrorResponse(result);
  if (!result.response.ok) {
    return NextResponse.json(
      { error: "Failed to load ESPN leagues" },
      { status: result.response.status },
    );
  }
  return NextResponse.json(await result.response.json());
});

// POST /api/zeroproof/espn-leagues — register a league for ingestion. Admin only.
export const POST = withAdminBackend("zeroproof espn-leagues POST", async ({ token, email }, request) => {
  const parsed = await parseBody(request, addEspnLeagueBodySchema);
  if (!parsed.ok) return parsed.response;

  const result = await fetchUpstream(`${API_URL}/api/zeroproof/espn-leagues`, {
    method: "POST",
    headers: buildHeaders(token, email, { "Content-Type": "application/json" }),
    body: JSON.stringify(parsed.data),
  });
  if (!result.ok) return upstreamErrorResponse(result);
  const payload = await result.response.json().catch(() => null);
  return NextResponse.json(payload ?? { error: "Failed to add league" }, {
    status: result.response.status,
  });
});
