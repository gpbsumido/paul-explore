import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { withBackend, buildHeaders, API_URL } from "@/lib/backendFetch";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * GET /api/check-in/sites/:id/code — the code the on-site display shows.
 *
 * Never cached: a code that survives its window is a code a volunteer types and
 * is told is wrong.
 */
export const GET = withBackend<RouteCtx>(
  "check-in code GET",
  async ({ token, email }, _request, { params }) => {
    const { id } = await params;
    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/check-in/sites/${encodeURIComponent(id)}/code`,
      {
        headers: buildHeaders(token, email),
        cache: "no-store",
      },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    return NextResponse.json(await res.json(), { status: res.status });
  },
);
