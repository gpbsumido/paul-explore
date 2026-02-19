import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ season: string }> },
) {
  const { season } = await params;

  try {
    const res = await fetch(
      `https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/${season}/segments/0/leagues/449389534?view=mTeam&view=mRoster&view=mSettings`,
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch league data" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "ESPN API unavailable" },
      { status: 502 },
    );
  }
}
