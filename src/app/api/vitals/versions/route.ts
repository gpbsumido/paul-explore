import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { API_URL } from "@/lib/apiUrl";
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

// GET /api/vitals/versions — returns { versions: string[] }
// Public (same pattern as /api/vitals GET): forwards a token when present,
// otherwise goes through unauthenticated.
export async function GET() {
  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch {
    token = undefined;
  }

  try {
    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/vitals/versions`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;

    if (!res.ok) {
      console.error("[vitals BFF] GET /versions — backend error:", res.status);
      return NextResponse.json(
        { error: "Failed to fetch versions" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json({ versions: data.versions ?? [] });
  } catch (err) {
    console.error("[vitals BFF] GET /versions — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
