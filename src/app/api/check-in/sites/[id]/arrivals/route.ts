import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { withBackend, buildHeaders, API_URL } from "@/lib/backendFetch";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * GET /api/check-in/sites/:id/arrivals — today's roster for a site you own.
 */
export const GET = withBackend<RouteCtx>(
  "check-in arrivals GET",
  async ({ token, email }, _request, { params }) => {
    const { id } = await params;
    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/check-in/sites/${encodeURIComponent(id)}/arrivals`,
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
