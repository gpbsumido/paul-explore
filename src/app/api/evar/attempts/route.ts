import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { withBackend, buildHeaders, API_URL } from "@/lib/backendFetch";

const UPSTREAM = `${API_URL}/api/evar/attempts`;

/**
 * GET /api/evar/attempts — the caller's own recorded attempts, newest first.
 */
export const GET = withBackend("evar attempts GET", async ({ token, email }) => {
  const upstreamResult = await fetchUpstream(UPSTREAM, {
    headers: buildHeaders(token, email),
    cache: "no-store",
  });
  if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
  const res = upstreamResult.response;
  return NextResponse.json(await res.json(), { status: res.status });
});

/**
 * POST /api/evar/attempts — record one. The upstream status comes back as is:
 * 201 for a new attempt, 200 for a resend, 403 without consent.
 */
export const POST = withBackend("evar attempts POST", async ({ token, email }, request) => {
  const upstreamResult = await fetchUpstream(UPSTREAM, {
    method: "POST",
    headers: buildHeaders(token, email, { "Content-Type": "application/json" }),
    body: await request.text(),
  });
  if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
  const res = upstreamResult.response;
  return NextResponse.json(await res.json(), { status: res.status });
});
