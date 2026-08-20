import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { API_URL } from "@/lib/apiUrl";
import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";
import { parseBody } from "@/lib/parseBody";
import { vitalsBeaconSchema } from "@/lib/schemas";

// POST /api/vitals
// open ingestion — no session check, just validate the shape and forward
export async function POST(request: NextRequest) {
  const result = await parseBody(request, vitalsBeaconSchema, 4_096);
  if (!result.ok) return result.response;

  try {
    const upstreamResult = await fetchUpstream(`${API_URL}/api/vitals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
    });
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    const data = await res.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: res.status });
  } catch (err) {
    console.error("[vitals BFF] POST — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

// GET /api/vitals
// fetches summary and by-page aggregates in parallel. Public — Web Vitals is
// site-wide, non-personal data. Forwards the visitor's token when they have
// one; a signed-out request goes through unauthenticated.
export async function GET(request: NextRequest) {
  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch {
    token = undefined;
  }

  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const v = request.nextUrl.searchParams.get("v");
  const query = v ? `?v=${encodeURIComponent(v)}` : "";

  try {
    // fetchUpstream, not a raw fetch: a slow backend used to hang this route for
    // as long as the API took to fail (the 71s stall documented in upstream.ts),
    // because a bare fetch has no deadline. Both calls now carry the 8s timeout.
    const [summaryResult, byPageResult] = await Promise.all([
      fetchUpstream(`${API_URL}/api/vitals/summary${query}`, { headers }),
      fetchUpstream(`${API_URL}/api/vitals/by-page${query}`, { headers }),
    ]);

    if (
      !summaryResult.ok ||
      !byPageResult.ok ||
      !summaryResult.response.ok ||
      !byPageResult.response.ok
    ) {
      const failed =
        !summaryResult.ok || !summaryResult.response.ok ? "summary" : "by-page";
      console.error(`[vitals BFF] GET — backend error on ${failed}`);
      return NextResponse.json(
        { error: "Failed to fetch vitals" },
        { status: 502 },
      );
    }

    const [{ summary }, { byPage }] = await Promise.all([
      summaryResult.response.json(),
      byPageResult.response.json(),
    ]);

    return NextResponse.json({ summary, byPage });
  } catch (err) {
    console.error("[vitals BFF] GET — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
