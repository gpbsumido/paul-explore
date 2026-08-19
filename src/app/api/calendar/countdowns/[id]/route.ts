import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { updateCountdownBodySchema } from "@/lib/schemas";
import { parseBody } from "@/lib/parseBody";
import { safeSegment } from "@/lib/safeSegment";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/calendar/countdowns/:id
export const GET = withBackend<RouteCtx>(
  "countdown GET",
  async ({ token, email }, _request, { params }) => {
    const { id } = await params;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/calendar/countdowns/${safeSegment(id)}`,
      {
        headers: buildHeaders(token, email),
      },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      console.error("[countdowns BFF] GET by id — backend error:", body);
      return NextResponse.json(
        { error: "Failed to fetch countdown" },
        { status: res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  },
);

// PUT /api/calendar/countdowns/:id
// partial update, only the fields you pass get changed
export const PUT = withBackend<RouteCtx>(
  "countdown PUT",
  async ({ token, email }, request, { params }) => {
    const { id } = await params;

    const bodyResult = await parseBody(request, updateCountdownBodySchema);
    if (!bodyResult.ok) return bodyResult.response;
    const body = bodyResult.data;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/calendar/countdowns/${safeSegment(id)}`,
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
        .catch(() => ({ error: "Failed to update countdown" }));
      console.error("[countdowns BFF] PUT — backend error:", err);
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  },
);

// DELETE /api/calendar/countdowns/:id
export const DELETE = withBackend<RouteCtx>(
  "countdown DELETE",
  async ({ token, email }, _request, { params }) => {
    const { id } = await params;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/calendar/countdowns/${safeSegment(id)}`,
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
        .catch(() => ({ error: "Failed to delete countdown" }));
      console.error("[countdowns BFF] DELETE — backend error:", err);
      return NextResponse.json(err, { status: res.status });
    }
    return new NextResponse(null, { status: 204 });
  },
);
