import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { buildHeaders, API_URL, withAdminBackend } from "@/lib/backendFetch";
import { safeSegment } from "@/lib/safeSegment";

type RouteCtx = { params: Promise<{ id: string }> };

/** GET /api/todos/:id/revisions — the timeline for one item. */
export const GET = withAdminBackend<RouteCtx>(
  "todo revisions GET",
  async ({ token, email }, _request, { params }) => {
    const { id } = await params;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/todos/${safeSegment(id)}/revisions`,
      { headers: buildHeaders(token, email) },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);

    const res = upstreamResult.response;
    if (!res.ok) {
      console.error("[todos BFF] revisions GET — backend status:", res.status);
      return NextResponse.json(
        { error: "Failed to load history" },
        { status: res.status },
      );
    }
    return NextResponse.json(await res.json());
  },
);
