import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/apiUrl";
import { parseBody } from "@/lib/parseBody";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { zeroproofTrackBatchSchema } from "@/lib/schemas";

// sendBeacon caps the payload near 64KB; match it so an oversized body is
// rejected here rather than failing silently at the browser.
const MAX_BYTES = 64_000;

// POST /api/zeroproof/track
// Open ingestion — no session check. Anonymous telemetry from signed-out
// visitors too. The proxy rate-limits it by IP (see rateLimitRules), then it is
// validated here and forwarded to the backend.
export async function POST(request: NextRequest) {
  const result = await parseBody(request, zeroproofTrackBatchSchema, MAX_BYTES);
  if (!result.ok) return result.response;

  try {
    const upstream = await fetchUpstream(`${API_URL}/api/zeroproof/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
    });
    if (!upstream.ok) return upstreamErrorResponse(upstream);

    const res = upstream.response;
    const data = await res.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: res.status });
  } catch (err) {
    console.error("[zeroproof track BFF] POST — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
