import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { type NextRequest, NextResponse } from "next/server";
import { API_URL, buildHeaders, withBackend } from "@/lib/backendFetch";
import { auth0 } from "@/lib/auth0";

// GET /api/zeroproof/leagues — discover public leagues (?q=) or resolve one by
// invite code (?code=). Public: the list renders for signed-out visitors; a
// token is forwarded when present. Only q and code are passed through.
export async function GET(request: NextRequest) {
  const incoming = new URL(request.url).searchParams;
  const qs = new URLSearchParams();
  for (const param of ["q", "code"]) {
    const value = incoming.get(param);
    if (value) qs.set(param, value);
  }
  const suffix = qs.toString() ? `?${qs}` : "";

  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch {
    token = undefined;
  }

  try {
    const result = await fetchUpstream(`${API_URL}/api/zeroproof/leagues${suffix}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!result.ok) return upstreamErrorResponse(result);
    if (!result.response.ok) {
      return NextResponse.json({ error: "Failed to load leagues" }, { status: result.response.status });
    }
    const data = await result.response.json();
    return NextResponse.json({ leagues: data.leagues ?? [] });
  } catch (err) {
    console.error("[BFF] GET /zeroproof/leagues — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

// POST /api/zeroproof/leagues — create a league (commissioner). Auth required.
export const POST = withBackend("zeroproof create league", async ({ token }, request) => {
  const body = await request.json().catch(() => ({}));
  const result = await fetchUpstream(`${API_URL}/api/zeroproof/leagues`, {
    method: "POST",
    // JSON content-type required, or the backend's express.json() leaves the
    // body unparsed and every field reads as missing.
    headers: buildHeaders(token, null, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!result.ok) return upstreamErrorResponse(result);
  const payload = await result.response.json().catch(() => null);
  return NextResponse.json(payload ?? { error: "Failed to create league" }, {
    status: result.response.status,
  });
});
