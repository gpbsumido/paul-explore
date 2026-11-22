import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { DEFAULT_MAX_BYTES, parseBody } from "@/lib/parseBody";
import { addEspnLeagueBodySchema } from "@/lib/zeroproof/schemas";
import { NextResponse } from "next/server";
import { API_URL, buildHeaders, withBackend } from "@/lib/backendFetch";
import { safeSegment } from "@/lib/safeSegment";

type RouteCtx = { params: Promise<{ id: string }> };

// POST /api/zeroproof/leagues/:id/espn-leagues — the commissioner adds a public
// ESPN league their members can bet. Auth required; the backend checks the
// caller is the league's commissioner.
export const POST = withBackend<RouteCtx>(
  "zeroproof add league espn",
  async ({ token }, request, { params }) => {
    const { id } = await params;
    const parsed = await parseBody(request, addEspnLeagueBodySchema, DEFAULT_MAX_BYTES, { explainFirstIssue: true });
    if (!parsed.ok) return parsed.response;
    const result = await fetchUpstream(
      `${API_URL}/api/zeroproof/leagues/${safeSegment(id)}/espn-leagues`,
      {
        method: "POST",
        headers: buildHeaders(token, null, { "Content-Type": "application/json" }),
        body: JSON.stringify(parsed.data),
      },
    );
    if (!result.ok) return upstreamErrorResponse(result);
    const payload = await result.response.json().catch(() => null);
    return NextResponse.json(payload ?? { error: "Failed to add ESPN league" }, {
      status: result.response.status,
    });
  },
);
