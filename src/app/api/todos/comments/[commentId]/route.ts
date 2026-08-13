import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { safeSegment } from "@/lib/safeSegment";
import { parseBody } from "@/lib/parseBody";
import { todoCommentBodySchema } from "@/lib/schemas";

type RouteCtx = { params: Promise<{ commentId: string }> };

/** PATCH /api/todos/comments/:commentId */
export const PATCH = withBackend<RouteCtx>(
  "todo comment PATCH",
  async ({ token, email }, request, { params }) => {
    const { commentId } = await params;
    const parsed = await parseBody(request, todoCommentBodySchema);
    if (!parsed.ok) return parsed.response;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/todos/comments/${safeSegment(commentId)}`,
      {
        method: "PATCH",
        headers: buildHeaders(token, email, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(parsed.data),
      },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);

    const res = upstreamResult.response;
    if (!res.ok) {
      console.error("[todos BFF] comment PATCH — backend status:", res.status);
      return NextResponse.json(
        { error: "Failed to edit comment" },
        { status: res.status },
      );
    }
    return NextResponse.json(await res.json());
  },
);

/** DELETE /api/todos/comments/:commentId — soft delete upstream. */
export const DELETE = withBackend<RouteCtx>(
  "todo comment DELETE",
  async ({ token, email }, _request, { params }) => {
    const { commentId } = await params;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/todos/comments/${safeSegment(commentId)}`,
      { method: "DELETE", headers: buildHeaders(token, email) },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);

    const res = upstreamResult.response;
    if (!res.ok) {
      console.error("[todos BFF] comment DELETE — backend status:", res.status);
      return NextResponse.json(
        { error: "Failed to remove comment" },
        { status: res.status },
      );
    }
    return NextResponse.json(await res.json());
  },
);
