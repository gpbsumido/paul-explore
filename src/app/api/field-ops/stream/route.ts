import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/apiUrl";

export const dynamic = "force-dynamic";

/**
 * GET /api/field-ops/stream
 *
 * Pipes portfolio_api's event stream to the browser so the page stays
 * same-origin. The body is passed through untouched. There is no timeout on
 * it, because a stream is supposed to stay open; the client going away aborts
 * the upstream request.
 */
export async function GET(request: NextRequest) {
  const upstreamUrl = new URL(`${API_URL}/api/field-ops/stream`);
  const rate = request.nextUrl.searchParams.get("rate");
  if (rate) upstreamUrl.searchParams.set("rate", rate);

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      signal: request.signal,
      headers: { Accept: "text/event-stream" },
    });
  } catch (err) {
    console.error("[field-ops] stream fetch failed:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    console.error(`[field-ops] stream upstream ${upstream.status}`);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
