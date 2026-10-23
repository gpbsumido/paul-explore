import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { API_URL } from "@/lib/backendFetch";

/**
 * GET /api/evar/references — reference answers an admin has set by hand.
 * Public, because anonymous practice is scored against them too. Not cached,
 * so a correction shows up on the next load.
 */
export async function GET() {
  const upstreamResult = await fetchUpstream(`${API_URL}/api/evar/references`, { cache: "no-store" });
  if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
  const res = upstreamResult.response;
  return NextResponse.json(await res.json(), { status: res.status });
}
