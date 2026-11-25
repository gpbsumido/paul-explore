import { NextResponse } from "next/server";
import { API_URL } from "@/lib/apiUrl";
import { UPSTREAM_TIMEOUT_MS } from "@/lib/upstream";

export const dynamic = "force-dynamic";

/** GET /api/field-ops/snapshot: portfolio_api's fake field picture, same-origin. */
export async function GET() {
  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/api/field-ops/snapshot`, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    console.error("[field-ops] snapshot fetch failed:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
  if (!upstream.ok) {
    console.error(`[field-ops] snapshot upstream ${upstream.status}`);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
  return NextResponse.json(await upstream.json(), {
    headers: { "Cache-Control": "no-store" },
  });
}
