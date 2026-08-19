import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { safeSegment } from "@/lib/safeSegment";

type RouteCtx = { params: Promise<{ id: string }> };

// DELETE /api/calendar/calendars/:id/google
// Stops the Google Calendar watch channel and unlinks the Google Calendar from
// this calendar row. Does not delete the Google Calendar itself.
export const DELETE = withBackend<RouteCtx>(
  "calendars google DELETE",
  async ({ token, email }, _request, { params }) => {
    const { id } = await params;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/calendar/calendars/${safeSegment(id)}/google`,
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
        .catch(() => ({ error: "Failed to disconnect Google Calendar" }));
      console.error("[calendars BFF] DELETE google — backend error:", err);
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  },
);
