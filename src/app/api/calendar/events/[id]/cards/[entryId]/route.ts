import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { updateCardBodySchema } from "@/lib/schemas";
import { parseBody } from "@/lib/parseBody";
import { safeSegment } from "@/lib/safeSegment";

type RouteCtx = { params: Promise<{ id: string; entryId: string }> };

// PUT /api/calendar/events/:id/cards/:entryId
export const PUT = withBackend<RouteCtx>(
  "calendar card PUT",
  async ({ token, email }, request, { params }) => {
    const { id, entryId } = await params;

    const bodyResult = await parseBody(request, updateCardBodySchema);
    if (!bodyResult.ok) return bodyResult.response;
    const body = bodyResult.data;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/calendar/events/${safeSegment(id)}/cards/${safeSegment(entryId)}`,
      {
        method: "PUT",
        headers: buildHeaders(token, email, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(body),
      },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Failed to update card" }));
      console.error("[calendar BFF] PUT card — backend error:", err);
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  },
);

// DELETE /api/calendar/events/:id/cards/:entryId
export const DELETE = withBackend<RouteCtx>(
  "calendar card DELETE",
  async ({ token, email }, _request, { params }) => {
    const { id, entryId } = await params;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/calendar/events/${safeSegment(id)}/cards/${safeSegment(entryId)}`,
      {
        method: "DELETE",
        headers: buildHeaders(token, email),
      },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Failed to delete card" }));
      console.error("[calendar BFF] DELETE card — backend error:", err);
      return NextResponse.json(err, { status: res.status });
    }
    return new NextResponse(null, { status: 204 });
  },
);
