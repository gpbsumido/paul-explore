import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/backendFetch";
import { safeSegment } from "@/lib/safeSegment";
import { currentNbaSeason } from "@/lib/nbaSeason";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/nba/playoffs/picks/[sub]
 * Public endpoint — accepts either a username (profiled users) or a bracket UUID
 * (anonymous users). Forwards the right query param to the backend. 404 means
 * no bracket; anything else that goes wrong upstream is a 502 with a reason.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sub: string }> },
) {
  const { sub: identifier } = await params;
  const season = currentNbaSeason();
  const param = UUID_RE.test(identifier)
    ? `bracketId=${encodeURIComponent(identifier)}`
    : `username=${encodeURIComponent(identifier)}`;

  const upstreamResult = await fetchUpstream(
    `${API_URL}/api/nba/playoffs/picks/${safeSegment(season)}/public?${param}`,
    { next: { revalidate: 60 } },
  );
  if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
  const res = upstreamResult.response;

  // Only the backend saying "no such bracket" is a 404. A failing backend used
  // to come back as 404 too, which told the viewer the bracket didn't exist.
  if (res.status === 404) {
    return NextResponse.json({ picks: null }, { status: 404 });
  }
  const data: unknown = res.ok ? await res.json().catch(() => undefined) : undefined;
  if (data === undefined) {
    return NextResponse.json({ error: "Couldn't load these picks right now" }, { status: 502 });
  }
  return NextResponse.json(data);
}
