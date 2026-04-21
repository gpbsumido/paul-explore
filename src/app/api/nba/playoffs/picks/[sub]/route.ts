import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/backendFetch";

function currentSeasonYear(): number {
  const now = new Date();
  return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/nba/playoffs/picks/[sub]
 * Public endpoint — accepts either a username (profiled users) or a bracket UUID
 * (anonymous users). Forwards the right query param to the backend.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sub: string }> },
) {
  const { sub: identifier } = await params;
  const season = currentSeasonYear();
  const param = UUID_RE.test(identifier)
    ? `bracketId=${encodeURIComponent(identifier)}`
    : `username=${encodeURIComponent(identifier)}`;

  try {
    const res = await fetch(
      `${API_URL}/api/nba/playoffs/picks/${season}/public?${param}`,
      { next: { revalidate: 60 } },
    );

    if (!res.ok) {
      return NextResponse.json({ picks: null }, { status: 404 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ picks: null }, { status: 404 });
  }
}
