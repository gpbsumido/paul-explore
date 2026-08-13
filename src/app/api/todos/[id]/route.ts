import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { safeSegment } from "@/lib/safeSegment";
import { parseBody } from "@/lib/parseBody";
import { updateTodoBodySchema } from "@/lib/schemas";

type RouteCtx = { params: Promise<{ id: string }> };

/** PATCH /api/todos/:id — tick or un-tick one item. */
export const PATCH = withBackend<RouteCtx>(
  "todos PATCH",
  async ({ token, email }, request, { params }) => {
    const { id } = await params;
    const parsed = await parseBody(request, updateTodoBodySchema);
    if (!parsed.ok) return parsed.response;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/todos/${safeSegment(id)}`,
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
      console.error("[todos BFF] PATCH — backend status:", res.status);
      return NextResponse.json(
        { error: "Failed to update todo" },
        { status: res.status },
      );
    }
    return NextResponse.json(await res.json());
  },
);
