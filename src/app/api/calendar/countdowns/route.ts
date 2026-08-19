import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { createCountdownBodySchema } from "@/lib/schemas";
import { parseBody } from "@/lib/parseBody";

// GET /api/calendar/countdowns?cursor=<cursor>
// returns one page of countdowns sorted by target date ascending.
// forwards the cursor query param to the backend unchanged.
export const GET = withBackend(
  "countdowns GET",
  async ({ token, email }, request) => {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    if (cursor !== null && !/^[\w+/=\-]{1,512}$/.test(cursor)) {
      return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
    }

    const backendUrl = cursor
      ? `${API_URL}/api/calendar/countdowns?cursor=${encodeURIComponent(cursor)}`
      : `${API_URL}/api/calendar/countdowns`;

    const upstreamResult = await fetchUpstream(backendUrl, {
      headers: buildHeaders(token, email),
    });
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      console.error("[countdowns BFF] GET — backend error:", body);
      return NextResponse.json(
        { error: "Failed to fetch countdowns" },
        { status: res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  },
);

// POST /api/calendar/countdowns
// body: { title, description?, targetDate, color }
export const POST = withBackend(
  "countdowns POST",
  async ({ token, email }, request) => {
    const bodyResult = await parseBody(request, createCountdownBodySchema);
    if (!bodyResult.ok) return bodyResult.response;
    const body = bodyResult.data;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/calendar/countdowns`,
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
        .catch(() => ({ error: "Failed to create countdown" }));
      console.error("[countdowns BFF] POST — backend error:", err);
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  },
);
