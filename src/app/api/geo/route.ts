import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/apiUrl";
import { clientIp } from "@/lib/clientIp";

/**
 * GET /api/geo
 *
 * Forwards the geo lookup to portfolio_api, passing the real client IP so
 * the result reflects the visitor's location (not the Next.js server's IP).
 */
export async function GET(req: NextRequest) {
  const ip = clientIp(req);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/geo`, {
      signal: AbortSignal.timeout(8_000),
      headers: {
        Accept: "application/json",
        "X-Forwarded-For": ip,
      },
    });
  } catch (err) {
    // A node fetch failure carries the internal host and port. This route is
    // unauthenticated, so anyone can trigger it while the backend is down and
    // read the topology out of the error body. Log it, return a fixed string,
    // same as every other route here.
    console.error("[geo] upstream fetch failed:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[geo] upstream ${res.status}:`, body);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }

  const data: unknown = await res.json();
  // Geo results are stable for a session — private so CDNs don't share between users
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, max-age=300" },
  });
}
