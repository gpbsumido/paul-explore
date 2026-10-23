import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { withBackend, buildHeaders, API_URL } from "@/lib/backendFetch";

const UPSTREAM = `${API_URL}/api/evar/participant`;

/**
 * GET /api/evar/participant — whether the caller has joined the EVAR study,
 * and their profile if so.
 */
export const GET = withBackend("evar participant GET", async ({ token, email }) => {
  const upstreamResult = await fetchUpstream(UPSTREAM, {
    headers: buildHeaders(token, email),
    cache: "no-store",
  });
  if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
  const res = upstreamResult.response;
  return NextResponse.json(await res.json(), { status: res.status });
});

/**
 * PUT /api/evar/participant — join, or update the profile.
 */
export const PUT = withBackend("evar participant PUT", async ({ token, email }, request) => {
  const upstreamResult = await fetchUpstream(UPSTREAM, {
    method: "PUT",
    headers: buildHeaders(token, email, { "Content-Type": "application/json" }),
    body: await request.text(),
  });
  if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
  const res = upstreamResult.response;
  return NextResponse.json(await res.json(), { status: res.status });
});

/**
 * DELETE /api/evar/participant — withdraw, deleting every recorded attempt.
 * A 204 has no body to read, so it's passed on empty.
 */
export const DELETE = withBackend("evar participant DELETE", async ({ token, email }) => {
  const upstreamResult = await fetchUpstream(UPSTREAM, {
    method: "DELETE",
    headers: buildHeaders(token, email),
  });
  if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
  const res = upstreamResult.response;
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json(await res.json(), { status: res.status });
});
