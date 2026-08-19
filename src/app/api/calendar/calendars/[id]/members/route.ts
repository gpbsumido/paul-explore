import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { inviteMemberBodySchema } from "@/lib/schemas";
import { parseBody } from "@/lib/parseBody";
import { safeSegment } from "@/lib/safeSegment";

type RouteCtx = { params: Promise<{ id: string }> };

/** GET /api/calendar/calendars/:id/members — returns { members: [...] } */
export const GET = withBackend<RouteCtx>(
  "members GET",
  async ({ token, email }, _request, { params }) => {
    const { id } = await params;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/calendar/calendars/${safeSegment(id)}/members`,
      {
        headers: buildHeaders(token, email),
      },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Failed to fetch members" }));
      return NextResponse.json(err, { status: res.status });
    }
    return NextResponse.json(await res.json());
  },
);

/** POST /api/calendar/calendars/:id/members — body: { email, role? } → 201 { member } */
export const POST = withBackend<RouteCtx>(
  "members POST",
  async ({ token, email }, request, { params }) => {
    const { id } = await params;

    const bodyResult = await parseBody(request, inviteMemberBodySchema);
    if (!bodyResult.ok) return bodyResult.response;
    const body = bodyResult.data;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/calendar/calendars/${safeSegment(id)}/members`,
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
        .catch(() => ({ error: "Failed to invite member" }));
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  },
);
