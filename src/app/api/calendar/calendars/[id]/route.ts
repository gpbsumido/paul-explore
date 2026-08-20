import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { updateCalendarBodySchema } from "@/lib/schemas";
import { parseBody } from "@/lib/parseBody";
import { safeSegment } from "@/lib/safeSegment";

type RouteCtx = { params: Promise<{ id: string }> };

// PUT /api/calendar/calendars/:id
export const PUT = withBackend<RouteCtx>(
  "calendars PUT",
  async ({ token, email }, request, { params }) => {
    const { id } = await params;

    const bodyResult = await parseBody(request, updateCalendarBodySchema);
    if (!bodyResult.ok) return bodyResult.response;
    const body = bodyResult.data;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/calendar/calendars/${safeSegment(id)}`,
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
        .catch(() => ({ error: "Failed to update calendar" }));
      console.error("[calendars BFF] PUT — backend error:", err);
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  },
);

// DELETE /api/calendar/calendars/:id
export const DELETE = withBackend<RouteCtx>(
  "calendars DELETE",
  async ({ token, email }, _request, { params }) => {
    const { id } = await params;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/calendar/calendars/${safeSegment(id)}`,
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
        .catch(() => ({ error: "Failed to delete calendar" }));
      console.error("[calendars BFF] DELETE — backend error:", err);
      return NextResponse.json(err, { status: res.status });
    }
    return new NextResponse(null, { status: 204 });
  },
);
