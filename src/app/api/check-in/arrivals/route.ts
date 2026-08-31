import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { withBackend, buildHeaders, API_URL } from "@/lib/backendFetch";

/**
 * POST /api/check-in/arrivals — a volunteer submitting the code on the display.
 *
 * The upstream's status carries meaning the page renders differently (400 wrong
 * or expired, 429 too many attempts, 200 already checked in, 201 recorded), so
 * it is passed through rather than flattened.
 */
export const POST = withBackend(
  "check-in arrival POST",
  async ({ token, email }, request) => {
    const body = await request.text();
    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/check-in/arrivals`,
      {
        method: "POST",
        headers: buildHeaders(token, email, {
          "Content-Type": "application/json",
        }),
        body,
      },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    return NextResponse.json(await res.json(), { status: res.status });
  },
);
