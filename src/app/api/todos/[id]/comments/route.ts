import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { buildHeaders, API_URL, withAdminBackend } from "@/lib/backendFetch";
import { safeSegment } from "@/lib/safeSegment";
import { parseBody } from "@/lib/parseBody";
import { todoCommentBodySchema } from "@/lib/schemas";

type RouteCtx = { params: Promise<{ id: string }> };

/** GET /api/todos/:id/comments — notes on one item, oldest first. */
export const GET = withAdminBackend<RouteCtx>(
  "todo comments GET",
  async ({ token, email }, _request, { params }) => {
    const { id } = await params;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/todos/${safeSegment(id)}/comments`,
      { headers: buildHeaders(token, email) },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);

    const res = upstreamResult.response;
    if (!res.ok) {
      console.error("[todos BFF] comments GET — backend status:", res.status);
      return NextResponse.json(
        { error: "Failed to load comments" },
        { status: res.status },
      );
    }
    return NextResponse.json(await res.json());
  },
);

/** POST /api/todos/:id/comments */
export const POST = withAdminBackend<RouteCtx>(
  "todo comments POST",
  async ({ token, email }, request, { params }) => {
    const { id } = await params;
    const parsed = await parseBody(request, todoCommentBodySchema);
    if (!parsed.ok) return parsed.response;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/todos/${safeSegment(id)}/comments`,
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
      console.error("[todos BFF] comments POST — backend status:", res.status);
      return NextResponse.json(
        { error: "Failed to add comment" },
        { status: res.status },
      );
    }
    return NextResponse.json(await res.json(), { status: 201 });
  },
);
