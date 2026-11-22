import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { parseBody } from "@/lib/parseBody";
import { joinLeagueBodySchema } from "@/lib/zeroproof/schemas";
import { NextResponse } from "next/server";
import { API_URL, buildHeaders, withBackend } from "@/lib/backendFetch";
import { safeSegment } from "@/lib/safeSegment";

type RouteCtx = { params: Promise<{ id: string }> };

// POST /api/zeroproof/leagues/:id/join — join a league. Auth required. An invite
// league needs { joinCode } in the body; a public one joins by id alone.
export const POST = withBackend<RouteCtx>(
  "zeroproof join league",
  async ({ token }, request, { params }) => {
    const { id } = await params;
    const parsed = await parseBody(request, joinLeagueBodySchema);
    if (!parsed.ok) return parsed.response;
    const result = await fetchUpstream(
      `${API_URL}/api/zeroproof/leagues/${safeSegment(id)}/join`,
      {
        method: "POST",
        headers: buildHeaders(token, null, { "Content-Type": "application/json" }),
        body: JSON.stringify(parsed.data),
      },
    );
    if (!result.ok) return upstreamErrorResponse(result);
    const payload = await result.response.json().catch(() => null);
    return NextResponse.json(payload ?? { error: "Failed to join league" }, {
      status: result.response.status,
    });
  },
);
