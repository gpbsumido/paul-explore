import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { updateMemberRoleBodySchema } from "@/lib/schemas";
import { parseBody } from "@/lib/parseBody";
import { safeSegment } from "@/lib/safeSegment";

type RouteCtx = { params: Promise<{ id: string; memberSub: string }> };

/** PUT /api/calendar/calendars/:id/members/:memberSub — body: { role } → { member } */
export const PUT = withBackend<RouteCtx>(
  "members PUT",
  async ({ token, email }, request, { params }) => {
    // Next.js decodes dynamic segments automatically — use as-is when forwarding
    const { id, memberSub } = await params;

    const bodyResult = await parseBody(request, updateMemberRoleBodySchema);
    if (!bodyResult.ok) return bodyResult.response;
    const body = bodyResult.data;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/calendar/calendars/${safeSegment(id)}/members/${encodeURIComponent(memberSub)}`,
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
        .catch(() => ({ error: "Failed to update member role" }));
      return NextResponse.json(err, { status: res.status });
    }
    return NextResponse.json(await res.json());
  },
);

/**
 * DELETE /api/calendar/calendars/:id/members/:memberSub
 * Backend returns 200 { googleAclRemoved: boolean } — forward it so the
 * frontend can warn when Google access was not successfully revoked.
 */
export const DELETE = withBackend<RouteCtx>(
  "members DELETE",
  async ({ token, email }, _request, { params }) => {
    const { id, memberSub } = await params;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/calendar/calendars/${safeSegment(id)}/members/${encodeURIComponent(memberSub)}`,
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
        .catch(() => ({ error: "Failed to remove member" }));
      return NextResponse.json(err, { status: res.status });
    }
    return NextResponse.json(await res.json());
  },
);
