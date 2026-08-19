import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { addCardBodySchema } from "@/lib/schemas";
import { parseBody } from "@/lib/parseBody";
import { safeSegment } from "@/lib/safeSegment";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/calendar/events/:id/cards
export const GET = withBackend<RouteCtx>(
  "calendar cards GET",
  async ({ token, email }, _request, { params }) => {
    const { id } = await params;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/calendar/events/${safeSegment(id)}/cards`,
      {
        headers: buildHeaders(token, email),
      },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      console.error("[calendar BFF] GET cards — backend error:", body);
      return NextResponse.json(
        { error: "Failed to fetch cards" },
        { status: res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  },
);

// POST /api/calendar/events/:id/cards
export const POST = withBackend<RouteCtx>(
  "calendar cards POST",
  async ({ token, email }, request, { params }) => {
    const { id } = await params;

    const bodyResult = await parseBody(request, addCardBodySchema);
    if (!bodyResult.ok) return bodyResult.response;
    const body = bodyResult.data;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/calendar/events/${safeSegment(id)}/cards`,
      {
        method: "POST",
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
        .catch(() => ({ error: "Failed to add card" }));
      console.error("[calendar BFF] POST cards — backend error:", err);
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  },
);
