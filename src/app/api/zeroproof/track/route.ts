import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/apiUrl";
import { parseBody } from "@/lib/parseBody";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { checkRateLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { zeroproofTrackBatchSchema } from "@/lib/schemas";

// A client batches at ~20 events / 5s, so a real visitor sends ~12 batches a
// minute at most. 60 gives generous headroom while still capping a flood.
const RATE_LIMIT = 60;
const WINDOW_MS = 60_000;
// sendBeacon caps the payload near 64KB; match it so an oversized body is
// rejected here rather than failing silently at the browser.
const MAX_BYTES = 64_000;

// POST /api/zeroproof/track
// Open ingestion — no session check. Anonymous telemetry from signed-out
// visitors too. Rate-limited by IP, validated, then forwarded to the backend.
export async function POST(request: NextRequest) {
  const { allowed } = checkRateLimit(clientIp(request), "zeroproof-track", RATE_LIMIT, WINDOW_MS);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

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
