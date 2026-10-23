import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { API_URL, buildHeaders, withAdminBackend } from "@/lib/backendFetch";
import { safeSegment } from "@/lib/safeSegment";

type RouteCtx = { params: Promise<{ caseId: string }> };

const upstreamFor = (caseId: string) => `${API_URL}/api/evar/admin/references/${safeSegment(caseId)}`;

/**
 * PUT /api/evar/admin/references/:caseId — set a case's five reference values
 * by hand. Admin only here, and the API checks again with the caller's token.
 */
export const PUT = withAdminBackend<RouteCtx>("evar reference PUT", async ({ token, email }, request, { params }) => {
  const { caseId } = await params;
  const upstreamResult = await fetchUpstream(upstreamFor(caseId), {
    method: "PUT",
    headers: buildHeaders(token, email, { "Content-Type": "application/json" }),
    body: await request.text(),
  });
  if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
  const res = upstreamResult.response;
  return NextResponse.json(await res.json(), { status: res.status });
});

/**
 * DELETE /api/evar/admin/references/:caseId — back to the phantom's own
 * geometry. A 204 has no body, so it's passed on empty.
 */
export const DELETE = withAdminBackend<RouteCtx>("evar reference DELETE", async ({ token, email }, _request, { params }) => {
  const { caseId } = await params;
  const upstreamResult = await fetchUpstream(upstreamFor(caseId), {
    method: "DELETE",
    headers: buildHeaders(token, email),
  });
  if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
  const res = upstreamResult.response;
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json(await res.json(), { status: res.status });
});
