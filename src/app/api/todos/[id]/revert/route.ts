import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { safeSegment } from "@/lib/safeSegment";
import { parseBody } from "@/lib/parseBody";
import { revertTodoBodySchema } from "@/lib/schemas";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * POST /api/todos/:id/revert
 *
 * Restores an earlier revision as a NEW one. Nothing is discarded upstream, so
 * this is additive rather than destructive despite how it reads.
 */
export const POST = withBackend<RouteCtx>(
  "todo revert POST",
  async ({ token, email }, request, { params }) => {
    const { id } = await params;
    const parsed = await parseBody(request, revertTodoBodySchema);
    if (!parsed.ok) return parsed.response;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/todos/${safeSegment(id)}/revert`,
      {
        method: "POST",
        headers: buildHeaders(token, email, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(parsed.data),
      },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);

    const res = upstreamResult.response;
    if (!res.ok) {
      console.error("[todos BFF] revert — backend status:", res.status);
      return NextResponse.json(
        { error: "Failed to revert" },
        { status: res.status },
      );
    }
    return NextResponse.json(await res.json());
  },
);
