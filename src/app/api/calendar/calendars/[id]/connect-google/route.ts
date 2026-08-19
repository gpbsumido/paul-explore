import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { safeSegment } from "@/lib/safeSegment";

type RouteCtx = { params: Promise<{ id: string }> };

// POST /api/calendar/calendars/:id/connect-google
export const POST = withBackend<RouteCtx>(
  "calendars connect-google POST",
  async ({ token, email }, _request, { params }) => {
    const { id } = await params;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/calendar/calendars/${safeSegment(id)}/connect-google`,
      {
        method: "POST",
        headers: buildHeaders(token, email),
      },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Failed to connect Google Calendar" }));
      console.error(
        "[calendars BFF] POST connect-google — backend error:",
        err,
      );
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  },
);
