import { NextResponse, type NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

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
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `geo fetch failed: ${msg}` },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[geo] upstream ${res.status}:`, body);
    return NextResponse.json(
      { error: `geo upstream error (${res.status})` },
      { status: 502 },
    );
  }

  const data: unknown = await res.json();
  return NextResponse.json(data);
}
