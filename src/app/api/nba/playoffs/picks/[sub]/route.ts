import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/backendFetch";

function currentSeasonYear(): number {
  const now = new Date();
  return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
}

/**
 * GET /api/nba/playoffs/picks/[sub]
 * Public endpoint to view any user's submitted bracket picks by Auth0 sub.
 * Requires the backend to expose a public picks-by-sub endpoint.
 * Returns 404 if picks are unavailable.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sub: string }> },
) {
  const { sub } = await params;
  const season = currentSeasonYear();

  try {
    const res = await fetch(
      `${API_URL}/api/nba/playoffs/picks/${season}/public?sub=${encodeURIComponent(sub)}`,
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
