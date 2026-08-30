import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { withBackend, buildHeaders, API_URL } from "@/lib/backendFetch";

/**
 * GET /api/check-in/sites — the sites this organizer owns.
 */
export const GET = withBackend("check-in sites GET", async ({ token, email }) => {
  const upstreamResult = await fetchUpstream(`${API_URL}/api/check-in/sites`, {
    headers: buildHeaders(token, email),
    cache: "no-store",
  });
  if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
  const res = upstreamResult.response;
  return NextResponse.json(await res.json(), { status: res.status });
});

/**
 * POST /api/check-in/sites — create one.
 */
export const POST = withBackend(
  "check-in sites POST",
  async ({ token, email }, request) => {
    const body = await request.text();
    const upstreamResult = await fetchUpstream(`${API_URL}/api/check-in/sites`, {
      method: "POST",
      headers: buildHeaders(token, email, { "Content-Type": "application/json" }),
      body,
    });
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    return NextResponse.json(await res.json(), { status: res.status });
  },
);
